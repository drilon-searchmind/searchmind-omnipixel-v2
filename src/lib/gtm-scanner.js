/**
 * GTM Container Detection
 * Scans websites for Google Tag Manager containers
 */

/**
 * Extract GTM container IDs from HTML content
 * Handles multiple GTM containers and various loading methods
 */
function extractGTMContainers(html) {
    const gtmContainers = new Set();

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
                gtmContainers.add(gtmId);
            }
        }
    });

    // Shopify web pixels configuration
    const shopifyPattern = /"google_tag_ids\\":\[\\"GT-([A-Z0-9]+)\\"\\]/;
    const shopifyMatch = html.match(shopifyPattern);
    if (shopifyMatch) {
        gtmContainers.add('GTM-' + shopifyMatch[1]);
    }

    // Look for dataLayer configurations
    const dataLayerMatches = html.match(/dataLayer\.push\([^)]*GTM-[A-Z0-9]+[^)]*\)/gi);
    if (dataLayerMatches) {
        dataLayerMatches.forEach(match => {
            const gtmMatch = match.match(/GTM-[A-Z0-9]{6,}/);
            if (gtmMatch) {
                gtmContainers.add(gtmMatch[0]);
            }
        });
    }

    // Check inline scripts for GTM references
    const inlineScripts = html.match(/<script[^>]*>(.*?)<\/script>/gis);
    if (inlineScripts) {
        inlineScripts.forEach(script => {
            const scriptContent = script.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
            const gtmMatches = scriptContent.match(/GTM-[A-Z0-9]{6,}/g);
            if (gtmMatches) {
                gtmMatches.forEach(match => {
                    if (match.match(/^GTM-[A-Z0-9]{6,}$/)) {
                        gtmContainers.add(match);
                    }
                });
            }
        });
    }

    return Array.from(gtmContainers);
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
            const urlObj = new URL(baseUrl);
            url = urlObj.origin + url;
        } else if (!url.startsWith('http')) {
            const urlObj = new URL(baseUrl);
            url = urlObj.origin + '/' + url;
        }
        stapeUrls.push(url);
    }

    // Look for stape URL patterns in script content
    const stapeUrlPattern = /stapecdn\.com\/widget\/script_pixel[^"']*/gi;
    let urlMatch;
    while ((urlMatch = stapeUrlPattern.exec(html)) !== null) {
        const url = 'https://sp.' + urlMatch[0];
        if (!stapeUrls.includes(url)) {
            stapeUrls.push(url);
        }
    }

    // Try to construct Stape URL from shop_id if found
    const shopIdMatch = html.match(/shop_id["']?\s*[:=]\s*["']?(\d+)/);
    if (shopIdMatch) {
        const shopId = shopIdMatch[1];
        const stapeUrl = `https://sp.stapecdn.com/widget/script_pixel?shop_id=${shopId}`;
        if (!stapeUrls.includes(stapeUrl)) {
            stapeUrls.push(stapeUrl);
        }
    }

    return stapeUrls;
}

/**
 * Extract GTM from Stape script content
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
 * Check browser context for GTM containers (mimics Tag Assistant behavior)
 * @param {Function} pageEvaluate - Function to execute code in browser context
 */
async function checkGTMInBrowser(pageEvaluate) {
    const containers = new Set();
    
    try {
        // Method 1: Check window.google_tag_manager (most reliable for dynamically loaded GTM)
        const gtmObject = await pageEvaluate(() => {
            if (window.google_tag_manager) {
                const gtmKeys = Object.keys(window.google_tag_manager);
                return {
                    exists: true,
                    keys: gtmKeys.filter(key => {
                        // Filter for GTM container IDs (format: GTM-XXXXXX)
                        return key.match(/^GTM-[A-Z0-9]{6,}$/);
                    })
                };
            }
            return { exists: false, keys: [] };
        });
        
        if (gtmObject.exists && gtmObject.keys.length > 0) {
            console.log(`Found GTM containers in window.google_tag_manager: ${gtmObject.keys.join(', ')}`);
            gtmObject.keys.forEach(key => containers.add(key));
        }
        
        // Method 2: Check window.dataLayer for GTM references
        const dataLayerCheck = await pageEvaluate(() => {
            if (window.dataLayer && Array.isArray(window.dataLayer)) {
                // Check if dataLayer has GTM events (indicates GTM is active)
                const hasGTMEvents = window.dataLayer.some(item => 
                    item && (item.event === 'gtm.js' || item['gtm.start'])
                );
                return { exists: true, hasGTMEvents };
            }
            return { exists: false, hasGTMEvents: false };
        });
        
        if (dataLayerCheck.exists && dataLayerCheck.hasGTMEvents) {
            console.log('GTM is active (dataLayer contains gtm.js events)');
        }
        
        // Method 3: Check DOM for GTM script tags (after dynamic loading)
        const gtmScripts = await pageEvaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]'));
            return scripts.map(script => {
                const match = script.src.match(/id=(GTM-[A-Z0-9]+)/);
                return match ? match[1] : null;
            }).filter(id => id !== null);
        });
        
        if (gtmScripts.length > 0) {
            console.log(`Found GTM script tags in DOM: ${gtmScripts.join(', ')}`);
            gtmScripts.forEach(id => containers.add(id));
        }
        
    } catch (error) {
        console.warn('Error checking browser context for GTM:', error.message);
    }
    
    return Array.from(containers);
}

/**
 * Scan for GTM containers in website content
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for constructing relative URLs
 * @param {Function} fetchScript - Optional function to fetch external scripts
 * @param {Function} pageEvaluate - Optional function to execute code in browser context
 */
async function scanForGTM(html, baseUrl = '', fetchScript = null, pageEvaluate = null) {
    const containers = new Set();

    // Step 1: Extract from HTML
    const htmlGTM = extractGTMContainers(html);
    htmlGTM.forEach(container => containers.add(container));

    // Step 2: Check browser context (most reliable for dynamically loaded GTM)
    if (pageEvaluate) {
        try {
            const browserGTM = await checkGTMInBrowser(pageEvaluate);
            browserGTM.forEach(container => containers.add(container));
            if (browserGTM.length > 0) {
                console.log(`✅ Found ${browserGTM.length} GTM container(s) via browser context check`);
            }
        } catch (error) {
            console.warn('Browser context check failed:', error.message);
        }
    }

    // Step 3: Check for third-party scripts (Stape, etc.)
    if (baseUrl && fetchScript) {
        const stapeUrls = findStapeScripts(html, baseUrl);
        
        for (const stapeUrl of stapeUrls) {
            try {
                const scriptContent = await fetchScript(stapeUrl);
                const stapeGTM = extractGTMFromStape(scriptContent);
                stapeGTM.forEach(container => containers.add(container));
            } catch (error) {
                console.warn(`Failed to fetch Stape script ${stapeUrl}:`, error.message);
            }
        }
    }

    const finalContainers = Array.from(containers);

    return {
        found: finalContainers.length > 0,
        containers: finalContainers,
        count: finalContainers.length
    };
}

export { 
    scanForGTM, 
    extractGTMContainers, 
    findStapeScripts, 
    extractGTMFromStape,
    checkGTMInBrowser
};