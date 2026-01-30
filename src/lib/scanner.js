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
            // Navigate to URL with timeout
            const response = await this.page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            if (!response) {
                throw new Error('Navigation failed - no response received');
            }

            if (!response.ok()) {
                throw new Error(`Navigation failed with status ${response.status()}`);
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

            // Wait for the body element to be available
            await this.page.waitForSelector('body', { timeout: 10000 });

            // Wait for network to be mostly idle (no new requests for 500ms)
            await this.page.waitForFunction(
                () => {
                    return document.readyState === 'complete';
                },
                { timeout: 30000 }
            );

            // Additional wait for dynamic content to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            return { success: true, message: 'Page fully loaded' };
        } catch (error) {
            return { success: false, message: `Failed to wait for page load: ${error.message}` };
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
                    'i accept', 'i agree', 'ok', 'okay', 'yes', 'agree', 'consent',
                    // Danish (for pompdelux.dk)
                    'tillad alle', 'tillad', 'accepter alle', 'accepter', 'ok', 'ja',
                    'jeg accepterer', 'jeg accepterer alle',
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

                    // CookieYes
                    cookieyes: () => {
                        const cyElements = document.querySelectorAll('[class*="cookieyes"], [id*="cookieyes"]');
                        const cyScripts = Array.from(document.querySelectorAll('script')).filter(s =>
                            s.src && s.src.includes('cookieyes')
                        );
                        if (cyElements.length > 0 || cyScripts.length > 0) {
                            return {
                                name: 'CookieYes',
                                confidence: 'high',
                                elements: cyElements.length,
                                scripts: cyScripts.length
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

                // Get cookie information
                const cookies = document.cookie ? document.cookie.split(';').length : 0;
                const cookieKeys = document.cookie ? document.cookie.split(';').map(c => c.split('=')[0].trim()) : [];
                const cookieDomains = document.cookie ? [...new Set(document.cookie.split(';').map(c => {
                    const parts = c.split('=');
                    return parts.length > 1 ? parts[0].trim() : '';
                }).filter(c => c))].length : 0;

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
                        ] : []
                    ].flat() : []),

                    // Generic selectors
                    'button[class*="accept"]',
                    'button[class*="agree"]',
                    'button[class*="consent"]',
                    'a[class*="accept"]',
                    'a[class*="agree"]',
                    'button[id*="accept"]',
                    'button[id*="agree"]',
                    'a[id*="accept"]',
                    'a[id*="agree"]',

                    // General
                    'button',
                    'a',

                    // Fallback selectors
                    '[class*="cookie"] button',
                    '[id*="cookie"] button',
                    '[class*="consent"] button',
                    '[id*="consent"] button'
                ].flat();

                // Try each selector
                for (const selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                            const text = element.textContent.trim();
                            // Check if text matches any accept pattern
                            const matchesPattern = acceptPatterns.some(pattern =>
                                new RegExp(pattern, "i").test(text)
                            );

                            if (matchesPattern) {
                                // Check if element is visible and clickable
                                const style = window.getComputedStyle(element);
                                const isVisible = style.display !== 'none' &&
                                                style.visibility !== 'hidden' &&
                                                style.opacity !== '0' &&
                                                element.offsetParent !== null;

                                if (isVisible) {
                                    console.log('Found accept button:', selector, text);
                                    element.click();
                                    return {
                                        success: true,
                                        element: {
                                            tagName: element.tagName,
                                            id: element.id,
                                            className: element.className,
                                            text: text.substring(0, 50)
                                        },
                                        selector: selector,
                                        method: detectedCMP ? 'cmp-specific' : 'text-based',
                                        cmp: detectedCMP,
                                        cookies: {
                                            count: cookies,
                                            keys: cookieKeys.slice(0, 10), // Limit to first 10 for privacy
                                            domains: cookieDomains
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
                        domains: cookieDomains
                    }
                };
            });

            if (result.success) {
                console.log('Successfully accepted cookies');
                const cmpName = result.cmp ? result.cmp.name : 'Text-based detection';
                const message = `Accepted cookies using ${result.method} detection${result.cmp ? ` (${result.cmp.name})` : ''}: "${result.element.text}"`;

                return {
                    success: true,
                    provider: cmpName,
                    message: message,
                    element: result.element,
                    method: result.method,
                    cmp: result.cmp,
                    cookies: result.cookies
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

        // Get page info (after potential cookie acceptance)
        console.log('Getting page information...');
        const pageInfo = await scanner.getPageInfo();
        if (pageInfo.success) {
            results.pageInfo = pageInfo.data;
            console.log('Page info retrieved:', results.pageInfo);
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
            
            console.log('Starting GTM scan with:');
            console.log('  - HTML length:', htmlContent.length);
            console.log('  - URL:', url);
            console.log('  - fetchScript function:', typeof fetchScript);
            
            const gtmResult = await scanForGTM(htmlContent, url, fetchScript);
            console.log('GTM scan result:', JSON.stringify(gtmResult, null, 2));

            // REMOVED: checkGTMInBrowser() method doesn't exist
            // Will add it back later if needed

            results.gtmInfo = {
                found: gtmResult.found,
                containers: gtmResult.containers,
                count: gtmResult.count
            };

            if (gtmResult.found) {
                console.log(`✅ GTM containers found: ${gtmResult.containers.join(', ')}`);
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
                            consentDefault: c.consentDefault
                            // Exclude: tags, variables, triggers arrays (too large)
                        })),
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
                        detectedIds: processedData.detectedIds,
                        containerStats: processedData.containerStats
                        // Exclude: tags, variables, triggers arrays (available via containerStats counts)
                    };
                    
                    // Update Consent Mode V2 status from Tagstack
                    if (results.tagstackInfo.consentModeV2 !== undefined) {
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

        results.success = true;
        console.log('Initial scan completed successfully');

    } catch (error) {
        console.error('Initial scan failed:', error);
        results.error = error.message;
        results.success = false;
    } finally {
        // Cleanup
        console.log('Cleaning up scanner...');
        await scanner.cleanup();
        console.log('Scanner cleanup completed');
    }

    console.log('Returning scan results:', results);
    return results;
}

export default WebsiteScanner;