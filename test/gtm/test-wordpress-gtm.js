/**
 * Test script for detecting GTM on WordPress sites
 * Specifically testing: https://blivskiinstruktor.dk/
 * Expected GTM: GTM-W8C6SQ5
 * 
 * This script mimics Tag Assistant's detection methods:
 * 1. Network request monitoring
 * 2. window.dataLayer inspection
 * 3. window.google_tag_manager inspection
 * 4. JavaScript execution context checks
 */

const puppeteer = require('puppeteer');

async function testGTMDetection(url) {
    let browser;
    try {
        console.log(`🔍 Testing GTM detection for: ${url}\n`);
        console.log(`Expected GTM: GTM-W8C6SQ5\n`);

        browser = await puppeteer.launch({
            headless: false, // Set to false to see what's happening
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const foundGTM = new Set();
        const networkRequests = [];

        // Method 1: Monitor network requests (like Tag Assistant does)
        console.log('📡 Method 1: Monitoring network requests...');
        page.on('request', (request) => {
            const requestUrl = request.url();
            networkRequests.push(requestUrl);

            // Check for GTM script requests
            if (requestUrl.includes('googletagmanager.com')) {
                console.log(`   ✅ Found GTM request: ${requestUrl}`);
                
                // Extract GTM ID from URL - multiple patterns
                // Pattern 1: /gtm.js?id=GTM-XXXXX
                let gtmMatch = requestUrl.match(/[\/&]id=(GTM-[A-Z0-9]+)/);
                if (gtmMatch) {
                    foundGTM.add(gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID (id param): ${gtmMatch[1]}`);
                }
                
                // Pattern 2: /gtm.js?id=XXXXX (without GTM- prefix)
                gtmMatch = requestUrl.match(/[\/&]id=([A-Z0-9]{6,})/);
                if (gtmMatch && !gtmMatch[1].startsWith('GTM-')) {
                    foundGTM.add('GTM-' + gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID (converted): GTM-${gtmMatch[1]}`);
                }
                
                // Pattern 3: Check for GTM- in the URL path
                gtmMatch = requestUrl.match(/(GTM-[A-Z0-9]{6,})/);
                if (gtmMatch) {
                    foundGTM.add(gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID (path): ${gtmMatch[1]}`);
                }
            }
        });

        // Monitor responses for GTM scripts
        page.on('response', async (response) => {
            const responseUrl = response.url();
            
            if (responseUrl.includes('googletagmanager.com')) {
                console.log(`   📥 GTM Response received: ${responseUrl}`);
                
                // Extract GTM ID from response URL - multiple patterns
                // Pattern 1: /gtm.js?id=GTM-XXXXX
                let gtmMatch = responseUrl.match(/[\/&]id=(GTM-[A-Z0-9]+)/);
                if (gtmMatch) {
                    foundGTM.add(gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID from response (id param): ${gtmMatch[1]}`);
                }
                
                // Pattern 2: /gtm.js?id=XXXXX (without GTM- prefix)
                gtmMatch = responseUrl.match(/[\/&]id=([A-Z0-9]{6,})/);
                if (gtmMatch && !gtmMatch[1].startsWith('GTM-')) {
                    foundGTM.add('GTM-' + gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID from response (converted): GTM-${gtmMatch[1]}`);
                }
                
                // Pattern 3: Check for GTM- in the URL path
                gtmMatch = responseUrl.match(/(GTM-[A-Z0-9]{6,})/);
                if (gtmMatch) {
                    foundGTM.add(gtmMatch[1]);
                    console.log(`   🎯 Extracted GTM ID from response (path): ${gtmMatch[1]}`);
                }

                // Try to read response content for additional GTM references
                try {
                    const contentType = response.headers()['content-type'] || '';
                    if (contentType.includes('javascript') || contentType.includes('text')) {
                        const content = await response.text();
                        const gtmMatches = content.match(/GTM-[A-Z0-9]{6,}/g);
                        if (gtmMatches) {
                            gtmMatches.forEach(match => {
                                if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                                    foundGTM.add(match);
                                    console.log(`   🎯 Found GTM in response content: ${match}`);
                                }
                            });
                        }
                    }
                } catch (error) {
                    // Some responses might not be readable, skip
                }
            }
        });

        console.log(`\n🌐 Navigating to ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log(`\n⏳ Waiting for page to fully load and scripts to execute...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for dynamic scripts

        // Method 2: Check window.dataLayer (Tag Assistant checks this)
        console.log(`\n📊 Method 2: Checking window.dataLayer...`);
        try {
            const dataLayer = await page.evaluate(() => {
                if (window.dataLayer && Array.isArray(window.dataLayer)) {
                    return {
                        exists: true,
                        length: window.dataLayer.length,
                        items: window.dataLayer.slice(0, 5) // First 5 items
                    };
                }
                return { exists: false };
            });
            
            if (dataLayer.exists) {
                console.log(`   ✅ dataLayer found with ${dataLayer.length} items`);
                console.log(`   Sample items:`, JSON.stringify(dataLayer.items, null, 2));
                
                // Check dataLayer for GTM references
                const dataLayerContent = await page.evaluate(() => {
                    return JSON.stringify(window.dataLayer);
                });
                const gtmMatches = dataLayerContent.match(/GTM-[A-Z0-9]{6,}/g);
                if (gtmMatches) {
                    gtmMatches.forEach(match => {
                        if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                            foundGTM.add(match);
                            console.log(`   🎯 Found GTM in dataLayer: ${match}`);
                        }
                    });
                }
            } else {
                console.log(`   ❌ dataLayer not found`);
            }
        } catch (error) {
            console.log(`   ⚠️ Error checking dataLayer: ${error.message}`);
        }

        // Method 3: Check window.google_tag_manager (Tag Assistant checks this)
        console.log(`\n🏷️ Method 3: Checking window.google_tag_manager...`);
        try {
            const gtmObject = await page.evaluate(() => {
                if (window.google_tag_manager) {
                    const gtmKeys = Object.keys(window.google_tag_manager);
                    return {
                        exists: true,
                        keys: gtmKeys,
                        containers: gtmKeys.map(key => {
                            try {
                                const container = window.google_tag_manager[key];
                                return {
                                    id: key,
                                    dataLayer: container && container.dataLayer ? container.dataLayer.length : 0,
                                    hasDataLayer: !!(container && container.dataLayer)
                                };
                            } catch (e) {
                                return {
                                    id: key,
                                    error: e.message
                                };
                            }
                        })
                    };
                }
                return { exists: false };
            });
            
            if (gtmObject.exists) {
                console.log(`   ✅ google_tag_manager found with ${gtmObject.keys.length} container(s)`);
                gtmObject.containers.forEach(container => {
                    console.log(`   🎯 Container key: ${container.id}`);
                    // The key itself might be the GTM ID
                    if (container.id.match(/^GTM-[A-Z0-9]{6,}$/)) {
                        foundGTM.add(container.id);
                        console.log(`      ✅ Valid GTM ID: ${container.id}`);
                    } else if (container.id.match(/^[A-Z0-9]{6,}$/)) {
                        // Sometimes it's stored without GTM- prefix
                        const gtmId = 'GTM-' + container.id;
                        foundGTM.add(gtmId);
                        console.log(`      ✅ Converted to GTM ID: ${gtmId}`);
                    } else {
                        console.log(`      ⚠️ Key doesn't match GTM format: ${container.id}`);
                    }
                });
            } else {
                console.log(`   ❌ google_tag_manager not found`);
            }
        } catch (error) {
            console.log(`   ⚠️ Error checking google_tag_manager: ${error.message}`);
        }

        // Method 4: Check for GTM script tags in DOM (after dynamic loading)
        console.log(`\n📄 Method 4: Checking DOM for GTM script tags...`);
        try {
            const gtmScripts = await page.evaluate(() => {
                // Check for both gtm.js and gtag.js scripts
                const scripts = Array.from(document.querySelectorAll('script[src*="googletagmanager"]'));
                return scripts.map(script => ({
                    src: script.src,
                    id: script.id || null,
                    async: script.async,
                    defer: script.defer,
                    isGTM: script.src.includes('/gtm.js'),
                    isGtag: script.src.includes('/gtag/')
                }));
            });
            
            if (gtmScripts.length > 0) {
                console.log(`   ✅ Found ${gtmScripts.length} GTM-related script tag(s) in DOM:`);
                gtmScripts.forEach((script, index) => {
                    console.log(`   ${index + 1}. ${script.src}`);
                    console.log(`      Type: ${script.isGTM ? 'GTM.js' : script.isGtag ? 'gtag.js' : 'Other'}`);
                    
                    // Extract GTM ID from URL - try multiple patterns
                    let gtmMatch = script.src.match(/[\/&]id=(GTM-[A-Z0-9]+)/);
                    if (gtmMatch) {
                        foundGTM.add(gtmMatch[1]);
                        console.log(`      🎯 Extracted (id param): ${gtmMatch[1]}`);
                    } else {
                        // Try without GTM- prefix
                        gtmMatch = script.src.match(/[\/&]id=([A-Z0-9]{6,})/);
                        if (gtmMatch && !gtmMatch[1].startsWith('GTM-')) {
                            const gtmId = 'GTM-' + gtmMatch[1];
                            foundGTM.add(gtmId);
                            console.log(`      🎯 Extracted (converted): ${gtmId}`);
                        } else {
                            // Check for GTM- in the URL path
                            gtmMatch = script.src.match(/(GTM-[A-Z0-9]{6,})/);
                            if (gtmMatch) {
                                foundGTM.add(gtmMatch[1]);
                                console.log(`      🎯 Extracted (path): ${gtmMatch[1]}`);
                            }
                        }
                    }
                });
            } else {
                console.log(`   ❌ No GTM script tags found in DOM`);
            }
        } catch (error) {
            console.log(`   ⚠️ Error checking DOM: ${error.message}`);
        }
        
        // Method 4b: Check for GTM noscript iframe
        console.log(`\n📄 Method 4b: Checking for GTM noscript iframe...`);
        try {
            const gtmIframes = await page.evaluate(() => {
                const iframes = Array.from(document.querySelectorAll('noscript iframe[src*="googletagmanager"]'));
                return iframes.map(iframe => ({
                    src: iframe.src,
                    id: iframe.id || null
                }));
            });
            
            if (gtmIframes.length > 0) {
                console.log(`   ✅ Found ${gtmIframes.length} GTM noscript iframe(s):`);
                gtmIframes.forEach((iframe, index) => {
                    console.log(`   ${index + 1}. ${iframe.src}`);
                    const gtmMatch = iframe.src.match(/id=(GTM-[A-Z0-9]+)/);
                    if (gtmMatch) {
                        foundGTM.add(gtmMatch[1]);
                        console.log(`      🎯 Extracted: ${gtmMatch[1]}`);
                    }
                });
            } else {
                console.log(`   ❌ No GTM noscript iframes found`);
            }
        } catch (error) {
            console.log(`   ⚠️ Error checking noscript iframes: ${error.message}`);
        }

        // Method 5: Check HTML content for GTM patterns
        console.log(`\n🔍 Method 5: Scanning HTML content...`);
        try {
            const html = await page.content();
            
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
                        foundGTM.add(gtmId);
                        console.log(`   🎯 Found in HTML: ${gtmId}`);
                    }
                }
            });

            if (foundGTM.size === 0) {
                console.log(`   ❌ No GTM found in HTML content`);
            }
        } catch (error) {
            console.log(`   ⚠️ Error scanning HTML: ${error.message}`);
        }

        // Method 6: Check for WordPress-specific GTM plugins
        console.log(`\n🔌 Method 6: Checking for WordPress GTM plugins...`);
        try {
            const wpGTM = await page.evaluate(() => {
                // Check for common WordPress GTM plugin patterns
                const checks = {
                    gtm4wp: false,
                    gtmContainerId: null,
                    wpScripts: [],
                    windowVars: []
                };

                // Check for GTM4WP plugin
                if (window.gtm4wp_datalayer_name) {
                    checks.gtm4wp = true;
                }

                // Check all window properties for GTM references
                for (const key in window) {
                    try {
                        if (key.includes('GTM') || key.includes('gtm')) {
                            checks.windowVars.push(key);
                        }
                        const value = window[key];
                        if (typeof value === 'string' && value.match(/GTM-[A-Z0-9]{6,}/)) {
                            const match = value.match(/GTM-[A-Z0-9]{6,}/);
                            if (match) checks.wpScripts.push(match[0]);
                        }
                    } catch (e) {
                        // Skip inaccessible properties
                    }
                }

                // Check inline scripts for GTM
                const scripts = document.querySelectorAll('script:not([src])');
                scripts.forEach(script => {
                    const content = script.textContent || script.innerHTML;
                    const gtmMatches = content.match(/GTM-[A-Z0-9]{6,}/g);
                    if (gtmMatches) {
                        checks.wpScripts.push(...gtmMatches);
                    }
                });

                return checks;
            });

            if (wpGTM.gtm4wp) {
                console.log(`   ✅ GTM4WP plugin detected`);
            }
            if (wpGTM.windowVars.length > 0) {
                console.log(`   🔍 Found GTM-related window variables: ${wpGTM.windowVars.slice(0, 5).join(', ')}`);
            }
            if (wpGTM.wpScripts.length > 0) {
                const uniqueScripts = [...new Set(wpGTM.wpScripts)];
                console.log(`   🎯 Found GTM in inline scripts/window: ${uniqueScripts.join(', ')}`);
                uniqueScripts.forEach(id => foundGTM.add(id));
            }
        } catch (error) {
            console.log(`   ⚠️ Error checking WordPress plugins: ${error.message}`);
        }
        
        // Method 7: Wait a bit more and check for dynamically loaded GTM scripts
        console.log(`\n⏳ Method 7: Waiting for additional dynamic scripts...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check network requests again for /gtm.js specifically
        const gtmJsRequests = networkRequests.filter(url => url.includes('/gtm.js?id='));
        if (gtmJsRequests.length > 0) {
            console.log(`   ✅ Found ${gtmJsRequests.length} /gtm.js request(s):`);
            gtmJsRequests.forEach((url, index) => {
                console.log(`   ${index + 1}. ${url}`);
                const gtmMatch = url.match(/id=(GTM-[A-Z0-9]+)/);
                if (gtmMatch) {
                    foundGTM.add(gtmMatch[1]);
                    console.log(`      🎯 Extracted: ${gtmMatch[1]}`);
                }
            });
        } else {
            console.log(`   ❌ No /gtm.js requests found`);
            console.log(`   💡 This suggests GTM might be loaded via gtag.js or server-side`);
        }

        // Summary
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 DETECTION SUMMARY`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Total network requests monitored: ${networkRequests.length}`);
        console.log(`GTM containers found: ${foundGTM.size}`);
        
        const finalGTM = Array.from(foundGTM);
        if (finalGTM.length > 0) {
            console.log(`\n✅ Found GTM Container(s):`);
            finalGTM.forEach((gtm, index) => {
                const isExpected = gtm === 'GTM-W8C6SQ5';
                console.log(`   ${index + 1}. ${gtm} ${isExpected ? '✅ (Expected)' : ''}`);
            });
        } else {
            console.log(`\n❌ No GTM containers detected`);
            console.log(`\nDebug info:`);
            console.log(`   - Total network requests: ${networkRequests.length}`);
            console.log(`   - GTM-related requests: ${networkRequests.filter(url => url.includes('googletagmanager')).length}`);
            console.log(`   - Sample requests (first 10):`);
            networkRequests.slice(0, 10).forEach((url, index) => {
                console.log(`      ${index + 1}. ${url.substring(0, 80)}...`);
            });
        }

        await browser.close();
        return finalGTM;

    } catch (error) {
        console.error(`\n❌ Error during test: ${error.message}`);
        console.error(error.stack);
        if (browser) {
            await browser.close();
        }
        return [];
    }
}

// Run the test
if (require.main === module) {
    const url = process.argv[2] || 'https://blivskiinstruktor.dk/';
    
    testGTMDetection(url).then(containers => {
        console.log(`\n🎉 TEST COMPLETE`);
        if (containers.length > 0) {
            console.log(`\n✅ Successfully detected GTM container(s):`);
            containers.forEach(container => console.log(`   - ${container}`));
        } else {
            console.log(`\n❌ Failed to detect GTM container`);
            console.log(`\n💡 This suggests GTM is loaded in a way we're not detecting yet.`);
            console.log(`   Consider checking:`);
            console.log(`   - Iframe-based GTM loading`);
            console.log(`   - Server-side GTM`);
            console.log(`   - WordPress-specific plugin implementations`);
        }
        process.exit(containers.length > 0 ? 0 : 1);
    }).catch(error => {
        console.error(`\n💥 Test failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { testGTMDetection };
