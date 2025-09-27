// SITES Spectral Instruments - Navigation Module
// Client-side routing and navigation management

class SitesNavigation {
    constructor() {
        this.currentPage = '';
        this.breadcrumbs = [];
        this.navigationHistory = [];
        this.init();
    }

    init() {
        this.detectCurrentPage();
        this.setupEventListeners();
        this.updateNavigation();
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        const search = window.location.search;

        if (path === '/' || path.includes('index.html')) {
            this.currentPage = 'home';
        } else if (path.includes('login.html')) {
            this.currentPage = 'login';
        } else if (path.includes('dashboard.html')) {
            this.currentPage = 'dashboard';
        } else if (path.includes('station.html')) {
            this.currentPage = 'station';
            // Extract station acronym from URL
            const urlParams = new URLSearchParams(search);
            this.currentStationAcronym = urlParams.get('station');
        } else {
            this.currentPage = 'unknown';
        }
    }

    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Handle navigation links
        document.addEventListener('click', (event) => {
            if (event.target.matches('a[data-navigate]')) {
                event.preventDefault();
                this.navigateTo(event.target.getAttribute('href'));
            }
        });
    }

    updateNavigation() {
        this.updateActiveNavItems();
        this.updateBreadcrumbs();
        this.updatePageTitle();
    }

    updateActiveNavItems() {
        const navItems = document.querySelectorAll('.nav-item, .navbar-nav a');

        navItems.forEach(item => {
            item.classList.remove('active');

            const href = item.getAttribute('href');
            if (this.isCurrentPage(href)) {
                item.classList.add('active');
            }
        });
    }

    isCurrentPage(href) {
        if (!href) return false;

        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        // Handle exact matches
        if (href === currentPath + currentSearch) return true;

        // Handle page matches
        if (href.includes('dashboard.html') && this.currentPage === 'dashboard') return true;
        if (href.includes('station.html') && this.currentPage === 'station') return true;
        if (href === '/' && this.currentPage === 'home') return true;

        return false;
    }

    updateBreadcrumbs() {
        const breadcrumbContainer = document.getElementById('breadcrumbs');
        if (!breadcrumbContainer) return;

        const breadcrumbs = this.getBreadcrumbs();

        breadcrumbContainer.innerHTML = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            if (isLast) {
                return `<span class="breadcrumb-current">${crumb.text}</span>`;
            } else {
                return `<a href="${crumb.url}" class="breadcrumb-link">${crumb.text}</a>`;
            }
        }).join(' <i class="fas fa-chevron-right breadcrumb-separator"></i> ');
    }

    getBreadcrumbs() {
        const breadcrumbs = [{ text: 'Home', url: '/' }];

        switch (this.currentPage) {
            case 'login':
                breadcrumbs.push({ text: 'Login', url: '/login.html' });
                break;

            case 'dashboard':
                breadcrumbs.push({ text: 'Dashboard', url: '/dashboard.html' });
                break;

            case 'station':
                breadcrumbs.push({ text: 'Dashboard', url: '/dashboard.html' });
                if (this.currentStationAcronym) {
                    breadcrumbs.push({
                        text: this.currentStationAcronym,
                        url: `/station.html?station=${this.currentStationAcronym}`
                    });
                } else {
                    breadcrumbs.push({ text: 'Station', url: '/station.html' });
                }
                break;
        }

        return breadcrumbs;
    }

    updatePageTitle() {
        let title = 'SITES Spectral Instruments';

        switch (this.currentPage) {
            case 'login':
                title = 'Login - SITES Spectral';
                break;

            case 'dashboard':
                title = 'Dashboard - SITES Spectral';
                break;

            case 'station':
                if (this.currentStationAcronym) {
                    title = `${this.currentStationAcronym} - SITES Spectral`;
                } else {
                    title = 'Station - SITES Spectral';
                }
                break;
        }

        document.title = title;
    }

    // Navigation methods
    navigateTo(url, pushState = true) {
        if (pushState) {
            history.pushState({ url }, '', url);
            this.navigationHistory.push(url);
        }

        window.location.href = url;
    }

    goBack() {
        if (this.navigationHistory.length > 1) {
            this.navigationHistory.pop(); // Remove current page
            const previousUrl = this.navigationHistory[this.navigationHistory.length - 1];
            this.navigateTo(previousUrl, false);
        } else {
            history.back();
        }
    }

    goHome() {
        this.navigateTo('/', true);
    }

    goToDashboard() {
        this.navigateTo('/dashboard.html', true);
    }

    goToStation(stationAcronym) {
        this.navigateTo(`/station.html?station=${stationAcronym}`, true);
    }

    goToLogin() {
        this.navigateTo('/login.html', true);
    }

    // Handle browser navigation
    handlePopState(event) {
        if (event.state && event.state.url) {
            this.navigateTo(event.state.url, false);
        } else {
            // Refresh page context
            this.detectCurrentPage();
            this.updateNavigation();
        }
    }

    // User role-based navigation
    redirectBasedOnRole(user) {
        if (!user) {
            this.goToLogin();
            return;
        }

        switch (user.role) {
            case 'admin':
                this.goToDashboard();
                break;

            case 'station':
                if (user.station_acronym) {
                    this.goToStation(user.station_acronym);
                } else {
                    this.goToLogin();
                }
                break;

            case 'readonly':
                // Readonly users no longer have dashboard access
                this.goToLogin();
                break;

            default:
                this.goToLogin();
                break;
        }
    }

    // Check if navigation is allowed for current user
    canAccessPage(page, user) {
        if (!user) return page === 'login' || page === 'home';

        switch (page) {
            case 'dashboard':
                return user.role === 'admin';

            case 'station':
                // Admin can access any station, station users only their own
                if (user.role === 'admin') return true;
                if (user.role === 'station' && user.station_acronym === this.currentStationAcronym) return true;
                return false;

            case 'login':
            case 'home':
                return true;

            default:
                return false;
        }
    }

    // Utility methods
    getCurrentPage() {
        return this.currentPage;
    }

    getCurrentStationAcronym() {
        return this.currentStationAcronym;
    }

    getNavigationHistory() {
        return [...this.navigationHistory];
    }

    // URL parameter helpers
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    setUrlParameter(name, value) {
        const url = new URL(window.location);
        url.searchParams.set(name, value);
        history.replaceState({ url: url.toString() }, '', url.toString());
    }

    removeUrlParameter(name) {
        const url = new URL(window.location);
        url.searchParams.delete(name);
        history.replaceState({ url: url.toString() }, '', url.toString());
    }

    // Build URLs with parameters
    buildUrl(path, params = {}) {
        const url = new URL(path, window.location.origin);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.set(key, value);
            }
        });

        return url.toString();
    }
}

// Global instance
window.sitesNavigation = new SitesNavigation();

// Global convenience functions
function navigateTo(url) {
    return window.sitesNavigation.navigateTo(url);
}

function goBack() {
    return window.sitesNavigation.goBack();
}

function goToDashboard() {
    return window.sitesNavigation.goToDashboard();
}

function goToStation(stationAcronym) {
    return window.sitesNavigation.goToStation(stationAcronym);
}

function redirectBasedOnRole(user) {
    return window.sitesNavigation.redirectBasedOnRole(user);
}

function canAccessPage(page, user) {
    return window.sitesNavigation.canAccessPage(page, user);
}