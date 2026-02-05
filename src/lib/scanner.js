import puppeteer from 'puppeteer';

/**
 * Browser-based website scanner for tracking data analysis
 */
class WebsiteScanner {
    constructor() {
        this.browser = null;
        this.page = null;
        this.url = null;
    }

    /**
     * Initialize the scanner with a new browser instance
     * @param {Object} options - Browser launch options
     */
    async initialize(options = {}) {
        try {
            console.log('Initializing Puppeteer browser...');

            // Check if we're on Windows and might need different args
            const isWindows = process.platform === 'win32';
            console.log('Platform:', process.platform);

            const launchOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                ...options
            };

            // Add Windows-specific args if needed
            if (isWindows) {
                launchOptions.args.push('--disable-web-security');
                launchOptions.args.push('--disable-features=VizDisplayCompositor');
            }

            console.log('Launch options:', launchOptions);

            this.browser = await puppeteer.launch(launchOptions);
            console.log('Browser initialized successfully');

            return { success: true, message: 'Scanner initialized successfully' };
        } catch (error) {
            console.error('Browser initialization failed:', error);
            return { success: false, message: `Failed to initialize scanner: ${error.message}` };
        }
    }

    /**
     * Navigate to the target URL
     * @param {string} url - Target URL to scan
     */
    async navigateToUrl(url) {
        try {
            if (!this.browser) {
                throw new Error('Scanner not initialized. Call initialize() first.');
            }

            console.log(`Creating new page for URL: ${url}`);
            this.url = url;
            this.page = await this.browser.newPage();
            console.log('Page created successfully');

            // Set viewport for consistent results
            await this.page.setViewport({ width: 1920, height: 1080 });
            console.log('Viewport set');

            // Set user agent to avoid bot detection
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            console.log('User agent set');

            console.log(`Navigating to ${url}...`);
            // Navigate to URL with increased timeout and flexible wait strategy
            // Try 'load' first, fallback to 'domcontentloaded' if timeout
            let response;
            try {
                response = await this.page.goto(url, {
                    waitUntil: 'load', // Wait for all resources to load
                    timeout: 60000 // Increased to 60 seconds for slow sites
                });
            } catch (timeoutError) {
                // If load times out, try domcontentloaded (faster, less reliable)
                console.warn('Load timeout, trying domcontentloaded...');
                try {
                    response = await this.page.goto(url, {
                        waitUntil: 'domcontentloaded',
                        timeout: 30000
                    });
                } catch (domError) {
                    // Even if navigation fails, check if page is accessible
                    const currentUrl = this.page.url();
                    if (currentUrl && currentUrl !== 'about:blank') {
                        console.warn('Navigation timeout but page loaded:', currentUrl);
                        response = { ok: () => true, status: () => 200 }; // Mock response
                    } else {
                        throw new Error(`Navigation timeout: ${domError.message}`);
                    }
                }
            }

            if (!response) {
                // Check if page is still accessible despite no response
                const currentUrl = this.page.url();
                if (currentUrl && currentUrl !== 'about:blank') {
                    console.warn('No response object but page loaded:', currentUrl);
                    return { success: true, message: `Successfully navigated to ${url} (no response object)` };
                }
                throw new Error('Navigation failed - no response received');
            }

            // Check response status if available
            if (response.ok && typeof response.ok === 'function') {
                if (!response.ok()) {
                    const status = response.status ? response.status() : 'unknown';
                    console.warn(`Navigation returned non-OK status: ${status}, but continuing...`);
                }
            }

            console.log(`Successfully navigated to ${url}`);

            return { success: true, message: `Successfully navigated to ${url}` };
        } catch (error) {
            console.error('Navigation failed:', error);
            return { success: false, message: `Failed to navigate to URL: ${error.message}` };
        }
    }

    /**
     * Wait for the page to fully load and stabilize
     */
    async waitForPageLoad() {
        try {
            if (!this.page) {
                throw new Error('No page loaded. Call navigateToUrl() first.');
            }

            // Wait for the body element to be available (with longer timeout)
            try {
                await this.page.waitForSelector('body', { timeout: 15000 });
            } catch (e) {
                // If body selector fails, check if page is still accessible
                const currentUrl = this.page.url();
                if (currentUrl && currentUrl !== 'about:blank') {
                    console.warn('Body selector timeout but page is accessible:', currentUrl);
                } else {
                    throw e;
                }
            }

            // Wait for document ready state with multiple strategies
            try {
                await this.page.waitForFunction(
                    () => {
                        return document.readyState === 'complete' || document.readyState === 'interactive';
                    },
                    { timeout: 30000 }
                );
            } catch (e) {
                // If readyState check fails, try a simpler check
                console.warn('ReadyState check timeout, trying alternative...');
                try {
                    await this.page.waitForFunction(
                        () => {
                            return document.body && document.body.children.length > 0;
                        },
                        { timeout: 10000 }
                    );
                } catch (e2) {
                    // Even if this fails, continue - page might be slow but functional
                    console.warn('Alternative readyState check also timed out, continuing anyway...');
                }
            }

            // Additional wait for dynamic content and cookie banners to load
            await new Promise(resolve => setTimeout(resolve, 3000));

            return { success: true, message: 'Page fully loaded' };
        } catch (error) {
            // Don't fail completely - page might still be usable
            console.warn('Page load wait had issues but continuing:', error.message);
            return { success: true, message: `Page loaded (with warnings: ${error.message})` };
        }
    }

    /**
     * Get basic page information
     */
    async getPageInfo() {
        try {
            if (!this.page) {
                throw new Error('No page loaded');
            }

            const pageInfo = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    scripts: Array.from(document.querySelectorAll('script')).length,
                    links: Array.from(document.querySelectorAll('a')).length,
                    images: Array.from(document.querySelectorAll('img')).length,
                    cookies: document.cookie ? document.cookie.split(';').length : 0
                };
            });

            return { success: true, data: pageInfo };
        } catch (error) {
            return { success: false, message: `Failed to get page info: ${error.message}` };
        }
    }

    /**
     * Get full HTML content of the page
     */
    async getPageHTML() {
        try {
            if (!this.page) {
                throw new Error('No page loaded');
            }
            const html = await this.page.content();
            return { success: true, data: html };
        } catch (error) {
            return { success: false, message: `Failed to get HTML content: ${error.message}` };
        }
    }

    /**
     * Scan for JSON-LD structured data (application/ld+json)
     * Extracts and validates JSON-LD scripts from the page
     */
    async scanJsonLd() {
        try {
            if (!this.page) {
                return {
                    success: false,
                    message: 'No page loaded'
                };
            }

            console.log('Scanning for JSON-LD structured data...');

            const jsonLdData = await this.page.evaluate(() => {
                const results = {
                    found: false,
                    scripts: [],
                    schemas: [],
                    types: [],
                    errors: []
                };

                // Find all script tags with type="application/ld+json"
                const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

                if (jsonLdScripts.length === 0) {
                    return results;
                }

                results.found = true;

                jsonLdScripts.forEach((script, index) => {
                    try {
                        const textContent = script.textContent || script.innerHTML || '';
                        
                        if (!textContent.trim()) {
                            return;
                        }

                        // Parse JSON-LD content
                        let parsed;
                        try {
                            parsed = JSON.parse(textContent);
                        } catch (parseError) {
                            results.errors.push({
                                index: index,
                                error: `JSON parse error: ${parseError.message}`,
                                content: textContent.substring(0, 200) // First 200 chars for debugging
                            });
                            return;
                        }

                        // Handle both single objects and arrays
                        const schemas = Array.isArray(parsed) ? parsed : [parsed];

                        schemas.forEach((schema, schemaIndex) => {
                            // Extract schema information
                            const schemaInfo = {
                                index: index,
                                schemaIndex: schemaIndex,
                                type: schema['@type'] || 'Unknown',
                                context: schema['@context'] || null,
                                id: schema['@id'] || null,
                                raw: schema,
                                properties: Object.keys(schema).filter(key => !key.startsWith('@')),
                                isValid: true
                            };

                            // Validate that it's actually JSON-LD (should have @context or @type)
                            if (!schema['@context'] && !schema['@type']) {
                                schemaInfo.isValid = false;
                                schemaInfo.validationError = 'Missing @context or @type';
                            }

                            // Check for common Schema.org types
                            if (schema['@context'] && typeof schema['@context'] === 'string') {
                                if (schema['@context'].includes('schema.org')) {
                                    schemaInfo.schemaOrg = true;
                                }
                            }

                            results.schemas.push(schemaInfo);
                            results.types.push(schemaInfo.type);

                            // Store full script data
                            results.scripts.push({
                                index: index,
                                type: script.type,
                                content: textContent,
                                parsed: schema,
                                schemaInfo: schemaInfo
                            });
                        });
                    } catch (error) {
                        results.errors.push({
                            index: index,
                            error: `Processing error: ${error.message}`
                        });
                    }
                });

                // Remove duplicate types
                results.types = [...new Set(results.types)];

                return results;
            });

            console.log(`Found ${jsonLdData.schemas.length} JSON-LD schema(s) with ${jsonLdData.types.length} unique type(s)`);
            if (jsonLdData.errors.length > 0) {
                console.warn(`Found ${jsonLdData.errors.length} JSON-LD parsing error(s)`);
            }

            return {
                success: true,
                data: jsonLdData
            };
        } catch (error) {
            console.error('Error scanning JSON-LD:', error);
            return {
                success: false,
                message: `Failed to scan JSON-LD: ${error.message}`,
                data: {
                    found: false,
                    scripts: [],
                    schemas: [],
                    types: [],
                    errors: []
                }
            };
        }
    }

    /**
     * Clean up browser resources
     */
    async cleanup() {
        try {
            if (this.page) {
                await this.page.close();
                this.page = null;
            }
            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
            return { success: true, message: 'Scanner cleaned up successfully' };
        } catch (error) {
            return { success: false, message: `Failed to cleanup scanner: ${error.message}` };
        }
    }

    /**
     * Check if scanner is ready
     */
    isReady() {
        return this.browser !== null;
    }

    /**
     * Check if page is loaded
     */
    hasPage() {
        return this.page !== null;
    }

    /**
     * Accept cookies and detect CMP provider with enhanced information
     * This approach detects specific CMP providers and extracts detailed cookie data
     */
    async acceptCookies() {
        try {
            if (!this.page) {
                return {
                    success: false,
                    message: 'No page loaded'
                };
            }

            console.log('Attempting to accept cookies and detect CMP provider...');

            // Wait a moment for any cookie banners to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            const result = await this.page.evaluate(() => {
                // Common accept button text patterns in multiple languages
                const acceptPatterns = [
                    // English
                    'accept all', 'accept', 'accept cookies', 'allow all', 'allow', 'allow cookies',
                    'i accept', 'i agree', 'ok', 'okay', 'yes', 'agree', 'consent', 'save',
                    // Danish (enhanced)
                    'tillad alle', 'tillad', 'accepter alle', 'accepter', 'ok', 'ja',
                    'jeg accepterer', 'jeg accepterer alle', 'accepter alle', 'godkend alle',
                    'godkend', 'gem og luk', 'gem',
                    // German
                    'alle akzeptieren', 'akzeptieren', 'verstanden', 'zustimmen', 'okay', 'ok', 'ja',
                    // French
                    'accepter tout', 'accepter', 'tous accepter', 'd\'accord', 'ok', 'oui', 'j\'accepte',
                    // Spanish
                    'aceptar todo', 'aceptar', 'todo aceptar', 'de acuerdo', 'ok', 'sí', 'acepto',
                    // Italian
                    'accetta tutto', 'accetta', 'tutto accettare', 'ok', 'va bene', 'sì', 'accetto',
                    // Dutch
                    'alles accepteren', 'accepteren', 'akkoord', 'ok', 'ja', 'ik accepteer',
                    // Swedish
                    'acceptera alla', 'acceptera', 'alla acceptera', 'ok', 'ja', 'jag accepterar',
                    // Norwegian
                    'godta alle', 'godta', 'aksepter', 'ok', 'ja', 'jeg godtar'
                ];

                // Detect CMP providers
                const cmpDetection = {
                    // CookieInformation (coi- prefix)
                    cookieinformation: () => {
                        const coiElements = document.querySelectorAll('[class*="coi-"], [id*="coi"]');
                        const coiScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && s.src.includes('cookieinformation')
                        );
                        if (coiElements.length > 0 || coiScripts.length > 0) {
                            return {
                                name: 'CookieInformation',
                                confidence: 'high',
                                elements: coiElements.length,
                                scripts: coiScripts.length,
                                version: coiScripts.length > 0 ? 'Script detected' : 'Banner detected'
                            };
                        }
                        return null;
                    },

                    // OneTrust
                    onetrust: () => {
                        const otElements = document.querySelectorAll('[class*="onetrust"], [id*="onetrust"], #onetrust-banner-sdk');
                        const otScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && (s.src.includes('onetrust') || s.src.includes('cookiepro'))
                        );
                        if (otElements.length > 0 || otScripts.length > 0) {
                            return {
                                name: 'OneTrust',
                                confidence: 'high',
                                elements: otElements.length,
                                scripts: otScripts.length,
                                version: otScripts.length > 0 ? 'Enterprise' : 'Standard'
                            };
                        }
                        return null;
                    },

                    // Cookiebot
                    cookiebot: () => {
                        const cbElements = document.querySelectorAll('[class*="cookiebot"], [id*="cookiebot"], #CybotCookiebotDialog');
                        const cbScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && s.src.includes('cookiebot')
                        );
                        if (cbElements.length > 0 || cbScripts.length > 0) {
                            return {
                                name: 'Cookiebot',
                                confidence: 'high',
                                elements: cbElements.length,
                                scripts: cbScripts.length,
                                version: cbScripts.length > 0 ? 'Cloud' : 'On-premise'
                            };
                        }
                        return null;
                    },

                    // Termly
                    termly: () => {
                        const termlyElements = document.querySelectorAll('[class*="termly"], [id*="termly"]');
                        const termlyScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && s.src.includes('termly')
                        );
                        if (termlyElements.length > 0 || termlyScripts.length > 0) {
                            return {
                                name: 'Termly',
                                confidence: 'high',
                                elements: termlyElements.length,
                                scripts: termlyScripts.length
                            };
                        }
                        return null;
                    },

                    // CookieYes - Enhanced detection
                    cookieyes: () => {
                        // Check for CookieYes-specific selectors
                        const cySelectors = [
                            '[id*="cookieyes"]',
                            '[class*="cookieyes"]',
                            '[id*="ckyes"]',
                            '[class*="ckyes"]',
                            '#cookieyes-banner',
                            '.cookieyes-banner',
                            '#ckyes-banner',
                            '.ckyes-banner',
                            '[data-cookieyes]',
                            '[data-ckyes]'
                        ];
                        
                        let cyElements = [];
                        cySelectors.forEach(selector => {
                            try {
                                const found = document.querySelectorAll(selector);
                                cyElements = cyElements.concat(Array.from(found));
                            } catch (e) {
                                // Ignore selector errors
                            }
                        });
                        
                        // Check for CookieYes scripts
                        const cyScripts = Array.from(document.querySelectorAll('script')).filter(s => {
                            const src = s.src || '';
                            const content = s.textContent || '';
                            return src.includes('cookieyes') || 
                                   src.includes('ckyes') ||
                                   content.includes('cookieyes') ||
                                   content.includes('ckyes');
                        });
                        
                        // Check for CookieYes in dataLayer or window objects
                        const hasCookieYesGlobal = typeof window !== 'undefined' && (
                            window.cookieyes || 
                            window.CookieYes ||
                            window.ckyes ||
                            (window.dataLayer && window.dataLayer.some(item => 
                                item && (item.cookieyes || item.CookieYes || item.ckyes)
                            ))
                        );
                        
                        if (cyElements.length > 0 || cyScripts.length > 0 || hasCookieYesGlobal) {
                            return {
                                name: 'CookieYes',
                                confidence: 'high',
                                elements: cyElements.length,
                                scripts: cyScripts.length,
                                hasGlobal: !!hasCookieYesGlobal,
                                version: cyScripts.length > 0 ? 'Script detected' : 'Banner detected'
                            };
                        }
                        return null;
                    },

                    // GDPR Cookie Compliance (WordPress)
                    gdprCookieCompliance: () => {
                        const gdprElements = document.querySelectorAll('.gdpr-cookie-compliance-modal, [class*="gdpr"]');
                        if (gdprElements.length > 0) {
                            return {
                                name: 'GDPR Cookie Compliance',
                                confidence: 'medium',
                                elements: gdprElements.length,
                                scripts: 0,
                                platform: 'WordPress'
                            };
                        }
                        return null;
                    },

                    // CookieScript
                    cookiescript: () => {
                        const csElements = document.querySelectorAll('[id*="cookiescript"], [class*="cookiescript"], #cookiescript_injected');
                        const csScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && s.src.includes('cookiescript')
                        );
                        if (csElements.length > 0 || csScripts.length > 0) {
                            return {
                                name: 'CookieScript',
                                confidence: 'high',
                                elements: csElements.length,
                                scripts: csScripts.length
                            };
                        }
                        return null;
                    },

                    // Generic cookie banner detection
                    generic: () => {
                        const cookieElements = document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="gdpr"], [id*="gdpr"]');
                        const cookieScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && (s.src.includes('cookie') || s.src.includes('consent') || s.src.includes('gdpr'))
                        );

                        // Look for common cookie banner patterns
                        const bannerPatterns = [
                            /cookie.*banner/i,
                            /cookie.*consent/i,
                            /gdpr.*banner/i,
                            /privacy.*banner/i
                        ];

                        let bannerFound = false;
                        for (const element of cookieElements) {
                            const text = element.textContent || '';
                            const html = element.innerHTML || '';
                            if (bannerPatterns.some(pattern => pattern.test(text) || pattern.test(html))) {
                                bannerFound = true;
                                break;
                            }
                        }

                        if (bannerFound || cookieElements.length > 3 || cookieScripts.length > 0) {
                            return {
                                name: 'Generic Cookie Banner',
                                confidence: 'low',
                                elements: cookieElements.length,
                                scripts: cookieScripts.length
                            };
                        }
                        return null;
                    }
                };

                // Get and analyze cookie information for consent patterns FIRST
                const cookieString = document.cookie || '';
                const cookies = cookieString ? cookieString.split(';').length : 0;
                const cookiePairs = cookieString ? cookieString.split(';').map(c => {
                    const parts = c.trim().split('=');
                    return {
                        name: parts[0] || '',
                        value: parts.slice(1).join('=') || ''
                    };
                }).filter(c => c.name) : [];
                const cookieKeys = cookiePairs.map(c => c.name);
                
                // Analyze cookies for consent patterns
                const consentPatterns = {
                    // Common consent cookie names
                    consent: ['consent', 'cookie_consent', 'cookieconsent', 'gdpr_consent', 'privacy_consent'],
                    cookieyes: ['cookieyes', 'ckyes', 'cky-consent', 'cookieyes-consent'],
                    cookiebot: ['cookiebot', 'cookiebot-consent', 'CookieConsent'],
                    cookieinformation: ['cookieinformation', 'coi-consent', 'cookieconsent'],
                    onetrust: ['onetrust', 'OptanonConsent', 'OptanonAlertBoxClosed'],
                    termly: ['termly', 'termly-consent'],
                    iubenda: ['iubenda', 'iub-consent'],
                    // Generic patterns
                    accepted: ['accepted', 'accept', 'agreed', 'agree'],
                    preferences: ['preferences', 'preference', 'settings'],
                    marketing: ['marketing', 'analytics', 'advertising'],
                    necessary: ['necessary', 'required', 'essential']
                };
                
                const consentAnalysis = {
                    foundConsentCookies: [],
                    consentValues: {},
                    detectedProviders: [],
                    consentStatus: 'unknown'
                };
                
                cookiePairs.forEach(cookie => {
                    const nameLower = cookie.name.toLowerCase();
                    const valueLower = cookie.value.toLowerCase();
                    
                    // Check for provider-specific patterns
                    Object.keys(consentPatterns).forEach(provider => {
                        if (consentPatterns[provider].some(pattern => nameLower.includes(pattern))) {
                            if (!consentAnalysis.detectedProviders.includes(provider)) {
                                consentAnalysis.detectedProviders.push(provider);
                            }
                            consentAnalysis.foundConsentCookies.push({
                                name: cookie.name,
                                value: cookie.value.substring(0, 100), // Limit value length
                                provider: provider
                            });
                            consentAnalysis.consentValues[provider] = cookie.value;
                        }
                    });
                    
                    // Check for consent status in value
                    if (valueLower.includes('true') || valueLower.includes('1') || valueLower.includes('yes') || valueLower.includes('accepted')) {
                        consentAnalysis.consentStatus = 'accepted';
                    } else if (valueLower.includes('false') || valueLower.includes('0') || valueLower.includes('no') || valueLower.includes('rejected')) {
                        if (consentAnalysis.consentStatus === 'unknown') {
                            consentAnalysis.consentStatus = 'rejected';
                        }
                    }
                });
                
                const cookieDomains = cookieKeys.length;

                // Try to identify CMP provider
                let detectedCMP = null;
                const cmpKeys = Object.keys(cmpDetection);
                for (const key of cmpKeys) {
                    const result = cmpDetection[key]();
                    if (result) {
                        detectedCMP = result;
                        break;
                    }
                }
                
                // If no CMP detected but we found consent cookies, try to infer from cookies
                if (!detectedCMP && consentAnalysis.detectedProviders.length > 0) {
                    const providerFromCookies = consentAnalysis.detectedProviders[0];
                    // Map cookie provider names to CMP names
                    const providerMap = {
                        'cookieyes': 'CookieYes',
                        'cookiebot': 'Cookiebot',
                        'cookieinformation': 'CookieInformation',
                        'onetrust': 'OneTrust',
                        'termly': 'Termly',
                        'iubenda': 'Iubenda'
                    };
                    
                    const mappedName = providerMap[providerFromCookies] || providerFromCookies;
                    detectedCMP = {
                        name: mappedName,
                        confidence: 'medium',
                        elements: 0,
                        scripts: 0,
                        detectedFrom: 'cookie-analysis'
                    };
                }

                // Enhanced selectors for common cookie banners
                const selectors = [
                    // CMP-specific selectors (prioritize these)
                    ...(detectedCMP ? [
                        // CookieInformation
                        detectedCMP.name === 'CookieInformation' ? [
                            '[class*="coi-banner"] button[class*="accept"]',
                            '[class*="coi-consent"] button[class*="accept"]',
                            '[id*="coi"] button[class*="accept"]',
                            '[class*="coi-banner"] a[class*="accept"]',
                            '[class*="coi-consent"] a[class*="accept"]'
                        ] : [],

                        // OneTrust
                        detectedCMP.name === 'OneTrust' ? [
                            '#onetrust-accept-btn-handler',
                            '[class*="onetrust"] button[class*="accept"]',
                            '#onetrust-banner-sdk button[class*="accept"]'
                        ] : [],

                        // Cookiebot
                        detectedCMP.name === 'Cookiebot' ? [
                            '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowallSelection',
                            '[class*="cookiebot"] button[class*="accept"]',
                            '#cookiebot button[class*="accept"]'
                        ] : [],

                        // CookieYes - Enhanced selectors
                        detectedCMP.name === 'CookieYes' ? [
                            '#cookieyes-banner button',
                            '#cookieyes-banner a',
                            '#ckyes-banner button',
                            '#ckyes-banner a',
                            '[id*="cookieyes"] button[class*="accept"]',
                            '[id*="cookieyes"] a[class*="accept"]',
                            '[class*="cookieyes"] button[class*="accept"]',
                            '[class*="cookieyes"] a[class*="accept"]',
                            '[id*="ckyes"] button[class*="accept"]',
                            '[id*="ckyes"] a[class*="accept"]',
                            '[data-cookieyes] button',
                            '[data-cookieyes] a',
                            'button[data-cookieyes-accept]',
                            'a[data-cookieyes-accept]'
                        ] : [],

                        // CookieScript - Enhanced selectors
                        detectedCMP.name === 'CookieScript' ? [
                            '#cookiescript_accept',
                            '#cookiescript_save',
                            '[id*="cookiescript"] [role="button"][id*="accept"]',
                            '[id*="cookiescript"] [role="button"][id*="save"]',
                            '[class*="cookiescript"] [role="button"][id*="accept"]',
                            '[class*="cookiescript"] button[id*="accept"]',
                            '[class*="cookiescript"] a[id*="accept"]'
                        ] : []
                    ].flat() : []),

                    // Generic selectors - including role="button" elements
                    'button[class*="accept"]',
                    'button[class*="agree"]',
                    'button[class*="consent"]',
                    'a[class*="accept"]',
                    'a[class*="agree"]',
                    'button[id*="accept"]',
                    'button[id*="agree"]',
                    'a[id*="accept"]',
                    'a[id*="agree"]',
                    
                    // Role-based button elements (div, span with role="button")
                    '[role="button"][class*="accept"]',
                    '[role="button"][class*="agree"]',
                    '[role="button"][id*="accept"]',
                    '[role="button"][id*="agree"]',
                    '[role="button"][id*="save"]',
                    'div[role="button"][class*="accept"]',
                    'div[role="button"][id*="accept"]',
                    'span[role="button"][class*="accept"]',
                    'span[role="button"][id*="accept"]',

                    // General
                    'button',
                    'a',
                    '[role="button"]', // Catch all role="button" elements

                    // Fallback selectors
                    '[class*="cookie"] button',
                    '[id*="cookie"] button',
                    '[class*="consent"] button',
                    '[id*="consent"] button',
                    '[class*="cookie"] [role="button"]',
                    '[id*="cookie"] [role="button"]',
                    '[class*="consent"] [role="button"]',
                    '[id*="consent"] [role="button"]'
                ].flat();

                // Try each selector
                for (const selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            // Get text content - check both textContent and innerText
                            const text = (element.textContent || element.innerText || '').trim();
                            const ariaLabel = element.getAttribute('aria-label') || '';
                            const title = element.getAttribute('title') || '';
                            const dataText = element.getAttribute('data-cs-i18n-text') || '';
                            
                            // Combine all text sources for matching
                            const allText = `${text} ${ariaLabel} ${title} ${dataText}`.toLowerCase();
                            
                            // Check if text matches any accept pattern (more flexible matching)
                            const matchesPattern = acceptPatterns.some(pattern => {
                                const regex = new RegExp(pattern, "i");
                                return regex.test(text) || regex.test(ariaLabel) || regex.test(title) || regex.test(allText);
                            });

                            if (matchesPattern) {
                                // Check if element is visible and clickable
                                const style = window.getComputedStyle(element);
                                const isVisible = style.display !== 'none' &&
                                                style.visibility !== 'hidden' &&
                                                style.opacity !== '0' &&
                                                (element.offsetParent !== null || element.tagName === 'BODY');
                                
                                // Additional check: element should be within viewport or cookie banner
                                const rect = element.getBoundingClientRect();
                                const isInViewport = rect.width > 0 && rect.height > 0;
                                
                                // Check if element is inside a cookie banner/consent dialog
                                const isInCookieBanner = element.closest('[id*="cookie"], [class*="cookie"], [id*="consent"], [class*="consent"], [id*="gdpr"], [class*="gdpr"], [role="dialog"]') !== null;

                                if (isVisible && (isInViewport || isInCookieBanner)) {
                                    console.log('Found accept button:', selector, text, 'Tag:', element.tagName, 'Role:', element.getAttribute('role'));
                                    
                                    // Try multiple click methods for better compatibility
                                    try {
                                        // For elements with role="button", ensure they're focusable and clickable
                                        if (element.getAttribute('role') === 'button') {
                                            element.focus();
                                            // Trigger both click event and mousedown/mouseup for better compatibility
                                            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                                            element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                                        }
                                        element.click();
                                    } catch (clickError) {
                                        // Fallback: try programmatic click via dispatchEvent
                                        try {
                                            const clickEvent = new MouseEvent('click', {
                                                bubbles: true,
                                                cancelable: true,
                                                view: window
                                            });
                                            element.dispatchEvent(clickEvent);
                                        } catch (dispatchError) {
                                            console.warn('Click failed, trying focus and Enter key:', dispatchError);
                                            // Last resort: focus and simulate Enter key
                                            element.focus();
                                            const enterEvent = new KeyboardEvent('keydown', {
                                                key: 'Enter',
                                                code: 'Enter',
                                                keyCode: 13,
                                                bubbles: true
                                            });
                                            element.dispatchEvent(enterEvent);
                                        }
                                    }
                                    
                                    return {
                                        success: true,
                                        element: {
                                            tagName: element.tagName,
                                            id: element.id,
                                            className: element.className,
                                            role: element.getAttribute('role'),
                                            text: text.substring(0, 50)
                                        },
                                        selector: selector,
                                        method: detectedCMP ? 'cmp-specific' : 'text-based',
                                        cmp: detectedCMP,
                                        cookies: {
                                            count: cookies,
                                            keys: cookieKeys.slice(0, 10), // Limit to first 10 for privacy
                                            domains: cookieDomains,
                                            consentAnalysis: consentAnalysis
                                        }
                                    };
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('Error checking selector:', selector, e.message);
                    }
                }

                return {
                    success: false,
                    message: 'No clickable accept elements found',
                    cmp: detectedCMP,
                    cookies: {
                        count: cookies,
                        keys: cookieKeys.slice(0, 10),
                        domains: cookieDomains,
                        consentAnalysis: consentAnalysis
                    }
                };
            });

            if (result.success) {
                console.log('Successfully accepted cookies');
                
                // Wait for cookies to be set after clicking accept
                // Also wait for potential navigation/reload to complete
                try {
                    // Wait for navigation if it occurs (with timeout)
                    await Promise.race([
                        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null),
                        new Promise(resolve => setTimeout(resolve, 3000))
                    ]);
                } catch (navError) {
                    // Navigation might not occur, that's fine
                    console.log('No navigation detected after cookie acceptance');
                }
                
                // Additional wait for cookies to be set
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Re-read cookies after acceptance to check consent values
                // Handle case where page might have navigated/reloaded
                let cookiesAfterAccept = [];
                try {
                    cookiesAfterAccept = await this.page.evaluate(() => {
                        const cookieString = document.cookie || '';
                        const cookiePairs = cookieString ? cookieString.split(';').map(c => {
                            const parts = c.trim().split('=');
                            return {
                                name: parts[0] || '',
                                value: parts.slice(1).join('=') || ''
                            };
                        }).filter(c => c.name) : [];
                        
                        return cookiePairs;
                    });
                } catch (evalError) {
                    // Execution context might have been destroyed due to navigation
                    console.warn('Could not read cookies after acceptance (page may have navigated):', evalError.message);
                    // Try to get cookies using page.cookies() API instead
                    try {
                        const browserCookies = await this.page.cookies();
                        cookiesAfterAccept = browserCookies.map(c => ({
                            name: c.name,
                            value: c.value
                        }));
                        console.log('Retrieved cookies using page.cookies() API:', cookiesAfterAccept.length);
                    } catch (cookieError) {
                        console.warn('Could not retrieve cookies using page.cookies():', cookieError.message);
                        cookiesAfterAccept = [];
                    }
                }
                
                // Analyze ALL cookies for consent patterns and Consent Mode V2
                let consentModeV2Detected = false;
                let consentModeV2Details = null;
                
                // Define consent cookie patterns for all major CMPs
                const consentCookiePatterns = {
                    cookieyes: ['cookieyes-consent', 'ckyes-consent', 'cky-consent'],
                    cookiebot: ['cookiebot', 'cookieconsent', 'cookiebotconsent'],
                    cookieinformation: ['cookieinformation', 'coi-consent', 'cookieconsent'],
                    onetrust: ['optanonconsent', 'optanonalertboxclosed', 'onetrustconsent'],
                    termly: ['termly-consent', 'termlyconsent'],
                    iubenda: ['iubenda', 'iub-consent', 'iubendaconsent'],
                    shopify: ['cookieconsentdeclined', 'cookieconsentessentialgranted', 'cookieconsentmarketinggranted', 'cookieconsentpersonalizationgranted', 'cookieconsentpreferencesgranted', 'cookieconsentuserdata', 'cookiconsentpersonalization'],
                    generic: ['consent', 'cookie_consent', 'cookieconsent', 'gdpr_consent', 'privacy_consent', 'user_consent']
                };
                
                // Helper function to check if a value indicates consent granted
                const isConsentGranted = (value) => {
                    if (!value) return false;
                    const valueLower = String(value).toLowerCase();
                    return valueLower === 'yes' || valueLower === 'true' || valueLower === '1' || 
                           valueLower === 'accepted' || valueLower === 'granted' || valueLower === 'allow';
                };
                
                // Helper function to check for Google Consent Mode V2 properties
                const hasGoogleConsentModeV2Properties = (parsed) => {
                    if (!parsed || typeof parsed !== 'object') {
                        return false;
                    }
                    
                    // Check for googleconsentmap object (CookieScript format)
                    if (parsed.googleconsentmap && typeof parsed.googleconsentmap === 'object') {
                        const gcm = parsed.googleconsentmap;
                        // Google Consent Mode V2 requires these properties to exist
                        const requiredProps = ['ad_storage', 'analytics_storage', 'functionality_storage', 'security_storage'];
                        const hasAllRequired = requiredProps.every(prop => gcm.hasOwnProperty(prop));
                        if (hasAllRequired) {
                            console.log(`    Found googleconsentmap with all required properties:`, requiredProps);
                        }
                        return hasAllRequired;
                    }
                    
                    // Check for direct Google Consent Mode properties (at root level)
                    const directProps = ['ad_storage', 'analytics_storage', 'functionality_storage', 'security_storage'];
                    const hasDirectProps = directProps.some(prop => parsed.hasOwnProperty(prop));
                    
                    if (hasDirectProps) {
                        console.log(`    Found direct Google Consent Mode properties:`, directProps.filter(prop => parsed.hasOwnProperty(prop)));
                    }
                    
                    return hasDirectProps;
                };
                
                // Helper function to extract consent categories from cookie value
                const extractConsentCategories = (cookieValue, cookieName) => {
                    const categories = {
                        necessary: null,
                        functional: null,
                        analytics: null,
                        advertisement: null,
                        marketing: null,
                        performance: null,
                        preferences: null,
                        statistics: null,
                        hasGoogleConsentModeV2: false
                    };
                    
                    // Try to parse as JSON first
                    let parsed = null;
                    try {
                        parsed = JSON.parse(cookieValue);
                    } catch (e) {
                        try {
                            const decoded = decodeURIComponent(cookieValue);
                            parsed = JSON.parse(decoded);
                        } catch (e2) {
                            try {
                                const base64Decoded = atob(cookieValue);
                                parsed = JSON.parse(base64Decoded);
                            } catch (e3) {
                                // Try fixing unquoted keys
                                const objMatch = cookieValue.match(/\{.*\}/);
                                if (objMatch) {
                                    try {
                                        const fixedJson = objMatch[0].replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                                        parsed = JSON.parse(fixedJson);
                                    } catch (e4) {
                                        // Manual regex parsing
                                        const extractValue = (pattern) => {
                                            const match = cookieValue.match(new RegExp(pattern + '["\\s]*:["\\s]*"?(yes|no|true|false|1|0|accepted|granted|allow|deny)"?', 'i'));
                                            return match ? match[1].toLowerCase() : null;
                                        };
                                        
                                        parsed = {
                                            necessary: extractValue('necessary'),
                                            functional: extractValue('functional'),
                                            analytics: extractValue('analytics'),
                                            advertisement: extractValue('advertisement'),
                                            marketing: extractValue('marketing'),
                                            performance: extractValue('performance'),
                                            preferences: extractValue('preferences'),
                                            statistics: extractValue('statistics'),
                                            consent: extractValue('consent'),
                                            action: extractValue('action')
                                        };
                                    }
                                }
                            }
                        }
                    }
                    
                    if (parsed && typeof parsed === 'object') {
                        // Check for Google Consent Mode V2 properties first
                        categories.hasGoogleConsentModeV2 = hasGoogleConsentModeV2Properties(parsed);
                        
                        // If Google Consent Mode V2 properties exist, extract them
                        if (categories.hasGoogleConsentModeV2) {
                            if (parsed.googleconsentmap && typeof parsed.googleconsentmap === 'object') {
                                const gcm = parsed.googleconsentmap;
                                // Map Google Consent Mode properties to standard categories
                                categories.security_storage = gcm.security_storage; // Maps to necessary
                                categories.functionality_storage = gcm.functionality_storage; // Maps to functional
                                categories.analytics_storage = gcm.analytics_storage; // Maps to analytics/performance
                                categories.ad_storage = gcm.ad_storage; // Maps to advertisement
                                categories.ad_personalization = gcm.ad_personalization; // Maps to advertisement
                                categories.ad_user_data = gcm.ad_user_data; // Maps to advertisement
                                categories.personalization_storage = gcm.personalization_storage; // Maps to functional
                                console.log(`    Extracted Google Consent Mode map:`, {
                                    security_storage: categories.security_storage,
                                    functionality_storage: categories.functionality_storage,
                                    analytics_storage: categories.analytics_storage,
                                    ad_storage: categories.ad_storage
                                });
                            } else {
                                // Direct properties
                                categories.security_storage = parsed.security_storage;
                                categories.functionality_storage = parsed.functionality_storage;
                                categories.analytics_storage = parsed.analytics_storage;
                                categories.ad_storage = parsed.ad_storage;
                                categories.ad_personalization = parsed.ad_personalization;
                                categories.ad_user_data = parsed.ad_user_data;
                                categories.personalization_storage = parsed.personalization_storage;
                            }
                        }
                        
                        // Map common field names to standard categories (for non-Google Consent Mode cookies)
                        categories.necessary = parsed.necessary !== undefined ? parsed.necessary : 
                                               parsed.essential !== undefined ? parsed.essential : null;
                        categories.functional = parsed.functional !== undefined ? parsed.functional : null;
                        categories.analytics = parsed.analytics !== undefined ? parsed.analytics :
                                             parsed.statistics !== undefined ? parsed.statistics : null;
                        categories.advertisement = parsed.advertisement !== undefined ? parsed.advertisement :
                                                 parsed.advertising !== undefined ? parsed.advertising :
                                                 parsed.marketing !== undefined ? parsed.marketing : null;
                        categories.marketing = parsed.marketing !== undefined ? parsed.marketing :
                                              parsed.advertisement !== undefined ? parsed.advertisement : null;
                        categories.performance = parsed.performance !== undefined ? parsed.performance : null;
                        categories.preferences = parsed.preferences !== undefined ? parsed.preferences : null;
                        categories.statistics = parsed.statistics !== undefined ? parsed.statistics :
                                               parsed.analytics !== undefined ? parsed.analytics : null;
                    }
                    
                    return categories;
                };
                
                // Check ALL cookies for Google Consent Mode V2 properties FIRST (highest priority)
                // This doesn't require the cookie name to match consent patterns
                console.log(`Checking ${cookiesAfterAccept.length} cookies for Google Consent Mode V2 properties...`);
                for (const cookie of cookiesAfterAccept) {
                    const nameLower = cookie.name.toLowerCase();
                    console.log(`  Checking cookie: ${cookie.name} (value length: ${cookie.value.length})`);
                    
                    try {
                        const categories = extractConsentCategories(cookie.value, cookie.name);
                        console.log(`    Has Google Consent Mode V2: ${categories.hasGoogleConsentModeV2}`);
                        
                        // PRIORITY 1: Check for Google Consent Mode V2 properties (presence indicates Consent Mode V2)
                        if (categories.hasGoogleConsentModeV2) {
                            // If Google Consent Mode V2 properties exist, Consent Mode V2 is enabled
                            // The presence of these properties indicates Consent Mode V2 configuration
                            consentModeV2Detected = true;
                            consentModeV2Details = {
                                detectedFrom: 'google-consent-mode-properties',
                                cookieName: cookie.name,
                                allCategoriesGranted: true,
                                detectionMethod: 'google-consent-mode-properties',
                                googleConsentModeMap: categories.security_storage !== undefined ? {
                                    security_storage: categories.security_storage,
                                    functionality_storage: categories.functionality_storage,
                                    analytics_storage: categories.analytics_storage,
                                    ad_storage: categories.ad_storage,
                                    ad_personalization: categories.ad_personalization,
                                    ad_user_data: categories.ad_user_data,
                                    personalization_storage: categories.personalization_storage
                                } : null,
                                categories: {
                                    necessary: categories.security_storage !== undefined,
                                    functional: categories.functionality_storage !== undefined,
                                    analytics: categories.analytics_storage !== undefined,
                                    advertisement: categories.ad_storage !== undefined,
                                    performance: categories.analytics_storage !== undefined // analytics_storage covers performance
                                },
                                provider: null
                            };
                            console.log(`✅ Consent Mode V2 detected via Google Consent Mode properties in cookie: ${cookie.name}`);
                            console.log(`   Google Consent Mode Map:`, consentModeV2Details.googleConsentModeMap);
                            break; // Found definitive Consent Mode V2, stop checking
                        }
                    } catch (e) {
                        // Continue to other checks
                        console.warn(`    Error checking cookie ${cookie.name} for Google Consent Mode:`, e.message);
                    }
                }
                
                // If Consent Mode V2 already detected, skip remaining checks
                if (consentModeV2Detected) {
                    console.log('Consent Mode V2 detected via Google Consent Mode properties, skipping other detection methods');
                } else {
                    console.log('No Google Consent Mode V2 properties found, checking other consent patterns...');
                    
                    // Check ALL cookies for consent patterns (for other detection methods)
                    for (const cookie of cookiesAfterAccept) {
                        const nameLower = cookie.name.toLowerCase();
                        const valueLower = cookie.value.toLowerCase();
                        
                        // SECOND: Check if this cookie name matches any consent pattern
                        let matchedProvider = null;
                        for (const [provider, patterns] of Object.entries(consentCookiePatterns)) {
                            if (patterns.some(pattern => nameLower.includes(pattern))) {
                                matchedProvider = provider;
                                break;
                            }
                        }
                        
                        // Also check generic consent indicators in cookie name
                        const isGenericConsent = !matchedProvider && (
                            nameLower.includes('consent') || 
                            nameLower.includes('gdpr') || 
                            nameLower.includes('privacy') ||
                            (nameLower.includes('cookie') && (nameLower.includes('accept') || nameLower.includes('agree')))
                        );
                        
                        if (matchedProvider || isGenericConsent) {
                            try {
                                const categories = extractConsentCategories(cookie.value, cookie.name);
                                
                                // PRIORITY 2: Check for OneTrust specific format (base64 encoded consent string)
                            if (nameLower.includes('optanonconsent')) {
                                // OneTrust format: C0001:1 means category 1 (necessary) is granted
                                // C0002:1 = functional, C0003:1 = analytics, C0004:1 = advertising
                                const hasC0001 = cookie.value.includes('C0001:1');
                                const hasC0002 = cookie.value.includes('C0002:1');
                                const hasC0003 = cookie.value.includes('C0003:1');
                                const hasC0004 = cookie.value.includes('C0004:1');

                                if (hasC0001 && hasC0002 && hasC0003 && hasC0004) {
                                    consentModeV2Detected = true;
                                    consentModeV2Details = {
                                        detectedFrom: 'onetrust-optanonconsent',
                                        cookieName: cookie.name,
                                        allCategoriesGranted: true,
                                        detectionMethod: 'onetrust-category-flags',
                                        categories: {
                                            necessary: hasC0001,
                                            functional: hasC0002,
                                            analytics: hasC0003,
                                            advertisement: hasC0004,
                                            performance: true // OneTrust doesn't always have performance category
                                        }
                                    };
                                    break; // Found definitive consent, stop checking
                                }
                            }

                            // PRIORITY 2.5: Check for Shopify consent cookies
                            if (matchedProvider === 'shopify') {
                                // Shopify consent cookies use the cookie name to indicate category and status
                                // Examples: cookieConsentEssentialGranted=1, cookieConsentMarketingGranted=1, cookieConsentDeclined=0
                                const shopifyCategories = {
                                    necessary: false,
                                    functional: false,
                                    analytics: false,
                                    advertisement: false,
                                    marketing: false,
                                    personalization: false,
                                    preferences: false
                                };

                                // Check if this cookie indicates declined consent (overrides all)
                                const isDeclined = nameLower.includes('cookieconsentdeclined') && isConsentGranted(cookie.value);
                                if (isDeclined) {
                                    // All categories declined
                                    console.log(`    Shopify consent declined via cookie: ${cookie.name}`);
                                } else {
                                    // Check individual category grants
                                    if (nameLower.includes('cookieconsentessentialgranted') && isConsentGranted(cookie.value)) {
                                        shopifyCategories.necessary = true;
                                        shopifyCategories.functional = true; // Essential often includes functional
                                    }
                                    if (nameLower.includes('cookieconsentmarketinggranted') && isConsentGranted(cookie.value)) {
                                        shopifyCategories.advertisement = true;
                                        shopifyCategories.marketing = true;
                                    }
                                    if (nameLower.includes('cookieconsentpersonalizationgranted') || nameLower.includes('cookiconsentpersonalization')) {
                                        shopifyCategories.personalization = true;
                                        shopifyCategories.functional = true; // Personalization is functional
                                    }
                                    if (nameLower.includes('cookieconsentpreferencesgranted') && isConsentGranted(cookie.value)) {
                                        shopifyCategories.preferences = true;
                                    }
                                    if (nameLower.includes('cookieconsentuserdata') && isConsentGranted(cookie.value)) {
                                        shopifyCategories.analytics = true; // User data often relates to analytics
                                    }
                                }

                                // Count granted categories for Consent Mode V2 detection
                                const grantedCount = Object.values(shopifyCategories).filter(Boolean).length;
                                const totalCategories = Object.keys(shopifyCategories).length;

                                if (grantedCount >= 4) { // At least essential + 3 other categories
                                    consentModeV2Detected = true;
                                    consentModeV2Details = {
                                        detectedFrom: 'shopify-consent-cookies',
                                        cookieName: cookie.name,
                                        allCategoriesGranted: grantedCount === totalCategories,
                                        detectionMethod: 'shopify-category-cookies',
                                        categories: shopifyCategories,
                                        grantedCategories: grantedCount,
                                        totalCategories: totalCategories
                                    };
                                    console.log(`    Shopify consent detected: ${grantedCount}/${totalCategories} categories granted`);
                                    break; // Found definitive Shopify consent, stop checking
                                }
                            }
                            
                            // PRIORITY 3: Check if all Consent Mode V2 categories are granted (value-based check)
                            // Consent Mode V2 requires: necessary, functional, analytics, advertisement, performance
                            const hasNecessary = isConsentGranted(categories.necessary);
                            const hasFunctional = isConsentGranted(categories.functional);
                            const hasAnalytics = isConsentGranted(categories.analytics) || isConsentGranted(categories.statistics);
                            const hasAdvertisement = isConsentGranted(categories.advertisement) || isConsentGranted(categories.marketing);
                            const hasPerformance = isConsentGranted(categories.performance);
                            
                            // Also check for overall consent indicator
                            const overallConsent = isConsentGranted(cookie.value) || 
                                                  valueLower.includes('consent:yes') ||
                                                  valueLower.includes('consent:true') ||
                                                  valueLower.includes('consent:"yes"') ||
                                                  valueLower.includes('action:yes') ||
                                                  valueLower.includes('action:"yes"');
                            
                            // Check if all Consent Mode V2 categories are granted
                            if (hasNecessary && hasFunctional && hasAnalytics && hasAdvertisement && hasPerformance && overallConsent) {
                                consentModeV2Detected = true;
                                consentModeV2Details = {
                                    detectedFrom: matchedProvider || 'generic-consent-cookie',
                                    cookieName: cookie.name,
                                    allCategoriesGranted: true,
                                    detectionMethod: 'category-values-check',
                                    categories: {
                                        necessary: hasNecessary,
                                        functional: hasFunctional,
                                        analytics: hasAnalytics,
                                        advertisement: hasAdvertisement,
                                        performance: hasPerformance
                                    },
                                    provider: matchedProvider
                                };
                                console.log(`Consent Mode V2 detected from cookie values: ${cookie.name} (${matchedProvider || 'generic'})`);
                                break; // Found definitive consent, stop checking
                            } else if (overallConsent && (hasNecessary || hasFunctional || hasAnalytics || hasAdvertisement)) {
                                // Partial consent detected - store details but don't set as Consent Mode V2 yet
                                if (!consentModeV2Details) {
                                    consentModeV2Details = {
                                        detectedFrom: matchedProvider || 'generic-consent-cookie',
                                        cookieName: cookie.name,
                                        allCategoriesGranted: false,
                                        detectionMethod: 'partial-category-values',
                                        categories: {
                                            necessary: hasNecessary,
                                            functional: hasFunctional,
                                            analytics: hasAnalytics,
                                            advertisement: hasAdvertisement,
                                            performance: hasPerformance
                                        },
                                        provider: matchedProvider
                                    };
                                }
                            }
                        } catch (e) {
                            console.warn(`Error parsing consent cookie ${cookie.name}:`, e);
                        }
                    }
                }
                }
                
                // If we didn't find Consent Mode V2 but found consent cookies, check for alternative indicators
                if (!consentModeV2Detected && cookiesAfterAccept.length > 0) {
                    // Check for Google Consent Mode API indicators in cookies
                    for (const cookie of cookiesAfterAccept) {
                        const nameLower = cookie.name.toLowerCase();
                        // Google Consent Mode v2 uses specific cookie patterns
                        if (nameLower.includes('_gcl_') || nameLower.includes('_gac_') || nameLower.includes('_ga_')) {
                            // These cookies are set when Consent Mode is active
                            // Check if we have consent cookies alongside these
                            const hasConsentCookie = cookiesAfterAccept.some(c => {
                                const cName = c.name.toLowerCase();
                                return cName.includes('consent') || cName.includes('gdpr') || cName.includes('cookie');
                            });
                            
                            if (hasConsentCookie) {
                                consentModeV2Detected = true;
                                consentModeV2Details = {
                                    detectedFrom: 'google-consent-mode-indicators',
                                    cookieName: cookie.name,
                                    allCategoriesGranted: true,
                                    note: 'Detected via Google Consent Mode cookie patterns'
                                };
                                break;
                            }
                        }
                    }
                }

                // Check dataLayer for Consent Mode V2 events
                // This is a final check after cookie-based detection
                if (!consentModeV2Detected) {
                    try {
                        console.log('Checking dataLayer for Consent Mode V2 events...');
                        const dataLayerConsent = await this.page.evaluate(() => {
                            if (!window.dataLayer || !Array.isArray(window.dataLayer)) {
                                return null;
                            }

                            // Look for consent update events in dataLayer
                            for (const event of window.dataLayer) {
                                if (event && typeof event === 'object') {
                                    // Check for consent update events
                                    if (event.event === 'consent' && event.action === 'update') {
                                        console.log('Found consent update event in dataLayer:', event);
                                        return {
                                            type: 'consent_update',
                                            event: event.event,
                                            action: event.action,
                                            consent: event.consent || event[2], // consent object might be at index 2
                                            fullEvent: event
                                        };
                                    }

                                    // Check for gtag consent events (different format)
                                    if (event[0] === 'consent' && event[1] === 'update') {
                                        console.log('Found gtag consent update in dataLayer:', event);
                                        return {
                                            type: 'gtag_consent_update',
                                            consent: event[2], // consent object at index 2
                                            fullEvent: event
                                        };
                                    }

                                    // Check for direct consent mode events
                                    if (event.consent && typeof event.consent === 'object') {
                                        // Check if this contains Google Consent Mode properties
                                        const consentObj = event.consent;
                                        const hasGoogleConsentProps = consentObj.ad_storage !== undefined ||
                                                                     consentObj.analytics_storage !== undefined ||
                                                                     consentObj.functionality_storage !== undefined ||
                                                                     consentObj.security_storage !== undefined;

                                        if (hasGoogleConsentProps) {
                                            console.log('Found direct consent object in dataLayer:', consentObj);
                                            return {
                                                type: 'direct_consent_object',
                                                consent: consentObj,
                                                fullEvent: event
                                            };
                                        }
                                    }
                                }
                            }
                            return null;
                        });

                        if (dataLayerConsent) {
                            console.log('DataLayer consent detected:', dataLayerConsent);

                            // Extract consent categories from dataLayer
                            const consentObj = dataLayerConsent.consent;
                            if (consentObj && typeof consentObj === 'object') {
                                const dataLayerCategories = {
                                    ad_storage: consentObj.ad_storage,
                                    analytics_storage: consentObj.analytics_storage,
                                    functionality_storage: consentObj.functionality_storage,
                                    security_storage: consentObj.security_storage,
                                    personalization_storage: consentObj.personalization_storage,
                                    ad_user_data: consentObj.ad_user_data,
                                    ad_personalization: consentObj.ad_personalization
                                };

                                // Check if Google Consent Mode properties are present
                                const hasGoogleConsentMode = Object.values(dataLayerCategories).some(val => val !== undefined);

                                if (hasGoogleConsentMode) {
                                    consentModeV2Detected = true;
                                    consentModeV2Details = {
                                        detectedFrom: 'datalayer-consent-event',
                                        eventType: dataLayerConsent.type,
                                        allCategoriesGranted: true, // DataLayer events indicate active consent management
                                        detectionMethod: 'datalayer-consent-mode',
                                        categories: dataLayerCategories,
                                        dataLayerEvent: dataLayerConsent.fullEvent
                                    };
                                    console.log('✅ Consent Mode V2 detected via dataLayer event');
                                }
                            }
                        } else {
                            console.log('No consent events found in dataLayer');
                        }
                    } catch (dataLayerError) {
                        console.warn('Error checking dataLayer for consent:', dataLayerError.message);
                    }
                }

                // All cookies and dataLayer have been checked - the generic check above handles all CMPs
                
                const cmpName = result.cmp ? result.cmp.name : 'Text-based detection';
                const message = `Accepted cookies using ${result.method} detection${result.cmp ? ` (${result.cmp.name})` : ''}: "${result.element.text}"`;

                return {
                    success: true,
                    provider: cmpName,
                    message: message,
                    element: result.element,
                    method: result.method,
                    cmp: result.cmp,
                    cookies: {
                        ...result.cookies,
                        afterAccept: cookiesAfterAccept.length,
                        consentModeV2: consentModeV2Detected,
                        consentModeV2Details: consentModeV2Details
                    }
                };
            } else {
                console.log('Cookie acceptance detection found no accept buttons');
                const cmpName = result.cmp ? result.cmp.name : null;
                const message = cmpName
                    ? `Detected ${cmpName} CMP but no accept buttons found`
                    : 'No cookie accept buttons found using available detection methods';

                return {
                    success: false,
                    provider: cmpName,
                    message: message,
                    method: result.method || 'text-based',
                    cmp: result.cmp,
                    cookies: result.cookies
                };
            }

        } catch (error) {
            console.error('Error in cookie acceptance:', error);
            return {
                success: false,
                provider: null,
                message: `Error accepting cookies: ${error.message}`,
                method: 'text-based',
                cmp: null,
                cookies: { count: 0, keys: [], domains: 0 }
            };
        }
    }
}

