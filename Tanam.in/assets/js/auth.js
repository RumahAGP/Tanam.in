// Authentication JavaScript
// Session management and user utilities

const API_PATH = window.location.pathname.toLowerCase().includes('/admin/') ? '../api' : 'api';

// Check if user is logged in
async function checkAuth() {
    try {
        // 1. Determine local context (Are we in Admin area?)
        const currentPath = window.location.pathname.toLowerCase();
        const isAdminPage = currentPath.includes('/admin/');

        // 2. Prepare timestamp for cache busting
        const timestamp = new Date().getTime();

        // 3. Primary Check: Check session based on current page context
        // If in /admin/, check admin session. If in public, check customer session.
        let queryParams = isAdminPage ? '?role=admin' : '';
        let urlSeparator = queryParams ? '&' : '?';
        let finalUrl = `${API_PATH}/auth/check_session.php${queryParams}${urlSeparator}t=${timestamp}`;

        let response = await fetch(finalUrl);
        let data = await response.json();

        if (data.success && data.logged_in && data.user) {
            return data.user;
        }

        // 4. Fallback Check (For Public Pages only):
        // If we are on public pages and not logged in as Customer, 
        // check if we are logged in as Admin. This allows Admins to see "Dashboard" link on homepage.
        if (!isAdminPage) {
            finalUrl = `${API_PATH}/auth/check_session.php?role=admin&t=${timestamp}`;
            response = await fetch(finalUrl);
            data = await response.json();

            if (data.success && data.logged_in && data.user) {
                return data.user;
            }
        }

        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

// Login function
async function login(email, password) {
    const response = await fetch(`${API_PATH}/auth/login.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    return await response.json();
}

// Logout function
async function logout() {
    try {
        const currentPath = window.location.pathname.toLowerCase();
        const isAdminPage = currentPath.includes('/admin/');
        const queryParams = isAdminPage ? '?role=admin' : '';

        await fetch(`${API_PATH}/auth/logout.php${queryParams}`, {
            method: 'POST'
        });
        window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = window.location.pathname.includes('/admin/') ? '../login.html' : 'login.html';
    }
}

// Register function
async function register(userData) {
    const response = await fetch(`${API_PATH}/auth/register.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    return await response.json();
}

// Update navbar with user info
async function updateNavbar() {
    console.log('updateNavbar running...');
    const user = await checkAuth();
    console.log('User status:', user);

    // Find navbar links (both desktop and mobile)
    const navbarContainers = document.querySelectorAll('.links, .sub-links');
    console.log('Found containers:', navbarContainers.length);

    navbarContainers.forEach(container => {
        // Remove existing auth links
        const existingAuthLinks = container.querySelectorAll('.auth-link');
        existingAuthLinks.forEach(link => link.remove());

        if (user) {
            console.log('Rendering user menu');

            // 1. Add Dashboard link if admin AND NOT currently in admin pages
            if (user.role === 'admin' && !window.location.pathname.toLowerCase().includes('/admin/')) {
                const dashboardItem = document.createElement('li');
                dashboardItem.className = 'auth-link';
                dashboardItem.innerHTML = `
                    <a href="admin/dashboard.html" style="color: #28a745; font-weight: 700;">
                        <ion-icon name="speedometer-outline" style="vertical-align: middle; margin-right: 5px;"></ion-icon>
                        Dashboard
                    </a>
                `;
                container.appendChild(dashboardItem);
            }

            // 2. Add User Menu
            const userMenuItem = document.createElement('li');
            userMenuItem.className = 'auth-link';
            userMenuItem.innerHTML = `
                <a href="#" style="color: #28a745; font-weight: 600;">
                    👤 ${user.name}
                </a>
            `;
            container.appendChild(userMenuItem);

            // 3. Add Logout
            const logoutMenuItem = document.createElement('li');
            logoutMenuItem.className = 'auth-link';
            logoutMenuItem.innerHTML = `
                <a href="#" onclick="logout(); return false;" style="color: #dc3545;">
                    Logout
                </a>
            `;
            container.appendChild(logoutMenuItem);

        } else {
            console.log('Rendering login/register buttons');
            // User not logged in - Show Sign In/Sign Up
            const loginMenuItem = document.createElement('li');
            loginMenuItem.className = 'auth-link';
            loginMenuItem.innerHTML = `<a href="login.html" class="sign-in">Sign In</a>`;

            const registerMenuItem = document.createElement('li');
            registerMenuItem.className = 'auth-link';
            registerMenuItem.innerHTML = `
                <a href="register.html" class="btn-signup">
                    Sign Up
                </a>
            `;

            container.appendChild(loginMenuItem);
            container.appendChild(registerMenuItem);
        }
    });
}

// Protect page - redirect to login if not authenticated
async function protectPage() {
    const user = await checkAuth();
    if (!user) {
        const currentPage = window.location.pathname + window.location.search;
        window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
        return false;
    }
    return true;
}

// Get current user
async function getCurrentUser() {
    return await checkAuth();
}

// Auto-run navbar update on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbar);
} else {
    updateNavbar();
}
