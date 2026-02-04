/**
 * Tagstack API Integration
 * Fetches GTM container analysis from Tagstack API
 */

const TAGSTACK_API_URL = 'https://service.tagstack.io/api/scan';

/**
 * Fetch Tagstack data for a GTM container ID
 * @param {string} containerId - GTM container ID (e.g., GTM-XXXXXXX)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function fetchTagstackData(containerId) {
    const apiKey = process.env.TAGSTACK_API_KEY;

    if (!apiKey) {
        return {
            success: false,
            error: 'TAGSTACK_API_KEY not configured'
        };
    }

    if (!containerId) {
        return {
            success: false,
            error: 'Container ID is required'
        };
    }

    try {
        const url = `${TAGSTACK_API_URL}?url=${encodeURIComponent(containerId)}`;
        
        console.log(`Calling Tagstack API for container: ${containerId}`);
        
        // Use Node.js https module for server-side requests
        const https = require('https');
        const { URL } = require('url');
        
        const urlObj = new URL(url);
        
        // Use absolute minimal headers to avoid HTTP 431
        const authHeader = `Bearer ${apiKey}`;
        const authHeaderSize = Buffer.byteLength(authHeader, 'utf8');
        
        console.log(`Authorization header size: ${authHeaderSize} bytes`);
        
        if (authHeaderSize > 8000) {
            console.warn('Authorization header is unusually large, this may cause HTTP 431');
        }
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'Authorization': authHeader
            },
            timeout: 30000
        };

        const result = await new Promise((resolve, reject) => {
            const req = https.request(options, (response) => {
                let data = '';

                // Handle HTTP 431 specifically
                if (response.statusCode === 431) {
                    response.on('data', () => {}); // Drain response
                    response.on('end', () => {
                        reject(new Error(`HTTP 431: Request header fields too large. Auth header size: ${authHeaderSize} bytes. Please check API key format.`));
                    });
                    return;
                }

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    response.on('data', () => {}); // Drain response
                    response.on('end', () => {
                        reject(new Error(`Tagstack API returned ${response.statusCode}: ${response.statusMessage}`));
                    });
                    return;
                }

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        if (!result.success) {
            return {
                success: false,
                error: result.message || 'Tagstack API request failed'
            };
        }

        // Parse the message field if it's a JSON string
        // Tagstack API returns data in result.message as a JSON string
        let containers = {};
        if (result.message) {
            if (typeof result.message === 'string') {
                try {
                    containers = JSON.parse(result.message);
                } catch (e) {
                    console.warn('Failed to parse Tagstack message field:', e);
                    // Fallback: try to use containers directly if available
                    containers = result.containers || {};
                }
            } else if (typeof result.message === 'object') {
                // Sometimes message might already be an object
                containers = result.message;
            }
        } else if (result.containers) {
            containers = result.containers;
        }

        console.log(`Tagstack API success. Containers found: ${Object.keys(containers).length}`);

        return {
            success: true,
            data: {
                url: result.url,
                containers: containers,
                rawResponse: result
            }
        };

    } catch (error) {
        console.error('Tagstack API error:', error);
        return {
            success: false,
            error: `Failed to fetch Tagstack data: ${error.message}`
        };
    }
}

/**
 * Process Tagstack data to extract useful information
 * @param {object} tagstackData - Raw Tagstack API response
 * @returns {object} Processed data structure
 */
