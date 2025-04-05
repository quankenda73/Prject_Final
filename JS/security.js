// Security configurations and utilities

// Prevent XSS attacks
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// CSRF Token Management
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

// Add CSRF token to all AJAX requests
function setupCsrfToken() {
    const token = getCsrfToken();
    if (token) {
        // Thêm token vào header của mọi request
        document.addEventListener('fetch', (event) => {
            const request = event.request.clone();
            request.headers.append('X-CSRF-Token', token);
            return fetch(request);
        });
    }
}

// Rate Limiting
const rateLimiter = {
    attempts: {},
    maxAttempts: 5,
    timeWindow: 60000, // 1 minute

    checkLimit: function(key) {
        const now = Date.now();
        if (!this.attempts[key]) {
            this.attempts[key] = {
                count: 1,
                timestamp: now
            };
            return true;
        }

        if (now - this.attempts[key].timestamp > this.timeWindow) {
            this.attempts[key] = {
                count: 1,
                timestamp: now
            };
            return true;
        }

        if (this.attempts[key].count >= this.maxAttempts) {
            return false;
        }

        this.attempts[key].count++;
        return true;
    }
};

// Password Strength Checker
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
}

// Session Management
const sessionManager = {
    checkSession: function() {
        const lastActivity = localStorage.getItem('lastActivity');
        const now = Date.now();
        if (lastActivity && (now - lastActivity > 30 * 60 * 1000)) { // 30 minutes
            this.logout();
        }
        localStorage.setItem('lastActivity', now);
    },

    logout: function() {
        localStorage.clear();
        window.location.href = '/login';
    }
};

// Initialize security features
document.addEventListener('DOMContentLoaded', function() {
    setupCsrfToken();
    setInterval(sessionManager.checkSession, 60000); // Check session every minute
});

// Export security utilities
export {
    sanitizeInput,
    getCsrfToken,
    setupCsrfToken,
    rateLimiter,
    checkPasswordStrength,
    sessionManager
}; 