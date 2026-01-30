/**
 * Comprehensive GTM Container Scanner
 * Scans HTML content first, then network requests, with third-party fallbacks
 */

const puppeteer = require('puppeteer');

/**
 * Extract GTM containers from HTML content
 */
function extractGTMFromHTML(html) {
    const containers = new Set();

    // Standard GTM patterns
    const patterns = [
        /googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/gi,
        /googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/gi,
        /GTM-[A-Z0-9]{6,}/g,
    ];

    patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const gtmId = match[1] || match[0];
            if (gtmId.match(/^GTM-[A-Z0-9]{6,}$/)) {
                containers.add(gtmId);
            }
        }
    });

    // Shopify web pixels configuration
    const shopifyPattern = /"google_tag_ids\\":\[\\"GT-([A-Z0-9]+)\\"\\]/;
    const shopifyMatch = html.match(shopifyPattern);
    if (shopifyMatch) {
        containers.add('GTM-' + shopifyMatch[1]);
    }

    return Array.from(containers);
}

/**
 * Scan network requests for GTM containers
 */
async function scanNetworkRequests(page) {
    const containers = new Set();
    const networkRequests = [];

    // Monitor network requests
    page.on('request', (request) => {
        const url = request.url();
        networkRequests.push(url);

        // Check for GTM script requests
        if (url.includes('googletagmanager.com/gtm.js')) {
            const gtmMatch = url.match(/id=(GTM-[A-Z0-9]+)/);
            if (gtmMatch) {
                containers.add(gtmMatch[1]);
                console.log(`🎯 Found GTM in network request: ${gtmMatch[1]}`);
            }
        }
    });

    // Monitor responses for GTM content
    page.on('response', async (response) => {
        const url = response.url();

        // Check for scripts that might contain GTM
        if (url.includes('googletagmanager.com') ||
            url.includes('gtm') ||
            url.includes('google') ||
            url.includes('analytics') ||
            url.includes('tagmanager')) {

            try {
                const content = await response.text();
                const gtmMatches = content.match(/GTM-[A-Z0-9]{6,}/g);
                if (gtmMatches) {
                    gtmMatches.forEach(match => {
                        if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                            containers.add(match);
                            console.log(`📝 Found GTM in response ${url}: ${match}`);
                        }
                    });
                }
            } catch (error) {
                // Some responses might not be text, skip them
            }
        }
    });

    return { containers, networkRequests };
}

/**
 * Scan third-party scripts for GTM (Stape, etc.)
 */
async function scanThirdPartyScripts(page, networkRequests) {
    const containers = new Set();

    // Stape detection
    const stapeScripts = networkRequests.filter(url => 
        url.includes('stapecdn.com') || 
        url.includes('stape.io') ||
        url.includes('script_pixel')
    );

    console.log(`🔍 Found ${stapeScripts.length} Stape-related scripts`);

    for (const scriptUrl of stapeScripts) {
        try {
            console.log(`📡 Fetching Stape script: ${scriptUrl}`);
            const response = await page.goto(scriptUrl, { waitUntil: 'networkidle0' });
            const content = await response.text();

            // Look for GTM_ID constant in Stape scripts
            // Pattern: const GTM_ID = 'WP9Q2FZV';
            const gtmIdMatch = content.match(/const\s+GTM_ID\s*=\s*['"]([^'"]+)['"]/);
            if (gtmIdMatch) {
                const gtmId = gtmIdMatch[1];
                // Stape uses format like 'WP9Q2FZV', convert to GTM format
                if (gtmId.match(/^[A-Z0-9]{6,}$/)) {
                    containers.add('GTM-' + gtmId);
                    console.log(`✅ Found GTM_ID in Stape script: GTM-${gtmId}`);
                } else if (gtmId.startsWith('GTM-')) {
                    containers.add(gtmId);
                    console.log(`✅ Found GTM_ID in Stape script: ${gtmId}`);
                }
            }

            // Also check for GTM references in the script content
            const gtmMatches = content.match(/GTM-[A-Z0-9]{6,}/g);
            if (gtmMatches) {
                gtmMatches.forEach(match => {
                    if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                        containers.add(match);
                        console.log(`✅ Found GTM reference in Stape script: ${match}`);
                    }
                });
            }

            // Also check for GTM_URL patterns
            const gtmUrlMatch = content.match(/GTM_URL\s*=\s*['"]([^'"]+)['"]/);
            if (gtmUrlMatch) {
                console.log(`📋 Found GTM_URL: ${gtmUrlMatch[1]}`);
            }

        } catch (error) {
            console.log(`⚠️ Failed to fetch Stape script ${scriptUrl}: ${error.message}`);
        }
    }

    return Array.from(containers);
}

/**
 * Main scanner function
 */
async function scanForGTM(url) {
    let browser;
    try {
        console.log(`🔍 Scanning ${url} for GTM containers...\n`);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        // Set up network monitoring
        const networkMonitor = await scanNetworkRequests(page);

        console.log(`📡 Navigating to ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait for dynamic content
        console.log(`⏳ Waiting for dynamic content to load...`);
        await page.waitForTimeout(5000);

        // Step 1: Scan HTML content
        console.log(`\n📄 Step 1: Scanning HTML content...`);
        const html = await page.content();
        const htmlGTM = extractGTMFromHTML(html);
        console.log(`   Found ${htmlGTM.length} GTM container(s) in HTML`);

        if (htmlGTM.length > 0) {
            htmlGTM.forEach(container => {
                console.log(`   ✅ ${container}`);
                networkMonitor.containers.add(container);
            });
        }

        // Step 2: Scan network requests
        console.log(`\n🌐 Step 2: Analyzing ${networkMonitor.networkRequests.length} network requests...`);
        const networkGTM = Array.from(networkMonitor.containers);
        console.log(`   Found ${networkGTM.length} GTM container(s) in network requests`);

        // Step 3: Scan third-party scripts (Stape, etc.)
        console.log(`\n🔗 Step 3: Scanning third-party scripts...`);
        const thirdPartyGTM = await scanThirdPartyScripts(page, networkMonitor.networkRequests);
        console.log(`   Found ${thirdPartyGTM.length} GTM container(s) in third-party scripts`);

        // Combine all results
        const allGTM = [...new Set([...htmlGTM, ...networkGTM, ...thirdPartyGTM])];

        await browser.close();

        console.log(`\n🎯 FINAL RESULT:`);
        if (allGTM.length > 0) {
            console.log(`   Found ${allGTM.length} GTM container(s):`);
            allGTM.forEach((container, index) => {
                console.log(`   ${index + 1}. ${container}`);
            });
        } else {
            console.log(`   ❌ No GTM containers found`);
        }

        return allGTM;

    } catch (error) {
        console.error('❌ Error scanning for GTM:', error.message);
        if (browser) {
            await browser.close();
        }
        return [];
    }
}

// Test the scanner
if (require.main === module) {
    const url = process.argv[2] || 'https://pompdelux.dk/';

    scanForGTM(url).then(containers => {
        console.log('\n🎉 SCAN COMPLETE');
        if (containers.length > 0) {
            console.log('GTM Containers:');
            containers.forEach(container => {
                console.log(`   ${container}`);
            });
        } else {
            console.log('No GTM containers detected');
        }
    }).catch(error => {
        console.error('💥 Scan failed:', error.message);
    });
}

module.exports = { scanForGTM, extractGTMFromHTML, scanThirdPartyScripts };