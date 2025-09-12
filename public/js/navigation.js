/**
 * Navigation Component for SITES Spectral System
 * Handles consistent navigation across all pages with authentication support
 */

class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        this.renderNavigation();
        this.setupEventListeners();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') return 'home';
        if (path === '/station.html') return 'station';
        if (path === '/login.html') return 'login';
        if (path.startsWith('/docs')) return 'docs';
        return 'unknown';
    }

    async checkAuthentication() {
        try {
            // Check if user is logged in by verifying token
            const token = localStorage.getItem('auth_token');
            if (token) {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.valid) {
                        this.currentUser = data.user;
                        this.isAuthenticated = true;
                    } else {
                        // Token is invalid, remove it
                        localStorage.removeItem('auth_token');
                        this.isAuthenticated = false;
                    }
                } else {
                    // Token is invalid, remove it
                    localStorage.removeItem('auth_token');
                    this.isAuthenticated = false;
                }
            }
        } catch (error) {
            console.warn('Authentication check failed:', error);
            this.isAuthenticated = false;
        }
    }

    renderNavigation() {
        const navContainer = document.querySelector('.navbar .nav-menu');
        if (!navContainer) return;

        // Base navigation items
        const navItems = [
            { 
                id: 'home', 
                href: '/', 
                icon: 'fas fa-home', 
                text: 'Home', 
                public: true 
            },
            { 
                id: 'docs', 
                href: '/docs/', 
                icon: 'fas fa-book', 
                text: 'Documentation', 
                public: true 
            }
        ];

        // Add authenticated items
        if (this.isAuthenticated) {
            navItems.push({
                id: 'dashboard',
                href: '/dashboard.html',
                icon: 'fas fa-tachometer-alt',
                text: 'Dashboard',
                public: false
            });

            navItems.push({
                id: 'logout',
                href: '#',
                icon: 'fas fa-sign-out-alt',
                text: `Logout (${this.currentUser?.username || 'User'})`,
                public: false,
                onClick: () => this.logout()
            });
        } else {
            navItems.push({
                id: 'login',
                href: '/login.html',
                icon: 'fas fa-sign-in-alt',
                text: 'Station Login',
                public: true
            });
        }

        // Render navigation
        navContainer.innerHTML = navItems.map(item => `
            <li class="nav-item">
                <a href="${item.href}" 
                   class="nav-link ${this.currentPage === item.id ? 'active' : ''}"
                   ${item.onClick ? `onclick="event.preventDefault(); navigationManager.${item.onClick.name}()"` : ''}>
                    <i class="${item.icon}"></i> ${item.text}
                </a>
            </li>
        `).join('');

        // Update brand area if authenticated
        this.updateBrandArea();
    }

    updateBrandArea() {
        const brandContainer = document.querySelector('.nav-brand');
        if (!brandContainer) return;

        const brandHTML = `
            <img src="/images/SITES_spectral_LOGO.png" alt="SITES Spectral" class="brand-logo">
            <span>SITES Spectral</span>
            ${this.isAuthenticated ? `
                <small class="user-info">
                    ${this.currentUser?.role === 'station' ? 
                        `Station: ${this.currentUser.station_name || 'Unknown'}` : 
                        `Role: ${this.currentUser?.role || 'User'}`
                    }
                </small>
            ` : ''}
        `;

        brandContainer.innerHTML = brandHTML;
    }

    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking on links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu) {
                    navMenu.classList.remove('active');
                }
            });
        });

        // Listen for authentication changes
        window.addEventListener('storage', (e) => {
            if (e.key === 'auth_token') {
                this.init(); // Reinitialize navigation
            }
        });
    }

    async logout() {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            // Clear local storage and redirect
            localStorage.removeItem('auth_token');
            this.isAuthenticated = false;
            this.currentUser = null;
            
            // Redirect to home page
            if (this.currentPage !== 'home' && this.currentPage !== 'login' && this.currentPage !== 'docs') {
                window.location.href = '/';
            } else {
                this.renderNavigation(); // Re-render navigation
            }
        }
    }

    // Method to be called after successful login
    async handleLoginSuccess(token, user) {
        localStorage.setItem('auth_token', token);
        this.currentUser = user;
        this.isAuthenticated = true;
        this.renderNavigation();
        
        // Redirect based on user role
        if (user.role === 'admin') {
            window.location.href = '/admin.html';
        } else if (user.role === 'station') {
            window.location.href = `/station.html?id=${user.station_id}`;
        } else {
            window.location.href = '/';
        }
    }

    // Utility method to check if current user has permission
    hasPermission(requiredRole) {
        if (!this.isAuthenticated) return false;
        
        const roleHierarchy = {
            'admin': 3,
            'station': 2,
            'public': 1
        };
        
        const userLevel = roleHierarchy[this.currentUser?.role] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }

    // Method to protect pages
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
            return false;
        }
        
        if (requiredRole && !this.hasPermission(requiredRole)) {
            window.location.href = '/403.html';
            return false;
        }
        
        return true;
    }
}

// Auto-initialize navigation on all pages
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}