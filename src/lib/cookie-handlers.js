/**
 * Cookie Banner Detection and Acceptance Logic
 * Handles common cookie consent providers
 */

export const COOKIE_PROVIDERS = {
    // Cookiebot
    cookiebot: {
        selector: '[data-testid="uc-accept-all-button"], [data-testid="cookiebot-accept-all"], #CybotCookiebotDialogBodyLevelButtonAcceptAll, #cookiebot-accept-all, .cookiebot-accept-all',
        name: 'Cookiebot'
    },

    // CookieInformation
    cookieinformation: {
        selector: '[data-testid="accept-all"], .cookieconsent-accept-all, #cookieconsent-accept-all, .accept-all-cookies',
        name: 'CookieInformation'
    },

    // OneTrust
    onetrust: {
        selector: '#onetrust-accept-btn-handler, .onetrust-accept-all, #acceptAllBtn, .cookie-accept-all',
        name: 'OneTrust'
    },

    // Shopify
    shopify: {
        selector: '[data-testid="cookie-banner-accept"], .cookie-banner-accept, .accept-cookies, .cookie-consent-accept',
        name: 'Shopify'
    },

    // Generic/Common selectors
    generic: {
        selector: '[data-action="accept"], [data-cy="accept-all"], .accept-all, .accept-cookies, .gdpr-accept, .consent-accept, .cookie-accept, .btn-accept-all, .accept-all-cookies, .js-accept-cookies, .cookie-banner-accept',
        name: 'Generic'
    },

    // GDPR/Cookie Notice plugins
    gdpr: {
        selector: '.gdpr-accept, .cookie-notice-accept, .cn-accept-cookie, .cookie-alert-accept, .cookie-popup-accept',
        name: 'GDPR Plugin'
    },

    // WooCommerce
    woocommerce: {
        selector: '.woocommerce-accept-cookies, .wc-accept-cookies',
        name: 'WooCommerce'
    },

    // WordPress plugins
    wordpress: {
        selector: '.cookie-law-accept, .wp-cookie-notice-accept, .gdpr-cookie-accept',
        name: 'WordPress'
    },

    // Iubenda
    iubenda: {
        selector: '.iubenda-cs-accept-btn, .iubenda-accept-all',
        name: 'Iubenda'
    },

    // Termly
    termly: {
        selector: '.termly-accept-all, .termly-consent-accept',
        name: 'Termly'
    }
};

/**
 * Attempts to detect and accept cookie banners
 * @param {Window} window - Browser window object
 * @returns {Promise<{success: boolean, provider?: string, message: string}>}
 */
export async function detectAndAcceptCookies(window) {
    return new Promise((resolve) => {
        try {
            // Wait a bit for banners to load
            setTimeout(() => {
                let foundProvider = null;
                let accepted = false;

                // Try each provider's selectors
                for (const [key, provider] of Object.entries(COOKIE_PROVIDERS)) {
                    try {
                        const elements = window.document.querySelectorAll(provider.selector);

                        for (const element of elements) {
                            // Check if element is visible
                            const style = window.getComputedStyle(element);
                            if (style.display !== 'none' &&
                                style.visibility !== 'hidden' &&
                                style.opacity !== '0' &&
                                element.offsetParent !== null) {

                                // Click the accept button
                                element.click();
                                foundProvider = provider.name;
                                accepted = true;

                                console.log(`Accepted cookies using ${provider.name}`);
                                break;
                            }
                        }

                        if (accepted) break;
                    } catch (error) {
                        console.warn(`Error checking ${provider.name}:`, error);
                    }
                }

                if (accepted) {
                    resolve({
                        success: true,
                        provider: foundProvider,
                        message: `Successfully accepted cookies using ${foundProvider}`
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'No cookie banner found or unable to accept cookies automatically'
                    });
                }
            }, 2000); // Wait 2 seconds for banners to appear

        } catch (error) {
            resolve({
                success: false,
                message: `Error detecting cookies: ${error.message}`
            });
        }
    });
}

/**
 * Waits for page to fully load including dynamic content
 * @param {Window} window - Browser window object
 * @returns {Promise<boolean>}
 */
export async function waitForPageLoad(window) {
    return new Promise((resolve) => {
        // Check if document is ready
        if (window.document.readyState === 'complete') {
            // Wait a bit more for dynamic content
            setTimeout(() => resolve(true), 2000);
            return;
        }

        // Wait for load event
        window.addEventListener('load', () => {
            setTimeout(() => resolve(true), 1500);
        });

        // Fallback timeout
        setTimeout(() => resolve(true), 10000);
    });
}

/**
 * Checks if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}