// Import required modules (like Python's import statements)
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { marked } = require('marked');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const sizeOf = require('image-size');

// Import our database module (like: from database import get_all_notes, etc.)
const db = require('./database');

// Configure multer for file uploads (for database restore)
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Configure multer for image uploads
const imageUpload = multer({
    dest: 'uploads/temp/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP, SVG'));
        }
    }
});

// Import wiki-link extension for marked.js
const wikiLinkExtension = require('./public/js/wikilink-extension');

// Constants
const SALT_ROUNDS = 12; // bcrypt cost factor

// Create Express app (equivalent to Flask's app = Flask(__name__))
const app = express();
// Use PORT environment variable if set (for Docker/production), otherwise default to 3000
const PORT = process.env.PORT || 3000;

// Helper functions for image handling
function sanitizeFilename(filename) {
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 100);
    return `${Date.now()}_${basename}${ext}`;
}

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
ensureDirectoryExists(uploadsDir);

// Middleware - similar to Flask's before_request or app.config
app.use(express.json()); // Parse JSON request bodies

// Serve static files with cache control headers
// HTML files: no-cache (always check for updates)
// CSS/JS files: short cache time (1 hour)
app.use(express.static('public', {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            // HTML files should always be revalidated
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (path.endsWith('.js') || path.endsWith('.css')) {
            // CSS/JS can be cached briefly (1 hour)
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// Session middleware for authentication
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.db',
        dir: process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : '.'
    }),
    secret: process.env.SESSION_SECRET || 'notecottage-dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // Only use secure cookies if explicitly enabled (when behind HTTPS proxy)
        // Default to false to allow HTTP access (e.g., http://localhost:3000)
        secure: process.env.SECURE_COOKIES === 'true',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Prevent caching of all API responses
// This prevents browsers from caching authentication state and other dynamic data
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = db.getUserById(req.session.userId);
    if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = user;
    next();
}

function attachUser(req, res, next) {
    if (req.session.userId) {
        req.user = db.getUserById(req.session.userId);
    }
    next();
}

// Helper function to render markdown with wiki-links
function renderMarkdownWithWikiLinks(content, titleMap) {
    // Create custom renderer for wiki-links
    const renderer = (token) => {
        const key = token.noteTitle.toLowerCase();
        const targetNote = titleMap.get(key);

        if (targetNote) {
            // Valid link - render as clickable anchor
            return `<a href="#" class="wiki-link" data-note-id="${targetNote.id}">${token.displayText}</a>`;
        } else {
            // Broken link - render as grayed out span
            return `<span class="wiki-link-broken" title="Note not found">${token.displayText}</span>`;
        }
    };

    // Create extension with custom renderer
    const extension = {
        ...wikiLinkExtension,
        renderer
    };

    // Configure marked with the extension
    marked.use({ extensions: [extension] });

    // Render markdown to HTML
    return marked(content);
}

// Routes (similar to Flask's @app.route decorators)

// ============================================
// Authentication Routes
// ============================================

// POST /api/auth/register - Create new user account
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check username format (3-20 chars, alphanumeric + underscore)
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            return res.status(400).json({ error: 'Username must be 3-20 characters (letters, numbers, underscore)' });
        }

        // Check email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check registration enabled setting
        const registrationEnabled = db.getSetting('registration_enabled');
        const userCount = db.getUserCount();

        if (userCount > 0 && registrationEnabled === 'false') {
            return res.status(403).json({ error: 'Registration is currently disabled' });
        }

        // Check max users limit
        const maxUsers = parseInt(db.getSetting('max_users'));
        if (userCount >= maxUsers) {
            return res.status(403).json({ error: 'Maximum user limit reached' });
        }

        // Check if username or email already exists
        if (db.getUserByUsername(username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        if (db.getUserByEmail(email)) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user (first user is admin)
        const isFirstUser = userCount === 0;
        const user = db.createUser(username, email, passwordHash, displayName || null, isFirstUser);

        // If first user, create their personal "Uncategorized" folder
        if (isFirstUser) {
            db.createFolder('Uncategorized', null, null, '📂');
            const folder = db.db.prepare('SELECT id FROM folders WHERE name = ? ORDER BY id DESC LIMIT 1').get('Uncategorized');
            db.db.prepare('UPDATE folders SET user_id = ?, is_public = 0 WHERE id = ?').run(user.id, folder.id);
        } else {
            // Create per-user Uncategorized folder
            const folder = db.createFolder(`${username}'s Notes`, null, null, '📂');
            db.db.prepare('UPDATE folders SET user_id = ?, is_public = 0 WHERE id = ?').run(user.id, folder.id);
        }

        // Log them in
        req.session.userId = user.id;

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            is_admin: user.is_admin
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/login - Login with credentials
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username or email
        let user = db.getUserByUsername(username);
        if (!user) {
            user = db.getUserByEmail(username); // Allow login with email too
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create session
        req.session.userId = user.id;

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            is_admin: user.is_admin
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/logout - Destroy session
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// GET /api/auth/status - Public endpoint to check if users exist (no auth required)
app.get('/api/auth/status', (req, res) => {
    const userCount = db.getUserCount();
    const registrationEnabled = db.getSetting('registration_enabled');

    res.json({
        hasUsers: userCount > 0,
        userCount: userCount,
        registrationEnabled: registrationEnabled === 'true'
    });
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', requireAuth, (req, res) => {
    const user = db.getUserById(req.session.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        is_admin: user.is_admin,
        created_at: user.created_at
    });
});

// PUT /api/auth/profile - Update user profile
app.put('/api/auth/profile', requireAuth, async (req, res) => {
    try {
        const { displayName, currentPassword, newPassword } = req.body;
        const userId = req.session.userId;

        // Update display name if provided
        if (displayName !== undefined) {
            db.updateUserProfile(userId, displayName || null);
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ error: 'Current password is required to change password' });
            }

            // Verify current password
            const user = db.getUserByUsername(db.getUserById(userId).username);
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Validate new password
            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'New password must be at least 8 characters' });
            }

            // Hash and update
            const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
            db.updateUserPassword(userId, passwordHash);
        }

        const updatedUser = db.getUserById(userId);
        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            display_name: updatedUser.display_name,
            is_admin: updatedUser.is_admin
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/stats - Get current user's statistics
app.get('/api/auth/stats', requireAuth, (req, res) => {
    try {
        const userId = req.session.userId;
        const stats = db.getUserStatistics(userId);
        res.json(stats);
    } catch (error) {
        console.error('Error getting user statistics:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// DELETE /api/auth/account - Delete own account
app.delete('/api/auth/account', requireAuth, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.session.userId;

        // Verify password
        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Incorrect password' });
        }

        // Cannot delete if you're the last admin
        if (user.is_admin) {
            const adminCount = db.getAdminCount();
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin account' });
            }
        }

        // Delete user (cascades to notes and folders)
        db.deleteUser(userId);

        // Destroy session
        req.session.destroy();

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// ============================================
// Admin Panel Routes (Admin Only)
// ============================================

// GET /api/admin/users - List all users
app.get('/api/admin/users', requireAdmin, (req, res) => {
    try {
        const users = db.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// POST /api/admin/users - Create new user
app.post('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const { username, email, displayName, password, isAdmin } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Check if username or email already exists
        const existingUser = db.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const existingEmail = db.getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const userId = db.createUser(username, email, hashedPassword, displayName, isAdmin ? 1 : 0);

        // Create personal Uncategorized folder (name, parentId, color, icon, userId, isPublic)
        db.createFolder('Uncategorized', null, null, '📝', userId, 0);

        res.json({ id: userId, message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /api/admin/users/:id - Update user
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email, displayName, password, isAdmin } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if new username conflicts
        if (username && username !== user.username) {
            const existingUser = db.getUserByUsername(username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
        }

        // Check if new email conflicts
        if (email && email !== user.email) {
            const existingEmail = db.getUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ error: 'Email already exists' });
            }
        }

        // Prevent removing last admin
        if (isAdmin === false) {
            const allUsers = db.getAllUsers();
            const adminCount = allUsers.filter(u => u.is_admin === 1).length;
            if (adminCount === 1 && user.is_admin === 1) {
                return res.status(400).json({ error: 'Cannot remove admin privileges from the last admin' });
            }
        }

        // Update fields
        if (username) {
            db.updateUserField(userId, 'username', username);
        }
        if (email) {
            db.updateUserField(userId, 'email', email);
        }
        if (displayName !== undefined) {
            db.updateUserField(userId, 'display_name', displayName);
        }
        if (isAdmin !== undefined) {
            db.updateUserField(userId, 'is_admin', isAdmin ? 1 : 0);
        }
        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            db.updateUserField(userId, 'password_hash', hashedPassword);
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/admin/users/:id - Delete user and their private content
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const adminId = req.session.userId;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent deleting yourself
        if (userId === adminId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Prevent deleting the last admin
        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.is_admin) {
            const adminCount = db.getAdminCount();
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin' });
            }
        }

        // Delete user (CASCADE will handle their folders and notes)
        const deleted = db.deleteUser(userId);

        if (!deleted) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// PUT /api/admin/users/:id/password - Reset user's password
app.put('/api/admin/users/:id/password', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        const updated = db.updateUserPassword(userId, passwordHash);

        if (!updated) {
            return res.status(500).json({ error: 'Failed to update password' });
        }

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// PUT /api/admin/users/:id/admin - Toggle admin status
app.put('/api/admin/users/:id/admin', requireAdmin, (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { is_admin } = req.body;
        const adminId = req.session.userId;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // Prevent removing your own admin status
        if (userId === adminId && !is_admin) {
            return res.status(400).json({ error: 'Cannot remove your own admin status' });
        }

        const user = db.getUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent removing admin from last admin
        if (user.is_admin && !is_admin) {
            const adminCount = db.getAdminCount();
            if (adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove admin status from the last admin' });
            }
        }

        const updated = db.updateUserAdmin(userId, is_admin);

        if (!updated) {
            return res.status(500).json({ error: 'Failed to update admin status' });
        }

        res.json({ message: 'Admin status updated successfully' });
    } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ error: 'Failed to update admin status' });
    }
});

// GET /api/admin/settings - Get system settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
    try {
        const settings = db.getAllSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// PUT /api/admin/settings - Update system settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
    try {
        const { registration_enabled, max_users, app_name } = req.body;

        if (registration_enabled !== undefined) {
            db.updateSetting('registration_enabled', registration_enabled.toString());
        }

        if (max_users !== undefined) {
            const maxUsersInt = parseInt(max_users);
            if (isNaN(maxUsersInt) || maxUsersInt < 1 || maxUsersInt > 20) {
                return res.status(400).json({ error: 'Max users must be between 1 and 20' });
            }
            db.updateSetting('max_users', maxUsersInt.toString());
        }

        if (app_name !== undefined) {
            if (!app_name || app_name.trim().length === 0) {
                return res.status(400).json({ error: 'App name cannot be empty' });
            }
            db.updateSetting('app_name', app_name.trim());
        }

        const updatedSettings = db.getAllSettings();
        res.json(updatedSettings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// GET /api/admin/stats - Get system statistics
app.get('/api/admin/stats', requireAdmin, (req, res) => {
    try {
        const userCount = db.getUserCount();
        const allNotes = db.getAllNotes();
        const allFolders = db.getAllFolders();

        // Count public vs private notes
        let publicNoteCount = 0;
        let privateNoteCount = 0;

        allNotes.forEach(note => {
            const folder = db.getFolderById(note.folder_id);
            if (folder && folder.is_public === 1) {
                publicNoteCount++;
            } else {
                privateNoteCount++;
            }
        });

        const stats = {
            user_count: userCount,
            total_notes: allNotes.length,
            public_notes: publicNoteCount,
            private_notes: privateNoteCount,
            total_folders: allFolders.length,
            total_tags: db.getAllTags().length
        };

        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
});

// GET /api/admin/backup - Download database backup
app.get('/api/admin/backup', requireAdmin, (req, res) => {
    try {
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'notecottage.db');

        // Check if database file exists
        if (!fs.existsSync(dbPath)) {
            return res.status(404).json({ error: 'Database file not found' });
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const filename = `notecottage-backup-${timestamp}.db`;

        // Set headers for file download
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Stream the database file
        const fileStream = fs.createReadStream(dbPath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('Error streaming database backup:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to download backup' });
            }
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// POST /api/admin/restore - Restore database from backup
app.post('/api/admin/restore', requireAdmin, upload.single('database'), async (req, res) => {
    let uploadedFilePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        uploadedFilePath = req.file.path;
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'notecottage.db');

        // Validate it's a SQLite database
        const fileBuffer = fs.readFileSync(uploadedFilePath);
        const header = fileBuffer.toString('utf8', 0, 15);
        if (!header.startsWith('SQLite format 3')) {
            fs.unlinkSync(uploadedFilePath); // Clean up invalid file
            return res.status(400).json({ error: 'Invalid database file. Must be a SQLite database.' });
        }

        // Create a backup of current database before restoring
        const backupPath = `${dbPath}.pre-restore-${Date.now()}.backup`;
        fs.copyFileSync(dbPath, backupPath);
        console.log(`Created safety backup at: ${backupPath}`);

        // Close database connection
        db.db.close();

        // Replace database file
        fs.copyFileSync(uploadedFilePath, dbPath);

        // Clean up uploaded file
        fs.unlinkSync(uploadedFilePath);

        console.log('Database restored successfully. Server will restart...');

        // Send response before exiting
        res.json({
            message: 'Database restored successfully. Server is restarting...',
            backupPath: backupPath
        });

        // Exit process to trigger restart (if using process manager like PM2 or Docker)
        // This allows the database connection to reinitialize properly
        setTimeout(() => {
            process.exit(0);
        }, 500);

    } catch (error) {
        console.error('Error restoring database:', error);

        // Clean up uploaded file on error
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
            fs.unlinkSync(uploadedFilePath);
        }

        res.status(500).json({ error: 'Failed to restore database: ' + error.message });
    }
});

// ============================================
// Main Application Routes
// ============================================

// GET / - Serve the main page
app.get('/', (req, res) => {
    // Prevent caching of index.html to avoid stale content issues
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET /api/notes - List notes accessible to the current user
app.get('/api/notes', requireAuth, (req, res) => {
    try {
        // Get notes filtered by user permissions
        const notes = db.getNotesForUser(req.session.userId);

        // Format notes for the frontend
        const formattedNotes = notes.map(note => ({
            id: note.id.toString(), // Convert to string for consistency with old file-based IDs
            title: note.title,
            preview: note.preview,
            type: note.type || 'markdown', // Include note type (default to markdown for backward compatibility)
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes:', error);
        res.status(500).json({ error: 'Failed to read notes' });
    }
});

// GET /api/notes/:id - Get a specific note
app.get('/api/notes/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const note = db.getNoteById(noteId);

        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Get tags for this note
        const tags = db.getTagsForNote(noteId).map(tag => tag.name);

        // Build title map for wiki-link resolution
        const titleMap = db.getNotesTitleMap();

        res.json({
            id: note.id.toString(),
            title: note.title,
            content: note.content,
            type: note.type || 'markdown', // Include note type (default to markdown for backward compatibility)
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            html: renderMarkdownWithWikiLinks(note.content, titleMap), // Convert markdown to HTML with wiki-links
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: tags
        });
    } catch (error) {
        console.error('Error getting note:', error);
        res.status(500).json({ error: 'Failed to read note' });
    }
});

// GET /api/notes/:id/backlinks - Get notes that link to this note
app.get('/api/notes/:id/backlinks', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const targetNote = db.getNoteById(noteId);
        if (!targetNote) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Get all notes to search for wiki-links
        const allNotes = db.getAllNotes();
        const wikiLinkPattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
        const targetTitleLower = targetNote.title.toLowerCase();
        const backlinks = [];

        allNotes.forEach(note => {
            // Skip the target note itself
            if (note.id === noteId) return;

            // Get full note content
            const fullNote = db.getNoteById(note.id);
            if (!fullNote || !fullNote.content) return;

            // Extract wiki-link targets from content
            const matches = fullNote.content.matchAll(wikiLinkPattern);
            for (const match of matches) {
                const linkTarget = match[1].trim().toLowerCase();
                if (linkTarget === targetTitleLower) {
                    backlinks.push({
                        id: fullNote.id.toString(),
                        title: fullNote.title
                    });
                    break; // Only add once per note
                }
            }
        });

        res.json(backlinks);
    } catch (error) {
        console.error('Error getting backlinks:', error);
        res.status(500).json({ error: 'Failed to get backlinks' });
    }
});

// POST /api/notes - Create a new note
app.post('/api/notes', requireAuth, (req, res) => {
    try {
        const { title, content, folder_id, type } = req.body;
        const userId = req.session.userId;

        console.log('POST /api/notes - Received type:', type, 'Full body:', { title, type, folder_id });

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        // Parse folder_id if provided, otherwise null (uncategorized note)
        const folderId = folder_id ? parseInt(folder_id) : null;

        // Default to 'markdown' if no type specified (backwards compatibility)
        const noteType = type || 'markdown';
        console.log('Using noteType:', noteType);

        // Check if user has access to the target folder (skip check for uncategorized notes)
        if (folderId !== null && !db.canUserAccessFolder(folderId, userId)) {
            return res.status(403).json({ error: 'You do not have access to this folder' });
        }

        const newNote = db.createNote(title, content, folderId, userId, noteType);

        res.status(201).json({
            id: newNote.id.toString(),
            title: newNote.title,
            user_id: newNote.user_id,
            type: newNote.type,
            message: 'Note created successfully'
        });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PUT /api/notes/:id - Update a note
app.put('/api/notes/:id', requireAuth, (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { content } = req.body;
        const userId = req.session.userId;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Check if user has permission to modify this note
        if (!db.canUserModifyNote(noteId, userId)) {
            return res.status(403).json({ error: 'You do not have permission to modify this note' });
        }

        const updated = db.updateNote(noteId, content);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note updated successfully'
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE /api/notes/:id - Delete a note (soft delete - moves to trash)
app.delete('/api/notes/:id', requireAuth, (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const userId = req.session.userId;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        // Check if user has permission to modify this note
        if (!db.canUserModifyNote(noteId, userId)) {
            return res.status(403).json({ error: 'You do not have permission to delete this note' });
        }

        const deleted = db.deleteNote(noteId);

        if (!deleted) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note moved to trash' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

// GET /api/trash - Get all deleted notes
app.get('/api/trash', (req, res) => {
    try {
        const deletedNotes = db.getDeletedNotes();

        const formattedNotes = deletedNotes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            deleted_at: note.deleted_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting trash:', error);
        res.status(500).json({ error: 'Failed to get trash' });
    }
});

// PUT /api/trash/:id/restore - Restore a note from trash
app.put('/api/trash/:id/restore', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const restored = db.restoreNote(noteId);

        if (!restored) {
            return res.status(404).json({ error: 'Note not found in trash' });
        }

        res.json({ message: 'Note restored successfully' });
    } catch (error) {
        console.error('Error restoring note:', error);
        res.status(500).json({ error: 'Failed to restore note' });
    }
});

// DELETE /api/trash/:id - Permanently delete a note
app.delete('/api/trash/:id', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        const deleted = db.permanentlyDeleteNote(noteId);

        if (!deleted) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({ message: 'Note permanently deleted' });
    } catch (error) {
        console.error('Error permanently deleting note:', error);
        res.status(500).json({ error: 'Failed to permanently delete note' });
    }
});

// DELETE /api/trash - Empty trash (permanently delete all notes in trash)
app.delete('/api/trash', (req, res) => {
    try {
        const deletedCount = db.emptyTrash();

        res.json({
            message: `Trash emptied successfully`,
            count: deletedCount
        });
    } catch (error) {
        console.error('Error emptying trash:', error);
        res.status(500).json({ error: 'Failed to empty trash' });
    }
});

// GET /api/search - Search notes (NEW FEATURE!)
app.get('/api/search', (req, res) => {
    try {
        const query = req.query.q;

        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = db.searchNotes(query);

        const formattedResults = results.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            type: note.type || 'markdown', // Include note type (default to markdown for backward compatibility)
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Error searching notes:', error);
        res.status(500).json({ error: 'Failed to search notes' });
    }
});

// GET /api/tags - Get all tags with usage counts
app.get('/api/tags', (req, res) => {
    try {
        const tags = db.getAllTags();
        res.json(tags);
    } catch (error) {
        console.error('Error getting tags:', error);
        res.status(500).json({ error: 'Failed to get tags' });
    }
});

// GET /api/tags/:tagName/notes - Get notes filtered by tag
app.get('/api/tags/:tagName/notes', (req, res) => {
    try {
        const tagName = req.params.tagName;
        const notes = db.getNotesByTag(tagName);

        const formattedNotes = notes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            type: note.type || 'markdown', // Include note type (default to markdown for backward compatibility)
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes by tag:', error);
        res.status(500).json({ error: 'Failed to get notes by tag' });
    }
});

// DELETE /api/tags/:tagName - Delete a tag (only if unused)
app.delete('/api/tags/:tagName', (req, res) => {
    try {
        const tagName = req.params.tagName;

        // Check if tag is in use
        const tag = db.getAllTags().find(t => t.name === tagName);
        if (!tag) {
            return res.status(404).json({ error: 'Tag not found' });
        }

        if (tag.count > 0) {
            return res.status(400).json({ error: 'Cannot delete tag that is in use' });
        }

        db.deleteTag(tagName);
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Error deleting tag:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

// GET /api/folders - Get folder tree (filtered by user permissions)
app.get('/api/folders', attachUser, (req, res) => {
    try {
        const userId = req.session.userId || null;
        const folders = db.getAllFoldersForUser(userId);
        const tree = db.buildFolderTree(folders);
        res.json(tree);
    } catch (error) {
        console.error('Error getting folders:', error);
        res.status(500).json({ error: 'Failed to get folders' });
    }
});

// GET /api/folders/:id - Get single folder with metadata
app.get('/api/folders/:id', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        const folder = db.getFolderById(folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Get note count for this folder (non-recursive)
        const noteCount = db.getNoteCountByFolder(folderId);

        res.json({
            ...folder,
            id: folder.id.toString(),
            parent_id: folder.parent_id ? folder.parent_id.toString() : null,
            noteCount
        });
    } catch (error) {
        console.error('Error getting folder:', error);
        res.status(500).json({ error: 'Failed to get folder' });
    }
});

// POST /api/folders - Create new folder
app.post('/api/folders', requireAuth, (req, res) => {
    try {
        const { name, parent_id, icon, is_public } = req.body;
        const userId = req.session.userId;

        console.log('Server received folder create request:', { name, parent_id, icon, is_public, userId });

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Validate parent exists if provided
        if (parent_id) {
            const parentExists = db.getFolderById(parseInt(parent_id));
            if (!parentExists) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }

            // Validate user has access to parent folder
            if (!db.canUserAccessFolder(parseInt(parent_id), userId)) {
                return res.status(403).json({ error: 'You do not have access to the parent folder' });
            }
        }

        const isPublic = is_public === true || is_public === 'true' || is_public === 1;
        const newFolder = db.createFolder(name.trim(), parent_id, null, icon, userId, isPublic);

        res.status(201).json({
            id: newFolder.id.toString(),
            name: newFolder.name,
            user_id: newFolder.user_id,
            is_public: newFolder.is_public,
            message: 'Folder created successfully'
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

// PUT /api/folders/:id - Update folder
app.put('/api/folders/:id', requireAuth, (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { name, parent_id, icon, is_public } = req.body;
        const userId = req.session.userId;

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        // Check if user has permission to modify this folder
        if (!db.canUserModifyFolder(folderId, userId)) {
            return res.status(403).json({ error: 'You do not have permission to modify this folder' });
        }

        // Prevent moving folder into itself or its descendants
        if (parent_id) {
            const parentIdInt = parseInt(parent_id);
            if (db.isDescendant(parentIdInt, folderId)) {
                return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
            }
        }

        const isPublic = is_public === true || is_public === 'true' || is_public === 1;
        const updated = db.updateFolder(folderId, name, parent_id, null, icon, isPublic);

        if (!updated) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json({
            id: folderId.toString(),
            message: 'Folder updated successfully'
        });
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: 'Failed to update folder' });
    }
});

// DELETE /api/folders/:id - Delete folder and cascade to notes
app.delete('/api/folders/:id', requireAuth, (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const userId = req.session.userId;

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        // Check if user has permission to modify this folder
        if (!db.canUserModifyFolder(folderId, userId)) {
            return res.status(403).json({ error: 'You do not have permission to delete this folder' });
        }

        const deleted = db.deleteFolder(folderId);

        if (!deleted) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        res.json({ message: 'Folder deleted successfully' });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: 'Failed to delete folder' });
    }
});

// PUT /api/folders/:id/reorder - Reorder folder (change position and/or parent)
app.put('/api/folders/:id/reorder', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const { new_position, parent_id, is_public } = req.body;

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        if (typeof new_position !== 'number' || new_position < 0) {
            return res.status(400).json({ error: 'Invalid position' });
        }

        // Validate folder exists
        const folder = db.getFolderById(folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Validate parent exists if provided
        let parentIdInt = null;
        if (parent_id !== undefined && parent_id !== null) {
            parentIdInt = parseInt(parent_id);
            const parentExists = db.getFolderById(parentIdInt);
            if (!parentExists) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }

            // Prevent circular dependency
            if (db.isDescendant(parentIdInt, folderId)) {
                return res.status(400).json({ error: 'Cannot move folder into itself or its descendants' });
            }
        }

        // Call reorder function
        db.reorderFolderFunc(folderId, new_position, parentIdInt);

        // Update is_public if provided (for moving between Private/Shared sections)
        if (is_public !== undefined) {
            db.updateFolderField(folderId, 'is_public', is_public ? 1 : 0);
        }

        res.json({
            id: folderId.toString(),
            message: 'Folder reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering folder:', error);
        res.status(500).json({ error: error.message || 'Failed to reorder folder' });
    }
});

// GET /api/folders/:id/notes - Get notes in folder (non-recursive)
app.get('/api/folders/:id/notes', (req, res) => {
    try {
        const folderId = parseInt(req.params.id);

        if (isNaN(folderId)) {
            return res.status(400).json({ error: 'Invalid folder ID' });
        }

        const notes = db.getNotesByFolder(folderId);

        const formattedNotes = notes.map(note => ({
            id: note.id.toString(),
            title: note.title,
            preview: note.preview,
            folder_id: note.folder_id ? note.folder_id.toString() : null,
            created_at: note.created_at,
            updated_at: note.updated_at,
            tags: db.getTagsForNote(note.id).map(tag => tag.name)
        }));

        res.json(formattedNotes);
    } catch (error) {
        console.error('Error getting notes by folder:', error);
        res.status(500).json({ error: 'Failed to get notes by folder' });
    }
});

// PUT /api/notes/:id/move - Move note to different folder
app.put('/api/notes/:id/move', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { folder_id } = req.body;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        // Validate folder exists
        if (folder_id && !db.getFolderById(parseInt(folder_id))) {
            return res.status(400).json({ error: 'Target folder not found' });
        }

        const updated = db.moveNoteToFolder(noteId, folder_id);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note moved successfully'
        });
    } catch (error) {
        console.error('Error moving note:', error);
        res.status(500).json({ error: 'Failed to move note' });
    }
});

// PUT /api/notes/:id/reorder - Reorder note (change folder and position)
app.put('/api/notes/:id/reorder', (req, res) => {
    try {
        const noteId = parseInt(req.params.id);
        const { folder_id, position } = req.body;

        if (isNaN(noteId)) {
            return res.status(400).json({ error: 'Invalid note ID' });
        }

        if (typeof position !== 'number' || position < 0) {
            return res.status(400).json({ error: 'Invalid position' });
        }

        // Validate folder exists
        if (folder_id && !db.getFolderById(parseInt(folder_id))) {
            return res.status(400).json({ error: 'Target folder not found' });
        }

        const updated = db.reorderNote(noteId, folder_id, position);

        if (!updated) {
            return res.status(404).json({ error: 'Note not found' });
        }

        res.json({
            id: noteId.toString(),
            message: 'Note reordered successfully'
        });
    } catch (error) {
        console.error('Error reordering note:', error);
        res.status(500).json({ error: 'Failed to reorder note' });
    }
});

// ==================== ATTACHMENT ENDPOINTS ====================

// POST /api/notes/:noteId/attachments/upload - Upload image to server
app.post('/api/notes/:noteId/attachments/upload', requireAuth, imageUpload.single('image'), async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const userId = req.session.userId;
        const altText = req.body.alt_text || '';

        // Verify note exists and user has permission
        const note = db.getNoteById(noteId);
        if (!note) {
            if (req.file) fs.unlinkSync(req.file.path); // Cleanup temp file
            return res.status(404).json({ error: 'Note not found' });
        }

        if (!db.canUserModifyNote(noteId, userId)) {
            if (req.file) fs.unlinkSync(req.file.path); // Cleanup temp file
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Create user/note directory structure
        const userDir = path.join(uploadsDir, `user_${userId}`);
        const noteDir = path.join(userDir, `note_${noteId}`);
        ensureDirectoryExists(noteDir);

        // Sanitize filename and move file
        const sanitizedFilename = sanitizeFilename(req.file.originalname);
        const relativePath = path.join(`user_${userId}`, `note_${noteId}`, sanitizedFilename);
        const finalPath = path.join(uploadsDir, relativePath);

        fs.renameSync(req.file.path, finalPath);

        // Extract image dimensions
        let width = null;
        let height = null;
        try {
            const dimensions = sizeOf(finalPath);
            width = dimensions.width;
            height = dimensions.height;
        } catch (error) {
            console.warn('Could not extract image dimensions:', error.message);
        }

        // Save to database
        const attachmentId = db.createAttachment(noteId, userId, 'upload', relativePath, {
            originalFilename: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            width,
            height,
            altText
        });

        res.status(201).json({
            id: attachmentId,
            url: `/api/attachments/${attachmentId}`,
            storage_type: 'upload',
            original_filename: req.file.originalname,
            mime_type: req.file.mimetype,
            file_size: req.file.size,
            width,
            height,
            markdown: `![${altText || req.file.originalname}](/api/attachments/${attachmentId})`
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path); // Cleanup temp file on error
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// POST /api/notes/:noteId/attachments/external - Link external image URL
app.post('/api/notes/:noteId/attachments/external', requireAuth, async (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const userId = req.session.userId;
        const { url, alt_text = '' } = req.body;

        // Verify note exists and user has permission
        const note = db.getNoteById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (!db.canUserModifyNote(noteId, userId)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Validate URL
        if (!url || typeof url !== 'string') {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (url.length > 2048) {
            return res.status(400).json({ error: 'URL too long (max 2048 characters)' });
        }

        // Basic URL format check
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Save to database
        const attachmentId = db.createAttachment(noteId, userId, 'external', url, {
            altText: alt_text
        });

        res.status(201).json({
            id: attachmentId,
            url,
            storage_type: 'external',
            markdown: `![${alt_text || 'image'}](${url})`
        });
    } catch (error) {
        console.error('Error linking external image:', error);
        res.status(500).json({ error: 'Failed to link external image' });
    }
});

// GET /api/attachments/:id - Serve image with authentication
app.get('/api/attachments/:id', requireAuth, (req, res) => {
    try {
        const attachmentId = parseInt(req.params.id);
        const userId = req.session.userId;

        const attachment = db.getAttachmentById(attachmentId);
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Check if user can access the note
        if (!db.canUserAccessNote(attachment.note_id, userId)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (attachment.storage_type === 'external') {
            // Redirect to external URL
            return res.redirect(302, attachment.file_path);
        }

        // Serve uploaded file
        const filePath = path.join(uploadsDir, attachment.file_path);

        // Prevent path traversal
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(uploadsDir)) {
            return res.status(403).json({ error: 'Invalid file path' });
        }

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Set proper headers
        res.setHeader('Content-Type', attachment.mime_type || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error serving attachment:', error);
        res.status(500).json({ error: 'Failed to serve attachment' });
    }
});

// GET /api/notes/:noteId/attachments - List all attachments for note
app.get('/api/notes/:noteId/attachments', requireAuth, (req, res) => {
    try {
        const noteId = parseInt(req.params.noteId);
        const userId = req.session.userId;

        // Verify note exists and user has permission
        const note = db.getNoteById(noteId);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (!db.canUserAccessNote(noteId, userId)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const attachments = db.getAttachmentsByNote(noteId);

        // Add URL and markdown fields for each attachment
        const enriched = attachments.map(att => ({
            id: att.id,
            note_id: att.note_id,
            storage_type: att.storage_type,
            url: att.storage_type === 'external' ? att.file_path : `/api/attachments/${att.id}`,
            original_filename: att.original_filename,
            mime_type: att.mime_type,
            file_size: att.file_size,
            width: att.width,
            height: att.height,
            alt_text: att.alt_text,
            created_at: att.created_at,
            markdown: `![${att.alt_text || att.original_filename || 'image'}](${att.storage_type === 'external' ? att.file_path : `/api/attachments/${att.id}`})`
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// DELETE /api/attachments/:id - Delete attachment
app.delete('/api/attachments/:id', requireAuth, (req, res) => {
    try {
        const attachmentId = parseInt(req.params.id);
        const userId = req.session.userId;

        const attachment = db.getAttachmentById(attachmentId);
        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Check if user can modify the note
        if (!db.canUserModifyNote(attachment.note_id, userId)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Delete from database (returns attachment info for cleanup)
        const deleted = db.deleteAttachment(attachmentId);

        if (!deleted) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Delete file if it's an upload
        if (deleted.storage_type === 'upload') {
            const filePath = path.join(uploadsDir, deleted.file_path);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.warn('Failed to delete file:', error.message);
                }
            }
        }

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

// Start server (like Flask's app.run())
app.listen(PORT, () => {
    console.log(`NoteCottage server running on http://localhost:${PORT}`);
    console.log(`Database: SQLite (notecottage.db)`);
    console.log(`Using full-text search for better searching!`);
    console.log(`Tags support enabled!`);
});
