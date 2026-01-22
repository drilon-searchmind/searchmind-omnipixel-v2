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

        // Get page info
        console.log('Getting page information...');
        const pageInfo = await scanner.getPageInfo();
        if (pageInfo.success) {
            results.pageInfo = pageInfo.data;
            console.log('Page info retrieved:', results.pageInfo);
        } else {
            console.warn('Failed to get page info:', pageInfo.message);
        }

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