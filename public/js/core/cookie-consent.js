/**
 * Cookie Consent Manager
 * GDPR-compliant cookie consent banner for SITES Spectral
 *
 * @version 13.25.0
 * @description Manages essential cookie consent for authentication
 */

(function() {
    'use strict';

    const CONSENT_KEY = 'sites_spectral_cookie_consent';
    const CONSENT_VERSION = '1.0';

    /**
     * Check if user has already consented
     * @returns {boolean}
     */
    function hasConsented() {
        try {
            const consent = localStorage.getItem(CONSENT_KEY);
            if (consent) {
                const data = JSON.parse(consent);
                return data.version === CONSENT_VERSION && data.accepted === true;
            }
        } catch (e) {
            console.error('Error checking cookie consent:', e);
        }
        return false;
    }

    /**
     * Save consent
     */
    function saveConsent() {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                version: CONSENT_VERSION,
                accepted: true,
                timestamp: new Date().toISOString()
            }));
        } catch (e) {
            console.error('Error saving cookie consent:', e);
        }
    }

    /**
     * Create icon element
     * @param {string} iconClass - FontAwesome icon class
     * @returns {HTMLElement}
     */
    function createIcon(iconClass) {
        const icon = document.createElement('i');
        icon.className = iconClass;
        return icon;
    }

    /**
     * Create and show the cookie consent banner using safe DOM methods
     */
    function showConsentBanner() {
        // Don't show if already consented
        if (hasConsented()) {
            return;
        }

        // Create banner container
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookie-consent-title');
        banner.setAttribute('aria-describedby', 'cookie-consent-description');

        // Create content wrapper
        const content = document.createElement('div');
        content.className = 'cookie-consent-content';

        // Create icon section
        const iconDiv = document.createElement('div');
        iconDiv.className = 'cookie-consent-icon';
        iconDiv.appendChild(createIcon('fas fa-cookie-bite'));

        // Create text section
        const textDiv = document.createElement('div');
        textDiv.className = 'cookie-consent-text';

        const title = document.createElement('h3');
        title.id = 'cookie-consent-title';
        title.textContent = 'Cookie Notice';

        const description = document.createElement('p');
        description.id = 'cookie-consent-description';
        description.appendChild(document.createTextNode('SITES Spectral uses '));
        const strong = document.createElement('strong');
        strong.textContent = 'essential cookies only';
        description.appendChild(strong);
        description.appendChild(document.createTextNode(' for secure authentication. We do not use tracking or analytics cookies. By continuing to use this site, you agree to our use of essential cookies.'));

        const linksP = document.createElement('p');
        linksP.className = 'cookie-consent-links';

        const privacyLink = document.createElement('a');
        privacyLink.href = '/privacy-policy.html';
        privacyLink.target = '_blank';
        privacyLink.textContent = 'Privacy Policy';

        const separator = document.createElement('span');
        separator.className = 'separator';
        separator.textContent = ' | ';

        const termsLink = document.createElement('a');
        termsLink.href = '/terms-of-service.html';
        termsLink.target = '_blank';
        termsLink.textContent = 'Terms of Service';

        linksP.appendChild(privacyLink);
        linksP.appendChild(separator);
        linksP.appendChild(termsLink);

        textDiv.appendChild(title);
        textDiv.appendChild(description);
        textDiv.appendChild(linksP);

        // Create actions section
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'cookie-consent-actions';

        const acceptBtn = document.createElement('button');
        acceptBtn.id = 'cookie-consent-accept';
        acceptBtn.className = 'cookie-consent-btn cookie-consent-btn-primary';
        acceptBtn.appendChild(createIcon('fas fa-check'));
        acceptBtn.appendChild(document.createTextNode(' Accept'));

        const learnBtn = document.createElement('button');
        learnBtn.id = 'cookie-consent-learn';
        learnBtn.className = 'cookie-consent-btn cookie-consent-btn-secondary';
        learnBtn.appendChild(createIcon('fas fa-info-circle'));
        learnBtn.appendChild(document.createTextNode(' Learn More'));

        actionsDiv.appendChild(acceptBtn);
        actionsDiv.appendChild(learnBtn);

        // Assemble banner
        content.appendChild(iconDiv);
        content.appendChild(textDiv);
        content.appendChild(actionsDiv);
        banner.appendChild(content);

        // Add to page
        document.body.appendChild(banner);

        // Add event listeners
        acceptBtn.addEventListener('click', function() {
            saveConsent();
            hideBanner();
        });

        learnBtn.addEventListener('click', function() {
            window.open('/privacy-policy.html', '_blank');
        });

        // Show banner with animation
        requestAnimationFrame(function() {
            banner.classList.add('show');
        });
    }

    /**
     * Hide the consent banner
     */
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            banner.classList.add('hide');
            setTimeout(function() {
                banner.remove();
            }, 300);
        }
    }

    /**
     * Initialize cookie consent on DOM ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showConsentBanner);
        } else {
            showConsentBanner();
        }
    }

    // Expose public API
    window.CookieConsent = {
        hasConsented: hasConsented,
        showBanner: showConsentBanner,
        acceptConsent: function() {
            saveConsent();
            hideBanner();
        },
        revokeConsent: function() {
            localStorage.removeItem(CONSENT_KEY);
        }
    };

    // Auto-initialize
    init();

})();
