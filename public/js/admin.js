// Admin Panel JavaScript

let currentUser = null;

// Check authentication and admin status on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            if (!currentUser.is_admin) {
                // Not an admin, redirect to main app
                alert('Access denied. Admin privileges required.');
                window.location.href = '/';
                return false;
            }
            return true;
        } else {
            // Not authenticated, redirect to login
            window.location.href = '/login.html';
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Global fetch wrapper to handle 401/403 responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    if (response.status === 401 && !args[0].includes('/api/auth/')) {
        console.log('Session expired, redirecting to login');
        window.location.href = '/login.html';
    } else if (response.status === 403) {
        console.log('Access denied');
        alert('Access denied. Admin privileges required.');
        window.location.href = '/';
    }

    return response;
};

// Alert helpers
function showAlert(message, type = 'info') {
    const container = document.getElementById('alert-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Tab Management
function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Load data for the active tab
            if (tabName === 'statistics') {
                loadStatistics();
            } else if (tabName === 'users') {
                loadUsers();
            } else if (tabName === 'settings') {
                loadSettings();
            }
        });
    });
}

// Statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('stat-users').textContent = stats.user_count;
            document.getElementById('stat-notes').textContent = stats.total_notes;
            document.getElementById('stat-folders').textContent = stats.total_folders;
        } else {
            showAlert('Failed to load statistics', 'error');
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        showAlert('Error loading statistics', 'error');
    }
}

// User Management
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading users...</td></tr>';

    try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
            const users = await response.json();

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
                return;
            }

            tbody.innerHTML = users.map(user => `
                <tr>
                    <td>${escapeHtml(user.username)}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td>${user.display_name ? escapeHtml(user.display_name) : '-'}</td>
                    <td><span class="badge ${user.is_admin ? 'badge-admin' : 'badge-user'}">${user.is_admin ? 'Admin' : 'User'}</span></td>
                    <td>${formatDate(user.created_at)}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-secondary btn-small" onclick="editUser(${user.id})">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')">Delete</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } else {
            showAlert('Failed to load users', 'error');
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading users</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Error loading users', 'error');
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error loading users</td></tr>';
    }
}

async function createUser() {
    const modal = new Modal('Create User', `
        <form id="createUserForm">
            <div class="form-group">
                <label for="newUsername">Username *</label>
                <input type="text" id="newUsername" required pattern="[a-zA-Z0-9_]{3,20}">
                <small>3-20 characters (letters, numbers, underscore)</small>
            </div>
            <div class="form-group">
                <label for="newEmail">Email *</label>
                <input type="email" id="newEmail" required>
            </div>
            <div class="form-group">
                <label for="newDisplayName">Display Name</label>
                <input type="text" id="newDisplayName">
            </div>
            <div class="form-group">
                <label for="newPassword">Password *</label>
                <input type="password" id="newPassword" required minlength="8">
                <small>Minimum 8 characters</small>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="newIsAdmin">
                <label for="newIsAdmin">Admin privileges</label>
            </div>
        </form>
    `, [
        {
            text: 'Cancel',
            className: 'btn btn-secondary'
        },
        {
            text: 'Create User',
            className: 'btn btn-primary',
            callback: async () => {
                const form = document.getElementById('createUserForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                const username = document.getElementById('newUsername').value;
                const email = document.getElementById('newEmail').value;
                const displayName = document.getElementById('newDisplayName').value;
                const password = document.getElementById('newPassword').value;
                const isAdmin = document.getElementById('newIsAdmin').checked;

                try {
                    const response = await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, email, displayName: displayName || null, password, isAdmin })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showAlert('User created successfully', 'success');
                        loadUsers();
                        return true;
                    } else {
                        showAlert(data.error || 'Failed to create user', 'error');
                        return false;
                    }
                } catch (error) {
                    console.error('Error creating user:', error);
                    showAlert('Error creating user', 'error');
                    return false;
                }
            }
        }
    ]);
}

async function editUser(userId) {
    // Load user data
    const response = await fetch('/api/admin/users');
    if (!response.ok) {
        showAlert('Failed to load user data', 'error');
        return;
    }

    const users = await response.json();
    const user = users.find(u => u.id === userId);
    if (!user) {
        showAlert('User not found', 'error');
        return;
    }

    const modal = new Modal('Edit User', `
        <form id="editUserForm">
            <div class="form-group">
                <label for="editUsername">Username *</label>
                <input type="text" id="editUsername" value="${escapeHtml(user.username)}" required pattern="[a-zA-Z0-9_]{3,20}">
            </div>
            <div class="form-group">
                <label for="editEmail">Email *</label>
                <input type="email" id="editEmail" value="${escapeHtml(user.email)}" required>
            </div>
            <div class="form-group">
                <label for="editDisplayName">Display Name</label>
                <input type="text" id="editDisplayName" value="${user.display_name ? escapeHtml(user.display_name) : ''}">
            </div>
            <div class="form-group">
                <label for="editPassword">New Password (leave blank to keep current)</label>
                <input type="password" id="editPassword" minlength="8">
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="editIsAdmin" ${user.is_admin ? 'checked' : ''}>
                <label for="editIsAdmin">Admin privileges</label>
            </div>
        </form>
    `, [
        {
            text: 'Cancel',
            className: 'btn btn-secondary'
        },
        {
            text: 'Save Changes',
            className: 'btn btn-primary',
            callback: async () => {
                const form = document.getElementById('editUserForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                const username = document.getElementById('editUsername').value;
                const email = document.getElementById('editEmail').value;
                const displayName = document.getElementById('editDisplayName').value;
                const password = document.getElementById('editPassword').value;
                const isAdmin = document.getElementById('editIsAdmin').checked;

                const updates = { username, email, displayName: displayName || null, isAdmin };
                if (password) {
                    updates.password = password;
                }

                try {
                    const response = await fetch(`/api/admin/users/${userId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updates)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        showAlert('User updated successfully', 'success');
                        loadUsers();
                        return true;
                    } else {
                        showAlert(data.error || 'Failed to update user', 'error');
                        return false;
                    }
                } catch (error) {
                    console.error('Error updating user:', error);
                    showAlert('Error updating user', 'error');
                    return false;
                }
            }
        }
    ]);
}

