/**
 * Test script to verify Reaktion detection on http://billigeautoruder.dk/
 * This script will:
 * 1. Visit the site
 * 2. Monitor network requests
 * 3. Run the pixel scanner
 * 4. Check if Reaktion is detected
 */

const puppeteer = require('puppeteer');
const { scanForPixels } = require('../src/lib/pixel-scanner');

async function testReaktionDetection() {
    console.log('🧪 Testing Reaktion detection on http://billigeautoruder.dk/');
    console.log('=' .repeat(60));

    let browser;
    let page;

    try {
        // Launch browser
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Set to true for headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });

        page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Monitor network requests
        const networkRequests = [];
        page.on('request', (request) => {
            const url = request.url();
            if (url.includes('reaktion.com') ||
                url.includes('profitmetrics.io') ||
                url.includes('triplewhale.com') ||
                url.includes('api.reaktion.com') ||
                url.includes('tracking/stores/') ||
                url.includes('/conversions')) {
                networkRequests.push({
                    url: url,
                    method: request.method(),
                    resourceType: request.resourceType(),
                    timestamp: Date.now()
                });
                console.log(`📡 Network request: ${request.method()} ${url}`);
            }
        });

        // Navigate to the test site
        console.log('🌐 Navigating to http://billigeautoruder.dk/...');
        await page.goto('http://billigeautoruder.dk/', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit for any additional requests
        console.log('⏳ Waiting for additional requests...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get page HTML
        console.log('📄 Getting page HTML...');
        const htmlContent = await page.content();

        // Create pageEvaluate function
        const pageEvaluate = async (fn) => {
            return await page.evaluate(fn);
        };

        // Run pixel scanner
        console.log('🔍 Running pixel scanner...');
        const results = await scanForPixels(htmlContent, 'http://billigeautoruder.dk/', pageEvaluate, networkRequests);

        // Analyze results
        console.log('\n📊 RESULTS:');
        console.log('=' .repeat(40));

        console.log(`Reaktion detected: ${results.platforms.reaktion.found}`);
        if (results.platforms.reaktion.found) {
            console.log(`Detection methods: ${results.platforms.reaktion.methods.join(', ')}`);
        }

        console.log(`Profitmetrics detected: ${results.platforms.profitmetrics.found}`);
        console.log(`Triplewhale detected: ${results.platforms.triplewhale.found}`);

        console.log('\n📡 CAPTURED NETWORK REQUESTS:');
        console.log('=' .repeat(40));
        if (networkRequests.length === 0) {
            console.log('❌ No platform-related network requests captured');
        } else {
            networkRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.method} ${req.url}`);
            });
        }

        console.log('\n🔍 HTML ANALYSIS:');
        console.log('=' .repeat(40));
        const reaktionPatterns = [
            /app\.reaktion\.com/i,
            /reaktion\.com\/scripts/i,
            /reaktion\.com\/assets/i,
            /reaktion.*analytics/i,
            /window\.reaktion/i,
            /reaktion.*tracking/i,
            /reaktion.*store/i
        ];

        console.log('Checking for Reaktion patterns in HTML:');
        let foundPatterns = [];
        reaktionPatterns.forEach((pattern, index) => {
            if (pattern.test(htmlContent)) {
                foundPatterns.push(`Pattern ${index + 1}: ${pattern}`);
            }
        });

        if (foundPatterns.length > 0) {
            console.log('✅ Found Reaktion patterns:');
            foundPatterns.forEach(pattern => console.log(`  ${pattern}`));
        } else {
            console.log('❌ No Reaktion patterns found in HTML');
        }

        // Check for dataLayer
        console.log('\n🗃️ DATALAYER CHECK:');
        console.log('=' .repeat(40));
        const dataLayer = await page.evaluate(() => {
            try {
                if (window.dataLayer && Array.isArray(window.dataLayer)) {
                    return window.dataLayer.length;
                }
                return 0;
            } catch (error) {
                return -1;
            }
        });

        if (dataLayer > 0) {
            console.log(`✅ dataLayer found with ${dataLayer} events`);
        } else if (dataLayer === 0) {
            console.log('❌ dataLayer is empty');
        } else {
            console.log('❌ dataLayer not found or error accessing it');
        }

        // Summary
        console.log('\n📋 SUMMARY:');
        console.log('=' .repeat(40));
        console.log(`Network requests captured: ${networkRequests.length}`);
        console.log(`HTML patterns found: ${foundPatterns.length}`);
        console.log(`Reaktion detected: ${results.platforms.reaktion.found ? 'YES' : 'NO'}`);

        if (!results.platforms.reaktion.found && networkRequests.length > 0) {
            console.log('\n⚠️  ISSUE: Network requests captured but Reaktion not detected!');
            console.log('This suggests the pixel scanner is not properly processing network requests.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

// Run the test
testReaktionDetection().then(() => {
    console.log('\n🏁 Test completed');
}).catch(console.error);