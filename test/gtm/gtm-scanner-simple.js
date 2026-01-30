/**
 * Simple GTM Scanner (without Puppeteer)
 * Tests HTML and direct script fetching
 */

const https = require('https');

/**
 * Fetch URL content
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                resolve(data);
            });
        });

        request.on('error', (error) => {
            reject(error);
        });

        request.setTimeout(15000, () => {
            request.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * Extract GTM from HTML
 */
function extractGTMFromHTML(html) {
    const containers = new Set();

    // Standard patterns
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

    // Shopify pattern
    const shopifyMatch = html.match(/"google_tag_ids\\":\[\\"GT-([A-Z0-9]+)\\"\\]/);
    if (shopifyMatch) {
        containers.add('GTM-' + shopifyMatch[1]);
    }

    return Array.from(containers);
}

/**
 * Extract GTM from Stape script
 */
function extractGTMFromStape(scriptContent) {
    const containers = new Set();

    // Look for: const GTM_ID = 'WP9Q2FZV';
    const gtmIdMatch = scriptContent.match(/const\s+GTM_ID\s*=\s*['"]([^'"]+)['"]/);
    if (gtmIdMatch) {
        const gtmId = gtmIdMatch[1];
        if (gtmId.match(/^[A-Z0-9]{6,}$/)) {
            containers.add('GTM-' + gtmId);
        } else if (gtmId.startsWith('GTM-')) {
            containers.add(gtmId);
        }
    }

    // Also check for any GTM references
    const gtmMatches = scriptContent.match(/GTM-[A-Z0-9]{6,}/g);
    if (gtmMatches) {
        gtmMatches.forEach(match => {
            if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                containers.add(match);
            }
        });
    }

    return Array.from(containers);
}

/**
 * Find Stape script URLs in HTML
 */
function findStapeScripts(html, baseUrl) {
    const stapeUrls = [];
    
    // Look for stape script tags
    const scriptPattern = /<script[^>]+src=["']([^"']*stapecdn\.com[^"']*)["'][^>]*>/gi;
    let match;
    while ((match = scriptPattern.exec(html)) !== null) {
        let url = match[1];
        if (url.startsWith('//')) {
            url = 'https:' + url;
        } else if (url.startsWith('/')) {
            // Relative URL - construct full URL
            const urlObj = new URL(baseUrl);
            url = urlObj.origin + url;
        } else if (!url.startsWith('http')) {
            // Relative URL without leading slash
            const urlObj = new URL(baseUrl);
            url = urlObj.origin + '/' + url;
        }
        stapeUrls.push(url);
    }

    // Also look for stape references in script content that might construct URLs
    const stapeUrlPattern = /stapecdn\.com\/widget\/script_pixel[^"']*/gi;
    let urlMatch;
    while ((urlMatch = stapeUrlPattern.exec(html)) !== null) {
        const url = 'https://sp.' + urlMatch[0];
        if (!stapeUrls.includes(url)) {
            stapeUrls.push(url);
        }
    }

    return stapeUrls;
}

/**
 * Main scanner
 */
async function scanForGTM(url) {
    try {
        console.log(`🔍 Scanning ${url} for GTM containers...\n`);

        // Step 1: Fetch and scan HTML
        console.log('📄 Step 1: Fetching HTML content...');
        const html = await fetchUrl(url);
        console.log(`   HTML length: ${html.length} characters`);

        const htmlGTM = extractGTMFromHTML(html);
        console.log(`   Found ${htmlGTM.length} GTM container(s) in HTML`);
        if (htmlGTM.length > 0) {
            htmlGTM.forEach(gtm => console.log(`   ✅ ${gtm}`));
        }

        // Step 2: Find and scan Stape scripts
        console.log('\n🔗 Step 2: Looking for Stape scripts...');
        const stapeUrls = findStapeScripts(html, url);
        console.log(`   Found ${stapeUrls.length} Stape script URL(s) in HTML`);
        
        if (stapeUrls.length === 0) {
            // Try to construct Stape URL from shop ID if found in HTML
            const shopIdMatch = html.match(/shop_id["']?\s*[:=]\s*["']?(\d+)/);
            if (shopIdMatch) {
                const shopId = shopIdMatch[1];
                const stapeUrl = `https://sp.stapecdn.com/widget/script_pixel?shop_id=${shopId}`;
                console.log(`   Constructed Stape URL from shop_id: ${stapeUrl}`);
                stapeUrls.push(stapeUrl);
            }
        }

        const stapeGTM = [];
        for (const stapeUrl of stapeUrls) {
            try {
                console.log(`   📡 Fetching: ${stapeUrl}`);
                const scriptContent = await fetchUrl(stapeUrl);
                const gtmContainers = extractGTMFromStape(scriptContent);
                if (gtmContainers.length > 0) {
                    console.log(`   ✅ Found GTM in Stape script:`);
                    gtmContainers.forEach(gtm => {
                        console.log(`      ${gtm}`);
                        stapeGTM.push(gtm);
                    });
                } else {
                    console.log(`   ❌ No GTM found in this script`);
                }
            } catch (error) {
                console.log(`   ⚠️ Failed to fetch: ${error.message}`);
            }
        }

        // Combine results
        const allGTM = [...new Set([...htmlGTM, ...stapeGTM])];

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
        console.error('❌ Error:', error.message);
        return [];
    }
}

// Test
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

module.exports = { scanForGTM, extractGTMFromHTML, extractGTMFromStape, findStapeScripts };