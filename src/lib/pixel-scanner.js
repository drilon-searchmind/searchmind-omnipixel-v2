/**
 * Pixel Detection Module
 * Detects Meta Pixel (Facebook), TikTok Pixel, LinkedIn Insight Tag, and Google Ads
 */

/**
 * Scan HTML content and network requests for marketing pixels and platforms
 * @param {string} html - HTML content to scan
 * @param {string} baseUrl - Base URL of the page
 * @param {Function} pageEvaluate - Function to evaluate code in browser context (for network monitoring)
 * @param {Array} networkRequests - Array of captured network requests for platform detection
 * @returns {Promise<Object>} Pixel detection results
 */
export async function scanForPixels(html, baseUrl, pageEvaluate, networkRequests = []) {
    const results = {
        meta: {
            found: false,
            pixelIds: [],
            pixelId: null,
            methods: []
        },
        tiktok: {
            found: false,
            pixelIds: [],
            pixelId: null,
            methods: []
        },
        linkedin: {
            found: false,
            pixelIds: [],
            pixelId: null,
            methods: []
        },
        googleAds: {
            found: false,
            conversionIds: [],
            conversionId: null,
            methods: []
        },
        platforms: {
            reaktion: {
                found: false,
                methods: []
            },
            profitmetrics: {
                found: false,
                methods: []
            },
            triplewhale: {
                found: false,
                methods: []
            }
        }
    };

    try {
        // 1. Meta Pixel (Facebook Pixel) Detection
        // Pattern 1: fbq('init', 'PIXEL_ID')
        const fbqInitPattern = /fbq\s*\(\s*['"]init['"]\s*,\s*['"]?(\d+)['"]?/gi;
        let match;
        while ((match = fbqInitPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.meta.pixelIds.includes(pixelId)) {
                results.meta.pixelIds.push(pixelId);
                results.meta.found = true;
                results.meta.methods.push('fbq-init-pattern');
            }
        }

        // Pattern 2: connect.facebook.net/en_US/fbevents.js with pixel ID in URL
        const fbScriptPattern = /connect\.facebook\.net\/[^"']*\/fbevents\.js[^"']*[?&]id=(\d+)/gi;
        while ((match = fbScriptPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.meta.pixelIds.includes(pixelId)) {
                results.meta.pixelIds.push(pixelId);
                results.meta.found = true;
                results.meta.methods.push('fb-script-url');
            }
        }

        // Pattern 3: noscript img tag with pixel ID
        const fbNoscriptPattern = /<noscript>[\s\S]*?<img[^>]*src=["']https:\/\/www\.facebook\.com\/tr[^"']*id=(\d+)/gi;
        while ((match = fbNoscriptPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.meta.pixelIds.includes(pixelId)) {
                results.meta.pixelIds.push(pixelId);
                results.meta.found = true;
                results.meta.methods.push('fb-noscript-img');
            }
        }

        // Pattern 4: _fbp cookie (Facebook Pixel cookie)
        const fbpCookiePattern = /_fbp[=:](\d+)/gi;
        while ((match = fbpCookiePattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.meta.pixelIds.includes(pixelId)) {
                results.meta.pixelIds.push(pixelId);
                results.meta.found = true;
                results.meta.methods.push('fb-cookie');
            }
        }

        // Pattern 5: data-pixel-id attribute
        const fbDataPattern = /data-pixel-id=["'](\d+)["']/gi;
        while ((match = fbDataPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.meta.pixelIds.includes(pixelId)) {
                results.meta.pixelIds.push(pixelId);
                results.meta.found = true;
                results.meta.methods.push('fb-data-attribute');
            }
        }

        // 2. TikTok Pixel Detection
        // Pattern 1: ttq.load('PIXEL_ID')
        const ttqLoadPattern = /ttq\.load\s*\(\s*['"](\d+)['"]/gi;
        while ((match = ttqLoadPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.tiktok.pixelIds.includes(pixelId)) {
                results.tiktok.pixelIds.push(pixelId);
                results.tiktok.found = true;
                results.tiktok.methods.push('ttq-load-pattern');
            }
        }

        // Pattern 2: analytics.tiktok.com script
        const tiktokScriptPattern = /analytics\.tiktok\.com\/i18n\/pixel\/events\.js[^"']*[?&]id=(\d+)/gi;
        while ((match = tiktokScriptPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.tiktok.pixelIds.includes(pixelId)) {
                results.tiktok.pixelIds.push(pixelId);
                results.tiktok.found = true;
                results.tiktok.methods.push('tiktok-script-url');
            }
        }

        // Pattern 3: snaptr('init', 'PIXEL_ID') - TikTok Snap Pixel
        const snaptrPattern = /snaptr\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/gi;
        while ((match = snaptrPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.tiktok.pixelIds.includes(pixelId)) {
                results.tiktok.pixelIds.push(pixelId);
                results.tiktok.found = true;
                results.tiktok.methods.push('snaptr-init-pattern');
            }
        }

        // Pattern 4: _ttp cookie (TikTok Pixel cookie)
        const ttpCookiePattern = /_ttp[=:](\d+)/gi;
        while ((match = ttpCookiePattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.tiktok.pixelIds.includes(pixelId)) {
                results.tiktok.pixelIds.push(pixelId);
                results.tiktok.found = true;
                results.tiktok.methods.push('tiktok-cookie');
            }
        }

        // 3. LinkedIn Insight Tag Detection
        // Pattern 1: _linkedin_partner_id = "PARTNER_ID"
        const linkedinPartnerPattern = /_linkedin_partner_id\s*=\s*["'](\d+)["']/gi;
        while ((match = linkedinPartnerPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.linkedin.pixelIds.includes(pixelId)) {
                results.linkedin.pixelIds.push(pixelId);
                results.linkedin.found = true;
                results.linkedin.methods.push('linkedin-partner-id');
            }
        }

        // Pattern 2: snaptr('init', 'PARTNER_ID', { partnerId: 'PARTNER_ID' })
        const linkedinSnaptrPattern = /snaptr\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"][\s\S]*?partnerId:\s*['"](\d+)['"]/gi;
        while ((match = linkedinSnaptrPattern.exec(html)) !== null) {
            const pixelId1 = match[1];
            const pixelId2 = match[2];
            [pixelId1, pixelId2].forEach(pixelId => {
                if (pixelId && !results.linkedin.pixelIds.includes(pixelId)) {
                    results.linkedin.pixelIds.push(pixelId);
                    results.linkedin.found = true;
                    results.linkedin.methods.push('linkedin-snaptr-init');
                }
            });
        }

        // Pattern 3: snq('init', 'PARTNER_ID')
        const linkedinSnqPattern = /snq\s*\(\s*['"]init['"]\s*,\s*['"](\d+)['"]/gi;
        while ((match = linkedinSnqPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.linkedin.pixelIds.includes(pixelId)) {
                results.linkedin.pixelIds.push(pixelId);
                results.linkedin.found = true;
                results.linkedin.methods.push('linkedin-snq-init');
            }
        }

        // Pattern 4: linkedin.com/px script
        const linkedinScriptPattern = /linkedin\.com\/px[^"']*[?&]pid=(\d+)/gi;
        while ((match = linkedinScriptPattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.linkedin.pixelIds.includes(pixelId)) {
                results.linkedin.pixelIds.push(pixelId);
                results.linkedin.found = true;
                results.linkedin.methods.push('linkedin-script-url');
            }
        }

        // Pattern 5: _liq cookie (LinkedIn cookie)
        const liqCookiePattern = /_liq[=:](\d+)/gi;
        while ((match = liqCookiePattern.exec(html)) !== null) {
            const pixelId = match[1];
            if (!results.linkedin.pixelIds.includes(pixelId)) {
                results.linkedin.pixelIds.push(pixelId);
                results.linkedin.found = true;
                results.linkedin.methods.push('linkedin-cookie');
            }
        }

        // 4. Google Ads Detection
        // Pattern 1: AW-CONVERSION_ID / AW-PIXEL_ID
        const awPattern = /AW-([A-Z0-9]+)/gi;
        while ((match = awPattern.exec(html)) !== null) {
            const conversionId = `AW-${match[1]}`;
            if (!results.googleAds.conversionIds.includes(conversionId)) {
                results.googleAds.conversionIds.push(conversionId);
                results.googleAds.found = true;
                results.googleAds.methods.push('aw-pattern');
            }
        }

        // Pattern 2: gtag('config', 'AW-CONVERSION_ID')
        const gtagAwPattern = /gtag\s*\(\s*['"]config['"]\s*,\s*['"](AW-[A-Z0-9]+)['"]/gi;
        while ((match = gtagAwPattern.exec(html)) !== null) {
            const conversionId = match[1];
            if (!results.googleAds.conversionIds.includes(conversionId)) {
                results.googleAds.conversionIds.push(conversionId);
                results.googleAds.found = true;
                results.googleAds.methods.push('gtag-aw-config');
            }
        }

        // Pattern 3: googleads.g.doubleclick.net script
        const googleAdsScriptPattern = /googleads\.g\.doubleclick\.net\/pagead\/conversion[^"']*[?&]id=(\d+)/gi;
        while ((match = googleAdsScriptPattern.exec(html)) !== null) {
            const conversionId = match[1];
            if (!results.googleAds.conversionIds.includes(conversionId)) {
                results.googleAds.conversionIds.push(conversionId);
                results.googleAds.found = true;
                results.googleAds.methods.push('googleads-script-url');
            }
        }

        // Pattern 4: googletagmanager.com/gtag/js with AW- in URL
        const gtmAwPattern = /googletagmanager\.com\/gtag\/js[^"']*[?&]id=(AW-[A-Z0-9]+)/gi;
        while ((match = gtmAwPattern.exec(html)) !== null) {
            const conversionId = match[1];
            if (!results.googleAds.conversionIds.includes(conversionId)) {
                results.googleAds.conversionIds.push(conversionId);
                results.googleAds.found = true;
                results.googleAds.methods.push('gtm-aw-url');
            }
        }

        // Pattern 5: _gcl_* cookies (Google Ads cookies)
        const gclCookiePattern = /_gcl_[^=:]*[=:](\d+)/gi;
        while ((match = gclCookiePattern.exec(html)) !== null) {
            // Google Ads detected via cookie
            if (!results.googleAds.found) {
                results.googleAds.found = true;
                results.googleAds.methods.push('googleads-cookie');
            }
        }

        // 5. Platform Detection (Reaktion, Profitmetrics, Triplewhale)
        // Reaktion Detection
        const reaktionPatterns = [
            /app\.reaktion\.com/i,
            /reaktion\.com\/scripts/i,
            /reaktion\.com\/assets/i,
            /reaktion.*analytics/i,
            /window\.reaktion/i,
            /reaktion.*tracking/i,
            /reaktion.*store/i
        ];
        reaktionPatterns.forEach(pattern => {
            if (pattern.test(html) && !results.platforms.reaktion.found) {
                results.platforms.reaktion.found = true;
                results.platforms.reaktion.methods.push('script-pattern');
            }
        });

        // Profitmetrics Detection
        const profitmetricsPatterns = [
            /profitmetrics\.io/i,
            /profitmetrics.*script/i,
            /profitmetrics.*analytics/i,
            /window\.profitmetrics/i,
            /profitmetrics.*tracking/i
        ];
        profitmetricsPatterns.forEach(pattern => {
            if (pattern.test(html) && !results.platforms.profitmetrics.found) {
                results.platforms.profitmetrics.found = true;
                results.platforms.profitmetrics.methods.push('script-pattern');
            }
        });

        // Triplewhale Detection
        const triplewhalePatterns = [
            /triplewhale\.com/i,
            /triplewhale.*script/i,
            /triplewhale.*analytics/i,
            /window\.triplewhale/i,
            /triplewhale.*tracking/i,
            /triplewhale.*pixel/i
        ];
        triplewhalePatterns.forEach(pattern => {
            if (pattern.test(html) && !results.platforms.triplewhale.found) {
                results.platforms.triplewhale.found = true;
                results.platforms.triplewhale.methods.push('script-pattern');
            }
        });

        // Check network requests for platform detection
        if (networkRequests && networkRequests.length > 0) {
            console.log('Analyzing', networkRequests.length, 'network requests for platform detection');

            networkRequests.forEach(request => {
                const url = request.url.toLowerCase();

                // Reaktion detection via network requests
                if (url.includes('reaktion.com') && !results.platforms.reaktion.found) {
                    results.platforms.reaktion.found = true;
                    results.platforms.reaktion.methods.push('network-request');
                    console.log('Reaktion detected via network request:', request.url);
                }

                // Profitmetrics detection via network requests
                if (url.includes('profitmetrics.io') && !results.platforms.profitmetrics.found) {
                    results.platforms.profitmetrics.found = true;
                    results.platforms.profitmetrics.methods.push('network-request');
                    console.log('Profitmetrics detected via network request:', request.url);
                }

                // Triplewhale detection via network requests
                if (url.includes('triplewhale.com') && !results.platforms.triplewhale.found) {
                    results.platforms.triplewhale.found = true;
                    results.platforms.triplewhale.methods.push('network-request');
                    console.log('Triplewhale detected via network request:', request.url);
                }
            });
        }

        // Set primary IDs (first found)
        if (results.meta.pixelIds.length > 0) {
            results.meta.pixelId = results.meta.pixelIds[0];
        }
        if (results.tiktok.pixelIds.length > 0) {
            results.tiktok.pixelId = results.tiktok.pixelIds[0];
        }
        if (results.linkedin.pixelIds.length > 0) {
            results.linkedin.pixelId = results.linkedin.pixelIds[0];
        }
        if (results.googleAds.conversionIds.length > 0) {
            results.googleAds.conversionId = results.googleAds.conversionIds[0];
        }

        // 5. Network Request Monitoring (if pageEvaluate is available)
        if (pageEvaluate && typeof pageEvaluate === 'function') {
            try {
                const networkPixels = await pageEvaluate(() => {
                    const detected = {
                        meta: [],
                        tiktok: [],
                        linkedin: [],
                        googleAds: [],
                        platforms: {
                            reaktion: false,
                            profitmetrics: false,
                            triplewhale: false
                        }
                    };

                    // Check window objects for pixel initialization
                    // Meta Pixel
                    if (typeof window.fbq !== 'undefined') {
                        try {
                            // Try to extract pixel ID from fbq queue
                            if (window.fbq.queue && Array.isArray(window.fbq.queue)) {
                                window.fbq.queue.forEach(item => {
                                    if (Array.isArray(item) && item[0] === 'init' && typeof item[1] === 'string') {
                                        const pixelId = item[1];
                                        if (/^\d+$/.test(pixelId) && !detected.meta.includes(pixelId)) {
                                            detected.meta.push(pixelId);
                                        }
                                    }
                                });
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                    }

                    // TikTok Pixel
                    if (typeof window.ttq !== 'undefined') {
                        try {
                            if (window.ttq.instance && window.ttq.instance.pixelId) {
                                const pixelId = String(window.ttq.instance.pixelId);
                                if (!detected.tiktok.includes(pixelId)) {
                                    detected.tiktok.push(pixelId);
                                }
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                    }

                    // LinkedIn Insight Tag
                    if (typeof window._linkedin_partner_id !== 'undefined') {
                        const pixelId = String(window._linkedin_partner_id);
                        if (!detected.linkedin.includes(pixelId)) {
                            detected.linkedin.push(pixelId);
                        }
                    }

                    // Google Ads - check for gtag
                    if (typeof window.gtag !== 'undefined') {
                        try {
                            // Check dataLayer for Google Ads conversions
                            if (window.dataLayer && Array.isArray(window.dataLayer)) {
                                window.dataLayer.forEach(item => {
                                    if (item && typeof item === 'object') {
                                        // Check for AW- conversion IDs
                                        Object.values(item).forEach(value => {
                                            if (typeof value === 'string' && value.startsWith('AW-')) {
                                                const conversionId = value.match(/AW-[A-Z0-9]+/)?.[0];
                                                if (conversionId && !detected.googleAds.includes(conversionId)) {
                                                    detected.googleAds.push(conversionId);
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                        } catch (e) {
                            // Ignore errors
                        }
                    }

                    // Platform Detection - Check for global objects
                    // Reaktion
                    if (typeof window.reaktion !== 'undefined' ||
                        (window.dataLayer && Array.isArray(window.dataLayer) &&
                         window.dataLayer.some(item => item && item.reaktion))) {
                        detected.platforms.reaktion = true;
                    }

                    // Profitmetrics
                    if (typeof window.profitmetrics !== 'undefined' ||
                        (window.dataLayer && Array.isArray(window.dataLayer) &&
                         window.dataLayer.some(item => item && item.profitmetrics))) {
                        detected.platforms.profitmetrics = true;
                    }

                    // Triplewhale
                    if (typeof window.triplewhale !== 'undefined' ||
                        typeof window.Triplewhale !== 'undefined' ||
                        (window.dataLayer && Array.isArray(window.dataLayer) &&
                         window.dataLayer.some(item => item && (item.triplewhale || item.Triplewhale)))) {
                        detected.platforms.triplewhale = true;
                    }

                    return detected;
                });

                // Merge network detection results
                networkPixels.meta.forEach(id => {
                    if (!results.meta.pixelIds.includes(id)) {
                        results.meta.pixelIds.push(id);
                        results.meta.found = true;
                        results.meta.methods.push('network-window-fbq');
                    }
                });

                networkPixels.tiktok.forEach(id => {
                    if (!results.tiktok.pixelIds.includes(id)) {
                        results.tiktok.pixelIds.push(id);
                        results.tiktok.found = true;
                        results.tiktok.methods.push('network-window-ttq');
                    }
                });

                networkPixels.linkedin.forEach(id => {
                    if (!results.linkedin.pixelIds.includes(id)) {
                        results.linkedin.pixelIds.push(id);
                        results.linkedin.found = true;
                        results.linkedin.methods.push('network-window-linkedin');
                    }
                });

                networkPixels.googleAds.forEach(id => {
                    if (!results.googleAds.conversionIds.includes(id)) {
                        results.googleAds.conversionIds.push(id);
                        results.googleAds.found = true;
                        results.googleAds.methods.push('network-window-gtag');
                    }
                });

                // Update primary IDs after network detection
                if (results.meta.pixelIds.length > 0 && !results.meta.pixelId) {
                    results.meta.pixelId = results.meta.pixelIds[0];
                }
                if (results.tiktok.pixelIds.length > 0 && !results.tiktok.pixelId) {
                    results.tiktok.pixelId = results.tiktok.pixelIds[0];
                }
                if (results.linkedin.pixelIds.length > 0 && !results.linkedin.pixelId) {
                    results.linkedin.pixelId = results.linkedin.pixelIds[0];
                }
                if (results.googleAds.conversionIds.length > 0 && !results.googleAds.conversionId) {
                    results.googleAds.conversionId = results.googleAds.conversionIds[0];
                }

                // Merge platform network detection results
                if (networkPixels.platforms.reaktion && !results.platforms.reaktion.found) {
                    results.platforms.reaktion.found = true;
                    results.platforms.reaktion.methods.push('network-window-object');
                }
                if (networkPixels.platforms.profitmetrics && !results.platforms.profitmetrics.found) {
                    results.platforms.profitmetrics.found = true;
                    results.platforms.profitmetrics.methods.push('network-window-object');
                }
                if (networkPixels.platforms.triplewhale && !results.platforms.triplewhale.found) {
                    results.platforms.triplewhale.found = true;
                    results.platforms.triplewhale.methods.push('network-window-object');
                }

                // Also check networkRequests parameter if provided
                if (networkRequests && networkRequests.length > 0) {
                    networkRequests.forEach(request => {
                        const url = request.url.toLowerCase();

                        // Reaktion detection via network requests
                        if (url.includes('reaktion.com') && !results.platforms.reaktion.found) {
                            results.platforms.reaktion.found = true;
                            results.platforms.reaktion.methods.push('network-request');
                        }

                        // Profitmetrics detection via network requests
                        if (url.includes('profitmetrics.io') && !results.platforms.profitmetrics.found) {
                            results.platforms.profitmetrics.found = true;
                            results.platforms.profitmetrics.methods.push('network-request');
                        }

                        // Triplewhale detection via network requests
                        if (url.includes('triplewhale.com') && !results.platforms.triplewhale.found) {
                            results.platforms.triplewhale.found = true;
                            results.platforms.triplewhale.methods.push('network-request');
                        }
                    });
                }
            } catch (error) {
                console.warn('Network pixel detection failed:', error.message);
            }
        }

    } catch (error) {
        console.error('Pixel scanning error:', error);
    }

    console.log('✅ Pixel and platform scanning completed:', {
        meta: results.meta.found ? results.meta.pixelIds : 'Not found',
        tiktok: results.tiktok.found ? results.tiktok.pixelIds : 'Not found',
        linkedin: results.linkedin.found ? results.linkedin.pixelIds : 'Not found',
        googleAds: results.googleAds.found ? results.googleAds.conversionIds : 'Not found',
        platforms: {
            reaktion: results.platforms.reaktion.found,
            profitmetrics: results.platforms.profitmetrics.found,
            triplewhale: results.platforms.triplewhale.found
        }
    });

    return results;
}
