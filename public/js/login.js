// Login/Registration page functionality

let isFirstUser = false;
let registrationEnabled = true;

// Check authentication status on load
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            // User is already logged in, redirect to main app
            window.location.href = '/';
        } else {
            // Not logged in, check if this is first user
            await checkFirstUser();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        await checkFirstUser();
    }
}

// Check if this is the first user (no users in database)
async function checkFirstUser() {
    try {
        // Use public status endpoint to check if users exist
        const response = await fetch('/api/auth/status');

        if (response.ok) {
            const data = await response.json();

            if (!data.hasUsers) {
                // No users exist - show first user registration
                isFirstUser = true;
                showRegistrationForm(true);
            } else {
                // Users exist - show login or registration based on settings
                registrationEnabled = data.registrationEnabled;
                showLoginForm();
            }
        } else {
            // Error getting status - default to login form
            console.error('Error checking auth status:', response.status);
            showLoginForm();
        }
    } catch (error) {
        console.error('Error checking first user:', error);
        // Default to login form
        showLoginForm();
    }
}

// Show login form
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('first-user-banner').classList.add('hidden');
    document.getElementById('header-subtitle').textContent = 'Sign in to your account';

    if (registrationEnabled) {
        document.getElementById('toggle-text').textContent = "Don't have an account? ";
        document.getElementById('toggle-link').textContent = 'Sign up';
    } else {
        document.getElementById('toggle-text').textContent = 'Registration is currently disabled';
        document.getElementById('toggle-link').textContent = '';
    }
}

// Show registration form
function showRegistrationForm(firstUser = false) {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');

    if (firstUser) {
        document.getElementById('first-user-banner').classList.remove('hidden');
        document.getElementById('header-subtitle').textContent = 'Create your admin account';
        document.getElementById('toggle-text').textContent = '';
        document.getElementById('toggle-link').textContent = '';
    } else {
        document.getElementById('first-user-banner').classList.add('hidden');
        document.getElementById('header-subtitle').textContent = 'Create your account';
        document.getElementById('toggle-text').textContent = 'Already have an account? ';
        document.getElementById('toggle-link').textContent = 'Sign in';
    }
}

// Toggle between login and registration
document.getElementById('toggle-link').addEventListener('click', () => {
    clearMessages();

    if (document.getElementById('login-form').classList.contains('hidden')) {
        showLoginForm();
    } else {
        showRegistrationForm(false);
    }
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-btn');

    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } else {
            showError(data.error || 'Login failed');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();

    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const displayName = document.getElementById('register-display-name').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const submitBtn = document.getElementById('register-btn');

    // Validate passwords match
    if (password !== passwordConfirm) {
        showError('Passwords do not match');
        return;
    }

    // Validate password strength
    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, displayName: displayName || null })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Account created successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 500);
        } else {
            showError(data.error || 'Registration failed');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

// Password strength indicator
document.getElementById('register-password').addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthBar = document.getElementById('password-strength-bar');

    if (password.length === 0) {
        strengthBar.className = 'password-strength-bar';
        return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Set strength class
    if (strength <= 2) {
        strengthBar.className = 'password-strength-bar weak';
    } else if (strength <= 4) {
        strengthBar.className = 'password-strength-bar medium';
    } else {
        strengthBar.className = 'password-strength-bar strong';
    }
});

// Message helpers
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    document.getElementById('success-message').classList.add('hidden');
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    document.getElementById('error-message').classList.add('hidden');
}

function clearMessages() {
    document.getElementById('error-message').classList.add('hidden');
    document.getElementById('success-message').classList.add('hidden');
}

// Apply theme immediately (before any async operations)
const currentTheme = localStorage.getItem('theme') || 'cottage';
document.documentElement.dataset.theme = currentTheme;
if (document.body) {
    document.body.dataset.theme = currentTheme;
}

// Initialize on page load
checkAuthStatus();