export function processTagstackData(tagstackData) {
    if (!tagstackData || !tagstackData.containers) {
        return {
            gtmContainers: [],
            ga4Streams: [],
            consentModeV2: false,
            cmp: null,
            consentDefaults: null,
            serverSideTracking: false,
            detectedIds: {
                ga4: [],
                facebookPixel: [],
                googleAds: [],
                tiktokPixel: [],
                linkedinPixel: []
            },
            containerStats: {},
            tags: [],
            variables: [],
            triggers: []
        };
    }

    const containers = tagstackData.containers;
    const gtmContainers = [];
    const ga4Streams = [];
    const detectedIds = {
        ga4: [],
        facebookPixel: [],
        googleAds: [],
        tiktokPixel: [],
        linkedinPixel: []
    };
    let consentModeV2 = false;
    let cmp = null;
    let consentDefaults = null;
    let serverSideTracking = false; // Track server-side GTM/GA4
    const containerStats = {};
    const allTags = [];
    const allVariables = [];
    const allTriggers = [];

    Object.entries(containers).forEach(([containerId, containerData]) => {
        // Check for server-side tracking indicators FIRST (before entity type check)
        // Tagstack API returns ga4ServerSide as a property on containers
        if (containerData.ga4ServerSide === true) {
            serverSideTracking = true;
            console.log(`✅ Server-side tracking detected via ga4ServerSide property: ${containerId} (${containerData.entityType})`);
        }
        
        if (containerData.entityType === 'GTM Container') {
            gtmContainers.push({
                id: containerId,
                ...containerData
            });

            // Extract Consent Mode V2 status
            if (containerData.consentMode === true) {
                consentModeV2 = true;
            }

            // Extract CMP status
            if (containerData.cmp !== null && containerData.cmp !== undefined) {
                cmp = containerData.cmp;
            }

            // Extract consent defaults
            if (containerData.consentDefault) {
                consentDefaults = containerData.consentDefault;
            }

            // Extract container statistics
            containerStats[containerId] = {
                tags: containerData.tags?.length || 0,
                activeTags: containerData.tags?.filter(t => !t.paused).length || 0,
                pausedTags: containerData.tags?.filter(t => t.paused).length || 0,
                variables: containerData.variables?.length || 0,
                triggers: containerData.triggers?.length || 0
            };

            // Collect tags, variables, triggers
            if (containerData.tags) {
                allTags.push(...containerData.tags.map(tag => ({
                    ...tag,
                    containerId
                })));
            }
            if (containerData.variables) {
                allVariables.push(...containerData.variables.map(v => ({
                    ...v,
                    containerId
                })));
            }
            if (containerData.triggers) {
                allTriggers.push(...containerData.triggers.map(t => ({
                    ...t,
                    containerId
                })));
            }

            // Extract IDs from tags
            if (containerData.tags) {
                containerData.tags.forEach(tag => {
                    // Helper function to extract parameter value (handles arrays and nested structures)
                    const getParamValue = (key) => {
                        const param = tag.parameters?.find(p => p.key === key);
                        if (!param) return null;
                        
                        let value = param.parameterValue;
                        // Handle array/template structures
                        if (Array.isArray(value)) {
                            // Look for string values in the array
                            const stringValue = value.find(v => typeof v === 'string');
                            if (stringValue) value = stringValue;
                            // Handle template structures like ["template", "AW-", ...]
                            if (value.length > 1 && typeof value[1] === 'string') {
                                value = value[1];
                            }
                        }
                        return value;
                    };

                    // Extract GA4 Measurement IDs
                    if (tag.type === 'gaawe' || tag.name?.includes('Google Analytics 4') || tag.name?.includes('GA4')) {
                        let measurementId = getParamValue('vtp_measurementIdOverride') || getParamValue('measurementId');
                        
                        // If it's an array, try to extract from it
                        if (Array.isArray(measurementId)) {
                            measurementId = measurementId.find(v => typeof v === 'string' && v.startsWith('G-'));
                        }
                        
                        if (measurementId && typeof measurementId === 'string' && measurementId.startsWith('G-')) {
                            if (!detectedIds.ga4.includes(measurementId)) {
                                detectedIds.ga4.push(measurementId);
                            }
                        }
                    }

                    // Extract Google Ads Conversion IDs
                    if (tag.type === 'awct' || tag.type === 'googtag' || tag.name?.includes('Google Ads')) {
                        let conversionId = getParamValue('vtp_tagId') || getParamValue('tagId');
                        
                        // Handle template structures
                        if (Array.isArray(conversionId)) {
                            // Look for AW- pattern in array
                            const awMatch = conversionId.find(v => typeof v === 'string' && v.includes('AW-'));
                            if (awMatch) conversionId = awMatch;
                        }
                        
                        if (conversionId && typeof conversionId === 'string') {
                            const match = conversionId.match(/AW-([A-Z0-9]+)/);
                            if (match && !detectedIds.googleAds.includes(match[0])) {
                                detectedIds.googleAds.push(match[0]);
                            }
                        }
                    }

                    // Extract Facebook Pixel IDs (if present in tag parameters)
                    // Also check for Facebook/Meta tags even without pixel ID (custom templates)
                    const isFacebookTag = tag.name?.toLowerCase().includes('facebook') || 
                                         tag.name?.toLowerCase().includes('meta') || 
                                         tag.type?.toLowerCase().includes('facebook') ||
                                         tag.type?.toLowerCase().includes('meta') ||
                                         tag.templateId?.toLowerCase().includes('facebook') ||
                                         tag.templateId?.toLowerCase().includes('meta');
                    
                    if (isFacebookTag) {
                        const pixelId = getParamValue('pixelId') || getParamValue('id') || getParamValue('pixel_id');
                        if (pixelId && typeof pixelId === 'string' && /^\d+$/.test(pixelId)) {
                            if (!detectedIds.facebookPixel.includes(pixelId)) {
                                detectedIds.facebookPixel.push(pixelId);
                            }
                        }
                        // Note: Even if no pixel ID found, the tag itself indicates Facebook/Meta presence
                        // This will be handled in the scanner by checking tags array
                    }

                    // Extract TikTok Pixel IDs
                    if (tag.name?.includes('TikTok') || tag.type?.includes('tiktok')) {
                        const pixelId = getParamValue('pixelId') || getParamValue('id');
                        if (pixelId && typeof pixelId === 'string' && /^\d+$/.test(pixelId)) {
                            if (!detectedIds.tiktokPixel.includes(pixelId)) {
                                detectedIds.tiktokPixel.push(pixelId);
                            }
                        }
                    }

                    // Extract LinkedIn Insight Tag IDs
                    if (tag.name?.includes('LinkedIn') || tag.type?.includes('linkedin')) {
                        const pixelId = getParamValue('partnerId') || getParamValue('pid') || getParamValue('id');
                        if (pixelId && typeof pixelId === 'string' && /^\d+$/.test(pixelId)) {
                            if (!detectedIds.linkedinPixel.includes(pixelId)) {
                                detectedIds.linkedinPixel.push(pixelId);
                            }
                        }
                    }
                });
            }

        } else if (containerData.entityType === 'GA4 Stream') {
            ga4Streams.push({
                id: containerId,
                ...containerData
            });

            // Add GA4 ID to detected IDs
            if (!detectedIds.ga4.includes(containerId)) {
                detectedIds.ga4.push(containerId);
            }
            
            // Check for server-side tracking indicators
            // Tagstack API returns ga4ServerSide as a boolean field
            if (containerData.ga4ServerSide === true) {
                serverSideTracking = true;
                console.log(`✅ Server-side tracking detected in GA4 Stream: ${containerId}`);
            }
            // Also check for other server-side indicators
            if (containerData.measurementProtocolSecret || containerData.serverContainerUrl) {
                serverSideTracking = true;
                console.log(`✅ Server-side tracking detected via measurementProtocolSecret/serverContainerUrl: ${containerId}`);
            }
        }
    });
    
    // Also check GTM containers for server-side indicators
    gtmContainers.forEach(container => {
        // Check if container has server-side tags or server container configuration
        if (container.serverContainerUrl || container.serverContainerName) {
            serverSideTracking = true;
            console.log(`✅ Server-side tracking detected via serverContainerUrl/serverContainerName: ${container.id}`);
        }
        // Check for ga4ServerSide property on GTM container (Tagstack might set this)
        if (container.ga4ServerSide === true) {
            serverSideTracking = true;
            console.log(`✅ Server-side tracking detected via ga4ServerSide on GTM container: ${container.id}`);
        }
        // Check tags for server-side GTM tags
        if (container.tags) {
            const hasServerSideTags = container.tags.some(tag => 
                tag.type === 'sgtm' || 
                tag.name?.toLowerCase().includes('server-side') ||
                tag.name?.toLowerCase().includes('server side') ||
                tag.type?.includes('server')
            );
            if (hasServerSideTags) {
                serverSideTracking = true;
                console.log(`✅ Server-side tracking detected via GTM tags: ${container.id}`);
            }
        }
    });

    return {
        gtmContainers,
        ga4Streams,
        consentModeV2,
        cmp,
        consentDefaults,
        serverSideTracking,
        detectedIds,
        containerStats,
        tags: allTags,
        variables: allVariables,
        triggers: allTriggers
    };
}