async function deleteUser(userId, username) {
    const confirmed = confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone. All of their notes and folders will remain but will be orphaned.`);
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('User deleted successfully', 'success');
            loadUsers();
        } else {
            showAlert(data.error || 'Failed to delete user', 'error');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Error deleting user', 'error');
    }
}

// System Settings
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('registrationEnabled').checked = settings.registration_enabled === 'true';
            document.getElementById('maxUsers').value = settings.max_users || 0;
        } else {
            showAlert('Failed to load settings', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showAlert('Error loading settings', 'error');
    }
}

async function saveSettings() {
    const registrationEnabled = document.getElementById('registrationEnabled').checked;
    const maxUsers = parseInt(document.getElementById('maxUsers').value, 10);

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                registration_enabled: registrationEnabled,
                max_users: maxUsers
            })
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Settings saved successfully', 'success');
        } else {
            showAlert(data.error || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Error saving settings', 'error');
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Apply theme immediately (synchronously before DOMContentLoaded)
const currentTheme = localStorage.getItem('theme') || 'cottage';
document.documentElement.dataset.theme = currentTheme;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Apply theme to body as well (in case it wasn't set on documentElement)
    document.body.dataset.theme = currentTheme;

    const authenticated = await checkAuth();
    if (!authenticated) return;

    initTabs();
    loadStatistics();

    // Event listeners
    document.getElementById('createUserBtn').addEventListener('click', createUser);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

    // Backup & Restore event listeners
    document.getElementById('downloadBackupBtn').addEventListener('click', downloadBackup);
    document.getElementById('restoreFile').addEventListener('change', handleRestoreFileSelect);
    document.getElementById('restoreBackupBtn').addEventListener('click', restoreBackup);
});

// Backup & Restore Functions

async function downloadBackup() {
    const statusDiv = document.getElementById('backupStatus');
    const btn = document.getElementById('downloadBackupBtn');

    try {
        btn.disabled = true;
        statusDiv.innerHTML = '<span style="color: var(--primary-color);">Preparing backup...</span>';

        const response = await fetch('/api/admin/backup');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to download backup');
        }

        // Get the filename from the Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition && contentDisposition.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'notecottage-backup.db';

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        statusDiv.innerHTML = '<span style="color: var(--success-color);">✓ Backup downloaded successfully!</span>';

        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    } catch (error) {
        console.error('Error downloading backup:', error);
        statusDiv.innerHTML = `<span style="color: var(--danger-color);">✗ Error: ${error.message}</span>`;
    } finally {
        btn.disabled = false;
    }
}

function handleRestoreFileSelect(event) {
    const file = event.target.files[0];
    const btn = document.getElementById('restoreBackupBtn');

    if (file) {
        // Check file extension
        if (!file.name.endsWith('.db')) {
            alert('Please select a valid .db file');
            event.target.value = '';
            btn.disabled = true;
            return;
        }
        btn.disabled = false;
    } else {
        btn.disabled = true;
    }
}

async function restoreBackup() {
    const fileInput = document.getElementById('restoreFile');
    const statusDiv = document.getElementById('restoreStatus');
    const btn = document.getElementById('restoreBackupBtn');

    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select a backup file first');
        return;
    }

    // Show confirmation dialog
    const confirmed = await Modal.confirm(
        'Restore Database',
        'Are you absolutely sure you want to restore from this backup? This will replace ALL current data including all users, notes, and settings. A safety backup of the current database will be created first.',
        'Yes, Restore Database',
        'Cancel'
    );

    if (!confirmed) {
        return;
    }

    try {
        btn.disabled = true;
        statusDiv.innerHTML = '<span style="color: var(--primary-color);">Uploading and restoring backup...</span>';

        const formData = new FormData();
        formData.append('database', fileInput.files[0]);

        const response = await fetch('/api/admin/restore', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to restore backup');
        }

        statusDiv.innerHTML = '<span style="color: var(--success-color);">✓ Database restored! Server is restarting...</span>';

        // Show success message and redirect
        await Modal.alert(
            'Restore Successful',
            'Database has been restored successfully. The server is restarting. You will be redirected to the login page.'
        );

        // Redirect to login after server restart
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);

    } catch (error) {
        console.error('Error restoring backup:', error);
        statusDiv.innerHTML = `<span style="color: var(--danger-color);">✗ Error: ${error.message}</span>`;
        btn.disabled = false;
    }
}