/**
 * Execute the first 3 scanning steps
 * @param {string} url - URL to scan
 * @param {function} onProgress - Progress callback function
 */
export async function executeInitialScan(url, onProgress = () => {}) {
    console.log(`Starting initial scan for URL: ${url}`);

    const scanner = new WebsiteScanner();
    let requestListener = null;
    const results = {
        url,
        steps: [],
        pageInfo: null,
        success: false,
        error: null
    };

    try {
        // Step 1: Initialize Scanner
        console.log('Executing step 1: Initialize scanner');
        onProgress(1, 'Starting scanner initialization...');
        const initResult = await scanner.initialize();

        if (!initResult.success) {
            throw new Error(initResult.message);
        }

        results.steps.push({
            id: 1,
            status: 'completed',
            result: initResult
        });
        console.log('Step 1 completed successfully');
        // Send intermediate data
        if (typeof onProgress === 'function') {
            onProgress(1, 'Scanner initialized successfully', {
                scannerInitialized: true,
                platform: process.platform
            });
        }

        // Set up network monitoring for platform detection (before navigation)
        const networkRequests = [];
        requestListener = (request) => {
            const requestUrl = request.url();
                // Capture requests to known platform endpoints
                if (
                    requestUrl.includes('reaktion.com') ||
                    requestUrl.includes('profitmetrics.io') ||
                    requestUrl.includes('triplewhale.com') ||
                    requestUrl.includes('api.reaktion.com') ||
                    requestUrl.includes('tracking/stores/') ||
                    requestUrl.includes('/conversions')
                ) {
                    networkRequests.push({
                        url: requestUrl,
                        method: request.method(),
                        resourceType: request.resourceType(),
                        timestamp: Date.now()
                    });
                    console.log('📡 Captured platform network request:', requestUrl);
                }

                // Debug: Log all requests to see what's happening
                if (requestUrl.includes('reaktion') || requestUrl.includes('tracking') || requestUrl.includes('conversions')) {
                    console.log('🔍 DEBUG: Platform-related request detected:', {
                        url: requestUrl,
                        method: request.method(),
                        resourceType: request.resourceType()
                    });
                }
        };

        // Enable request interception before navigation
        try {
            await scanner.page.setRequestInterception(true);
            scanner.page.on('request', requestListener);
            console.log('✅ Network request interception enabled');

            // Also listen for responses to see what's happening
            scanner.page.on('response', (response) => {
                const url = response.url();
                if (url.includes('reaktion') || url.includes('tracking') || url.includes('conversions')) {
                    console.log('📡 Response received for platform URL:', url, response.status());
                }
            });

        } catch (interceptError) {
            console.warn('⚠️ Could not enable request interception:', interceptError.message);
        }

        // Step 2: Navigate to URL
        console.log('Executing step 2: Navigate to URL');
        onProgress(2, 'Navigating to target URL...');
        const navResult = await scanner.navigateToUrl(url);

        if (!navResult.success) {
            throw new Error(navResult.message);
        }

        results.steps.push({
            id: 2,
            status: 'completed',
            result: navResult
        });
        console.log('Step 2 completed successfully');
        // Send intermediate data
        if (typeof onProgress === 'function') {
            onProgress(2, 'Navigation completed', { 
                navigationSuccess: navResult.success,
                url: url 
            });
        }

        // Step 3: Wait for Page Load
        console.log('Executing step 3: Wait for page load');
        onProgress(3, 'Waiting for page to fully load...');
        const loadResult = await scanner.waitForPageLoad();

        if (!loadResult.success) {
            throw new Error(loadResult.message);
        }

        results.steps.push({
            id: 3,
            status: 'completed',
            result: loadResult
        });
        console.log('Step 3 completed successfully');
        // Send intermediate data
        if (typeof onProgress === 'function') {
            onProgress(3, 'Page load completed', {
                pageLoadSuccess: loadResult.success
            });
        }

        // Step 3.5: Capture dataLayer
        console.log('Executing step 3.5: Capture dataLayer');
        onProgress(3, 'Capturing dataLayer...');
        try {
            const dataLayerSnapshot = await scanner.page.evaluate(() => {
                try {
                    // Capture dataLayer if it exists
                    if (window.dataLayer && Array.isArray(window.dataLayer)) {
                        // Deep clone to avoid any circular references
                        return JSON.parse(JSON.stringify(window.dataLayer));
                    }
                    return null;
                } catch (error) {
                    console.warn('Error capturing dataLayer:', error.message);
                    return null;
                }
            });

            results.dataLayer = dataLayerSnapshot;
            console.log('✅ DataLayer captured:', dataLayerSnapshot ? `${dataLayerSnapshot.length} events` : 'Not found');
        } catch (error) {
            console.warn('Failed to capture dataLayer:', error.message);
            results.dataLayer = null;
        }

        // Step 4: Accept Cookies
        console.log('Executing step 4: Accept cookies');
        onProgress(4, 'Accepting cookies...');
        const cookieResult = await scanner.acceptCookies();

        results.steps.push({
            id: 4,
            status: 'completed',
            result: cookieResult
        });
        console.log('Step 4 completed:', cookieResult.success ? 'Cookies accepted' : 'No cookies to accept');

        // Store cookie information in results
        results.cookieInfo = {
            detected: cookieResult.success,
            provider: cookieResult.provider || null,
            accepted: cookieResult.success,
            message: cookieResult.message,
            method: cookieResult.method || 'unknown',
            cmp: cookieResult.cmp || null,
            element: cookieResult.element || null,
            cookies: cookieResult.cookies || null
        };
        
        // Set Consent Mode V2 from cookie analysis if detected
        if (cookieResult.cookies?.consentModeV2 !== undefined) {
            results.consentModeV2 = cookieResult.cookies.consentModeV2;
            console.log('Consent Mode V2 detected from cookies:', cookieResult.cookies.consentModeV2);
            if (cookieResult.cookies.consentModeV2Details) {
                console.log('Consent Mode V2 details:', cookieResult.cookies.consentModeV2Details);
            }
        }

        // Get page info (after potential cookie acceptance)
        console.log('Getting page information...');
        const pageInfo = await scanner.getPageInfo();
        if (pageInfo.success) {
            results.pageInfo = pageInfo.data;
            console.log('Page info retrieved:', results.pageInfo);
            // Send intermediate data for step 4 (cookies) and also update pageInfo for steps 2-3
            if (typeof onProgress === 'function') {
                onProgress(4, 'Cookies accepted', { 
                    pageInfo: results.pageInfo, 
                    cookieInfo: results.cookieInfo,
                    pageLoadSuccess: true // Page info retrieved means page loaded successfully
                });
            }
        } else {
            console.warn('Failed to get page info:', pageInfo.message);
        }

        // Step 5: Fetch PageSpeed Insights
        console.log('Executing step 5: Fetch PageSpeed Insights');
        onProgress(5, 'Analyzing performance metrics...');
        try {
            const { fetchPageSpeedInsights } = await import('@/lib/pagespeed');
            const pageSpeedResult = await fetchPageSpeedInsights(url);
            if (pageSpeedResult.success) {
                results.performance = pageSpeedResult.data;
                console.log('PageSpeed Insights retrieved:', results.performance);
                // Send intermediate data
                if (typeof onProgress === 'function') {
                    onProgress(5, 'Performance metrics retrieved', { performance: results.performance });
                }
            } else {
                console.warn('Failed to get PageSpeed Insights:', pageSpeedResult.message);
            }
        } catch (error) {
            console.error('PageSpeed Insights error:', error);
            // Continue without performance data
        }

        results.steps.push({
            id: 5,
            status: 'completed',
            result: { success: true, message: 'Performance metrics retrieved' }
        });

        // Step 6: Scan for GTM Containers
        console.log('Executing step 6: Scan for GTM containers');
        onProgress(6, 'Scanning for Google Tag Manager containers...');
        try {
            // Get HTML content explicitly for GTM scanning
            console.log('Getting HTML content for GTM scan...');
            const htmlResult = await scanner.getPageHTML();
            const htmlContent = htmlResult.success ? htmlResult.data : (results.pageInfo?.html || '');
            console.log('HTML content length for GTM scan:', htmlContent.length);
            console.log('HTML content preview (first 500 chars):', htmlContent.substring(0, 500));

            // Create fetchScript function for third-party script fetching using Puppeteer
            const fetchScript = async (scriptUrl) => {
                if (!scanner.page) {
                    throw new Error('No page available for fetching scripts');
                }
                // Use page.evaluate to fetch script without navigating away
                const content = await scanner.page.evaluate(async (url) => {
                    try {
                        const response = await fetch(url, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            }
                        });
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return await response.text();
                    } catch (error) {
                        throw new Error(`Failed to fetch: ${error.message}`);
                    }
                }, scriptUrl);
                return content;
            };

            console.log('Importing GTM scanner module...');
            const { scanForGTM } = await import('@/lib/gtm-scanner');
            console.log('GTM scanner module imported successfully');
            
            // Create pageEvaluate function for browser context checks
            const pageEvaluate = async (fn) => {
                if (!scanner.page) {
                    throw new Error('No page available for browser context checks');
                }
                return await scanner.page.evaluate(fn);
            };
            
            console.log('Starting GTM scan with:');
            console.log('  - HTML length:', htmlContent.length);
            console.log('  - URL:', url);
            console.log('  - fetchScript function:', typeof fetchScript);
            console.log('  - pageEvaluate function:', typeof pageEvaluate);
            
            const gtmResult = await scanForGTM(htmlContent, url, fetchScript, pageEvaluate);
            console.log('GTM scan result:', JSON.stringify(gtmResult, null, 2));

            results.gtmInfo = {
                found: gtmResult.found,
                containers: gtmResult.containers,
                count: gtmResult.count
            };

            if (gtmResult.found) {
                console.log(`✅ GTM containers found: ${gtmResult.containers.join(', ')}`);
                // Send intermediate data
                if (typeof onProgress === 'function') {
                    onProgress(6, 'GTM containers found', { gtmInfo: results.gtmInfo });
                }
            } else {
                console.log('❌ No GTM containers found');
                console.log('Debug: Checking HTML for GTM patterns...');
                // Quick debug check
                const hasGTM = htmlContent.includes('googletagmanager') || htmlContent.includes('GTM-');
                console.log('  - Contains "googletagmanager":', htmlContent.includes('googletagmanager'));
                console.log('  - Contains "GTM-":', htmlContent.includes('GTM-'));
                console.log('  - Contains "stapecdn":', htmlContent.includes('stapecdn'));
                console.log('  - Contains "shop_id":', htmlContent.includes('shop_id'));
            }
        } catch (error) {
            console.error('GTM scanning error:', error);
            results.gtmInfo = {
                found: false,
                containers: [],
                count: 0
            };
        }

        results.steps.push({
            id: 6,
            status: 'completed',
            result: { success: true, message: 'GTM scanning completed' }
        });

        // Step 7: Fetch Tagstack Analysis
        console.log('Executing step 7: Fetch Tagstack analysis');
        onProgress(7, 'Analyzing GTM container with Tagstack...');
        try {
            if (results.gtmInfo?.found && results.gtmInfo.containers.length > 0) {
                const { fetchTagstackData, processTagstackData } = await import('@/lib/tagstack');
                
                // Fetch Tagstack data for each GTM container
                const tagstackPromises = results.gtmInfo.containers.map(containerId => 
                    fetchTagstackData(containerId)
                );
                
                const tagstackResults = await Promise.all(tagstackPromises);
                
                // Process successful results
                const successfulResults = tagstackResults
                    .filter(r => r.success)
                    .map(r => r.data);
                
                if (successfulResults.length > 0) {
                    // Process and merge Tagstack data
                    const processedData = processTagstackData({
                        containers: Object.assign({}, ...successfulResults.map(r => r.containers))
                    });
                    
                    // Store processed data (optimized - don't include full raw response to reduce size)
                    // Only keep essential data, exclude detailed tags/variables/triggers arrays
                    results.tagstackInfo = {
                        gtmContainers: processedData.gtmContainers.map(c => ({
                            id: c.id,
                            entityType: c.entityType,
                            cmp: c.cmp,
                            consentMode: c.consentMode,
                            consentDefault: c.consentDefault,
                            ga4ServerSide: c.ga4ServerSide // Keep server-side tracking indicator
                            // Exclude: tags, variables, triggers arrays (too large)
                        })),
                        serverSideTracking: processedData.serverSideTracking,
                        ga4Streams: processedData.ga4Streams.map(s => ({
                            id: s.id,
                            entityType: s.entityType,
                            enhancedMeasurement: s.enhancedMeasurement?.map(em => ({
                                name: em.name,
                                type: em.type
                            })),
                            linking: s.linking?.map(l => ({
                                name: l.name,
                                type: l.type
                            }))
                        })),
                        consentModeV2: processedData.consentModeV2,
                        cmp: processedData.cmp,
                        consentDefaults: processedData.consentDefaults,
                        serverSideTracking: processedData.serverSideTracking,
                        detectedIds: processedData.detectedIds,
                        containerStats: processedData.containerStats,
                        tags: processedData.tags // Keep tags for Facebook/Meta detection
                        // Exclude: variables, triggers arrays (available via containerStats counts)
                    };
                    
                    // Update server-side tracking status from Tagstack
                    if (processedData.serverSideTracking) {
                        results.serverSideTracking = true;
                        console.log('✅ Server-side tracking detected via Tagstack');
                        console.log('   Server-side tracking details:', {
                            fromTagstack: processedData.serverSideTracking,
                            gtmContainers: processedData.gtmContainers.filter(c => c.ga4ServerSide).map(c => ({
                                id: c.id,
                                ga4ServerSide: c.ga4ServerSide
                            })),
                            ga4Streams: processedData.ga4Streams.filter(s => s.ga4ServerSide).map(s => ({
                                id: s.id,
                                ga4ServerSide: s.ga4ServerSide
                            }))
                        });
                    } else {
                        console.log('❌ Server-side tracking NOT detected in Tagstack data');
                        console.log('   Debug info:', {
                            gtmContainersCount: processedData.gtmContainers.length,
                            ga4StreamsCount: processedData.ga4Streams.length,
                            gtmContainers: processedData.gtmContainers.map(c => ({
                                id: c.id,
                                ga4ServerSide: c.ga4ServerSide,
                                serverContainerUrl: c.serverContainerUrl,
                                serverContainerName: c.serverContainerName
                            })),
                            ga4Streams: processedData.ga4Streams.map(s => ({
                                id: s.id,
                                ga4ServerSide: s.ga4ServerSide,
                                measurementProtocolSecret: !!s.measurementProtocolSecret,
                                serverContainerUrl: s.serverContainerUrl
                            }))
                        });
                    }
                    
                    // Update Consent Mode V2 status from Tagstack (only if not already set from cookies)
                    // Cookie-based detection takes precedence as it's more reliable
                    if (results.tagstackInfo.consentModeV2 !== undefined && results.consentModeV2 === undefined) {
                        results.consentModeV2 = results.tagstackInfo.consentModeV2;
                    }
                    
                    // Update CMP detection if available
                    if (results.tagstackInfo.cmp !== null && results.tagstackInfo.cmp !== undefined) {
                        if (results.cookieInfo) {
                            results.cookieInfo.tagstackCmp = results.tagstackInfo.cmp;
                        }
                    }
                    
                    console.log('Tagstack analysis completed:', {
                        gtmContainers: results.tagstackInfo.gtmContainers.length,
                        serverSideTracking: results.tagstackInfo.serverSideTracking,
                        ga4Streams: results.tagstackInfo.ga4Streams.length,
                        consentModeV2: results.tagstackInfo.consentModeV2,
                        detectedIds: results.tagstackInfo.detectedIds
                    });
                } else {
                    console.warn('No successful Tagstack results');
                    results.tagstackInfo = null;
                }
            } else {
                console.log('No GTM containers found, skipping Tagstack analysis');
                results.tagstackInfo = null;
            }
        } catch (error) {
            console.error('Tagstack analysis error:', error);
            results.tagstackInfo = null;
        }

        results.steps.push({
            id: 7,
            status: 'completed',
            result: { success: true, message: 'Tagstack analysis completed' }
        });

        // Step 8: Scan for Marketing Pixels
        console.log('Executing step 8: Scan for marketing pixels and platforms');
        onProgress(8, 'Scanning for Meta Pixel, TikTok, LinkedIn, Google Ads, and platforms...');
        try {
            // Get HTML content for pixel scanning
            const htmlResult = await scanner.getPageHTML();
            const htmlContent = htmlResult.success ? htmlResult.data : (results.pageInfo?.html || '');

            // Give more time for requests to be captured after page load
            console.log('⏳ Waiting for network requests to be captured...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log(`📊 Total network requests captured so far: ${networkRequests.length}`);

            // Create pageEvaluate function for network monitoring
            const pageEvaluate = async (fn) => {
                if (!scanner.page) {
                    throw new Error('No page available for pixel detection');
                }
                return await scanner.page.evaluate(fn);
            };

            console.log('Importing pixel scanner module...');
            const { scanForPixels } = await import('@/lib/pixel-scanner');
            console.log('Pixel scanner module imported successfully');

            console.log(`Passing ${networkRequests.length} captured network requests to pixel scanner`);
            const pixelResult = await scanForPixels(htmlContent, url, pageEvaluate, networkRequests);
            console.log('Pixel scan result:', JSON.stringify(pixelResult, null, 2));

            // Store pixel detection results
            results.pixelInfo = pixelResult;

            // Merge with Tagstack data if available (combine both sources)
            if (results.tagstackInfo?.detectedIds) {
                const tagstackIds = results.tagstackInfo.detectedIds;
                
                // Meta Pixel: Combine Tagstack and direct detection
                if (tagstackIds.facebookPixel && tagstackIds.facebookPixel.length > 0) {
                    tagstackIds.facebookPixel.forEach(id => {
                        if (!results.pixelInfo.meta.pixelIds.includes(id)) {
                            results.pixelInfo.meta.pixelIds.push(id);
                        }
                    });
                    results.pixelInfo.meta.found = true;
                    results.pixelInfo.meta.methods.push('tagstack-detection');
                    // Use Tagstack ID as primary if available and no direct detection
                    if (!results.pixelInfo.meta.pixelId) {
                        results.pixelInfo.meta.pixelId = tagstackIds.facebookPixel[0];
                    }
                }
                
                // Check for Facebook/Meta tags in GTM even if no pixel ID found (custom templates)
                if (!results.pixelInfo.meta.found && results.tagstackInfo?.tags) {
                    const facebookTags = results.tagstackInfo.tags.filter(tag => {
                        const name = (tag.name || '').toLowerCase();
                        const type = (tag.type || '').toLowerCase();
                        const templateId = (tag.templateId || '').toLowerCase();
                        return name.includes('facebook') || 
                               name.includes('meta') || 
                               type.includes('facebook') ||
                               type.includes('meta') ||
                               templateId.includes('facebook') ||
                               templateId.includes('meta') ||
                               (tag.parameters && tag.parameters.some(p => 
                                   (p.key || '').toLowerCase().includes('facebook') ||
                                   (p.key || '').toLowerCase().includes('meta') ||
                                   (p.parameterValue || '').toString().includes('connect.facebook.net')
                               ));
                    });
                    
                    if (facebookTags.length > 0) {
                        results.pixelInfo.meta.found = true;
                        results.pixelInfo.meta.methods.push('gtm-tag-detection');
                        // Mark that pixel is detected but ID not found
                        results.pixelInfo.meta.pixelId = null;
                        results.pixelInfo.meta.detectedViaGTM = true;
                        results.pixelInfo.meta.gtmTagNames = facebookTags.map(t => t.name || t.type || 'Unknown').filter((v, i, a) => a.indexOf(v) === i);
                        console.log(`✅ Meta Pixel detected via GTM tags (no pixel ID found): ${facebookTags.length} tag(s) found`);
                    }
                }

                // TikTok Pixel: Combine Tagstack and direct detection
                if (tagstackIds.tiktokPixel && tagstackIds.tiktokPixel.length > 0) {
                    tagstackIds.tiktokPixel.forEach(id => {
                        if (!results.pixelInfo.tiktok.pixelIds.includes(id)) {
                            results.pixelInfo.tiktok.pixelIds.push(id);
                        }
                    });
                    results.pixelInfo.tiktok.found = true;
                    results.pixelInfo.tiktok.methods.push('tagstack-detection');
                    // Use Tagstack ID as primary if available and no direct detection
                    if (!results.pixelInfo.tiktok.pixelId) {
                        results.pixelInfo.tiktok.pixelId = tagstackIds.tiktokPixel[0];
                    }
                }

                // LinkedIn Pixel: Combine Tagstack and direct detection
                if (tagstackIds.linkedinPixel && tagstackIds.linkedinPixel.length > 0) {
                    tagstackIds.linkedinPixel.forEach(id => {
                        if (!results.pixelInfo.linkedin.pixelIds.includes(id)) {
                            results.pixelInfo.linkedin.pixelIds.push(id);
                        }
                    });
                    results.pixelInfo.linkedin.found = true;
                    results.pixelInfo.linkedin.methods.push('tagstack-detection');
                    // Use Tagstack ID as primary if available and no direct detection
                    if (!results.pixelInfo.linkedin.pixelId) {
                        results.pixelInfo.linkedin.pixelId = tagstackIds.linkedinPixel[0];
                    }
                }

                // Google Ads: Combine Tagstack and direct detection
                if (tagstackIds.googleAds && tagstackIds.googleAds.length > 0) {
                    tagstackIds.googleAds.forEach(id => {
                        if (!results.pixelInfo.googleAds.conversionIds.includes(id)) {
                            results.pixelInfo.googleAds.conversionIds.push(id);
                        }
                    });
                    results.pixelInfo.googleAds.found = true;
                    results.pixelInfo.googleAds.methods.push('tagstack-detection');
                    // Use Tagstack ID as primary if available and no direct detection
                    if (!results.pixelInfo.googleAds.conversionId) {
                        results.pixelInfo.googleAds.conversionId = tagstackIds.googleAds[0];
                    }
                }
            }

            console.log('✅ Pixel scanning completed:', {
                meta: results.pixelInfo.meta.found ? results.pixelInfo.meta.pixelIds : 'Not found',
                tiktok: results.pixelInfo.tiktok.found ? results.pixelInfo.tiktok.pixelIds : 'Not found',
                linkedin: results.pixelInfo.linkedin.found ? results.pixelInfo.linkedin.pixelIds : 'Not found',
                googleAds: results.pixelInfo.googleAds.found ? results.pixelInfo.googleAds.conversionIds : 'Not found'
            });
            // Send intermediate data
            if (typeof onProgress === 'function') {
                onProgress(8, 'Pixel scanning completed', { pixelInfo: results.pixelInfo });
            }
        } catch (error) {
            console.error('Pixel scanning error:', error);
            results.pixelInfo = {
                meta: { found: false, pixelIds: [], pixelId: null, methods: [] },
                tiktok: { found: false, pixelIds: [], pixelId: null, methods: [] },
                linkedin: { found: false, pixelIds: [], pixelId: null, methods: [] },
                googleAds: { found: false, conversionIds: [], conversionId: null, methods: [] }
            };
        }

        // Check for platform-based server-side tracking
        if (results.pixelInfo?.platforms) {
            const platforms = results.pixelInfo.platforms;
            const detectedPlatforms = [];

            if (platforms.reaktion.found) detectedPlatforms.push('Reaktion');
            if (platforms.profitmetrics.found) detectedPlatforms.push('Profitmetrics');
            if (platforms.triplewhale.found) detectedPlatforms.push('Triplewhale');


            if (detectedPlatforms.length > 0) {
                results.serverSideTracking = true;
                results.serverSideTrackingPlatform = detectedPlatforms[0]; // Primary platform
                results.serverSideTrackingPlatforms = detectedPlatforms; // All detected platforms
                console.log('✅ Server-side tracking detected via platform detection:', detectedPlatforms);
                console.log('   Setting serverSideTrackingPlatform to:', results.serverSideTrackingPlatform);
            }
        }

        results.steps.push({
            id: 8,
            status: 'completed',
            result: { success: true, message: 'Pixel scanning completed' }
        });

        // Step 9: Scan for JSON-LD Structured Data
        console.log('Executing step 9: Scan for JSON-LD structured data');
        onProgress(9, 'Scanning for JSON-LD structured data...');
        try {
            const jsonLdResult = await scanner.scanJsonLd();
            if (jsonLdResult.success) {
                results.jsonLdInfo = jsonLdResult.data;
                console.log('✅ JSON-LD scanning completed:', {
                    found: jsonLdResult.data.found,
                    schemas: jsonLdResult.data.schemas.length,
                    types: jsonLdResult.data.types.length,
                    errors: jsonLdResult.data.errors.length
                });
                // Send intermediate data
                if (typeof onProgress === 'function') {
                    onProgress(9, 'JSON-LD scanning completed', { jsonLdInfo: results.jsonLdInfo });
                }
            } else {
                console.warn('Failed to scan JSON-LD:', jsonLdResult.message);
                results.jsonLdInfo = {
                    found: false,
                    scripts: [],
                    schemas: [],
                    types: [],
                    errors: []
                };
            }
        } catch (error) {
            console.error('JSON-LD scanning error:', error);
            results.jsonLdInfo = {
                found: false,
                scripts: [],
                schemas: [],
                types: [],
                errors: []
            };
        }

        results.steps.push({
            id: 9,
            status: 'completed',
            result: { success: true, message: 'JSON-LD scanning completed' }
        });

        results.success = true;
        console.log('Initial scan completed successfully');

    } catch (error) {
        console.error('Initial scan failed:', error);
        results.error = error.message;
        results.success = false;
    } finally {
        // Cleanup
        console.log('Cleaning up scanner...');

        // Clean up network monitoring
        try {
            if (scanner.page && requestListener) {
                scanner.page.off('request', requestListener);
                await scanner.page.setRequestInterception(false);
                console.log('Network request interception cleaned up');
            }
        } catch (cleanupError) {
            console.warn('Could not clean up network monitoring:', cleanupError.message);
        }

        await scanner.cleanup();
        console.log('Scanner cleanup completed');
    }

    console.log('Returning scan results:', results);
    return results;
}

export default WebsiteScanner;