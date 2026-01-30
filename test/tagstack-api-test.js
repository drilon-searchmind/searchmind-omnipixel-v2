/**
 * Tagstack API Test Script
 * Tests the Tagstack API with a GTM container ID
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env file manually
function loadEnvFile() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                if (key && valueParts.length > 0) {
                    envVars[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return envVars;
    } catch (error) {
        console.error('Failed to read .env file:', error.message);
        return {};
    }
}

const envVars = loadEnvFile();
const TAGSTACK_API_KEY = envVars.TAGSTACK_API_KEY || process.env.TAGSTACK_API_KEY;
const TEST_GTM_CONTAINER = 'GTM-WZT55FSK';

if (!TAGSTACK_API_KEY) {
    console.error('❌ TAGSTACK_API_KEY not found in .env file');
    console.error('Please ensure TAGSTACK_API_KEY is set in .env');
    process.exit(1);
}

/**
 * Make a request to Tagstack API
 */
function callTagstackAPI(containerId) {
    return new Promise((resolve, reject) => {
        const url = `https://service.tagstack.io/api/scan?url=${containerId}`;
        
        console.log(`📡 Calling Tagstack API: ${url}`);
        console.log(`🔑 Using API Key: ${TAGSTACK_API_KEY.substring(0, 8)}...`);

        const options = {
            headers: {
                'Authorization': `Bearer ${TAGSTACK_API_KEY}`,
                'User-Agent': 'Omnipixel-Scanner/1.0'
            }
        };

        https.get(url, options, (response) => {
            let data = '';

            // Log response status
            console.log(`\n📊 Response Status: ${response.statusCode} ${response.statusMessage}`);
            console.log(`📋 Response Headers:`, JSON.stringify(response.headers, null, 2));

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: response.statusCode,
                        headers: response.headers,
                        data: jsonData
                    });
                } catch (error) {
                    console.error('❌ Failed to parse JSON response:', error.message);
                    console.log('Raw response:', data);
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            console.error('❌ Request error:', error.message);
            reject(error);
        });
    });
}

/**
 * Analyze the returned data structure
 */
function analyzeResponse(data) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESPONSE ANALYSIS');
    console.log('='.repeat(80));
    
    console.log('\n✅ Success:', data.success);
    console.log('🔗 URL:', data.url);
    
    // Parse the message field if it's a JSON string
    let containers = {};
    if (data.message && typeof data.message === 'string') {
        try {
            containers = JSON.parse(data.message);
            console.log('\n📦 Parsed containers from message field');
        } catch (e) {
            console.log('\n⚠️  Message field is not valid JSON, using data.containers');
            containers = data.containers || {};
        }
    } else if (data.containers) {
        containers = data.containers;
    }
    
    if (Object.keys(containers).length > 0) {
        console.log('\n📦 Containers Found:', Object.keys(containers).length);
        console.log('Container IDs:', Object.keys(containers));
        
        // Analyze each container
        Object.entries(containers).forEach(([containerId, containerData]) => {
            console.log(`\n${'─'.repeat(78)}`);
            console.log(`📦 Container: ${containerId}`);
            console.log('   Entity Type:', containerData.entityType);
            
            if (containerData.entityType === 'GTM Container') {
                console.log('\n   🔐 Consent & Privacy:');
                if (containerData.cmp !== null && containerData.cmp !== undefined) {
                    console.log('      CMP:', containerData.cmp);
                }
                if (containerData.consentMode !== undefined) {
                    console.log('      Consent Mode V2:', containerData.consentMode ? '✅ Enabled' : '❌ Disabled');
                }
                if (containerData.consentDefault) {
                    console.log('      Consent Defaults:', JSON.stringify(containerData.consentDefault, null, 2));
                }
                
                console.log('\n   📊 Container Statistics:');
                if (containerData.variables) {
                    console.log('      Variables:', containerData.variables.length);
                }
                if (containerData.tags) {
                    console.log('      Tags:', containerData.tags.length);
                    // Count active vs paused tags
                    const activeTags = containerData.tags.filter(t => !t.paused).length;
                    const pausedTags = containerData.tags.filter(t => t.paused).length;
                    console.log('         Active:', activeTags);
                    console.log('         Paused:', pausedTags);
                }
                if (containerData.triggers) {
                    console.log('      Triggers:', containerData.triggers.length);
                }
            } else if (containerData.entityType === 'GA4 Stream') {
                console.log('\n   📈 GA4 Stream Features:');
                if (containerData.enhancedMeasurement) {
                    console.log('      Enhanced Measurement:', containerData.enhancedMeasurement.length, 'events');
                    containerData.enhancedMeasurement.forEach(em => {
                        console.log(`         - ${em.name} (${em.type})`);
                    });
                }
                if (containerData.linking) {
                    console.log('      Linking:', containerData.linking.length, 'integrations');
                    containerData.linking.forEach(link => {
                        console.log(`         - ${link.name} (${link.type})`);
                    });
                }
            }
        });
    }
    
    // Show key data points for integration
    console.log('\n' + '='.repeat(80));
    console.log('💡 KEY DATA POINTS FOR INTEGRATION');
    console.log('='.repeat(80));
    
    const gtmContainers = Object.entries(containers).filter(([id, data]) => 
        data.entityType === 'GTM Container'
    );
    
    if (gtmContainers.length > 0) {
        console.log('\n✅ GTM Containers detected:', gtmContainers.length);
        gtmContainers.forEach(([id, data]) => {
            console.log(`\n   ${id}:`);
            console.log('      - Consent Mode V2:', data.consentMode ? 'Enabled' : 'Disabled');
            console.log('      - CMP:', data.cmp || 'Not detected');
            console.log('      - Tags:', data.tags?.length || 0);
            console.log('      - Variables:', data.variables?.length || 0);
        });
    }
    
    const ga4Streams = Object.entries(containers).filter(([id, data]) => 
        data.entityType === 'GA4 Stream'
    );
    
    if (ga4Streams.length > 0) {
        console.log('\n📊 GA4 Streams detected:', ga4Streams.length);
        ga4Streams.forEach(([id, data]) => {
            console.log(`   ${id}:`);
            console.log('      - Enhanced Measurement:', data.enhancedMeasurement?.length || 0, 'events');
        });
    }
}

/**
 * Main test function
 */
async function testTagstackAPI() {
    try {
        console.log('🧪 Tagstack API Test');
        console.log('='.repeat(80));
        console.log(`Testing with GTM Container: ${TEST_GTM_CONTAINER}`);
        console.log('='.repeat(80));

        const result = await callTagstackAPI(TEST_GTM_CONTAINER);

        if (result.statusCode === 200) {
            console.log('\n✅ API call successful!');
            analyzeResponse(result.data);
            
            // Suggest how to use this data
            console.log('\n' + '='.repeat(80));
            console.log('💡 SUGGESTIONS FOR INTEGRATION');
            console.log('='.repeat(80));
            console.log(`
Based on the response, here's how we can use this data:

1. Container Detection:
   - Use 'containers' object to get all detected containers
   - Each container has metadata (entityType, cmp, consentMode, ga4ServerSide)

2. Consent Mode Detection:
   - Check 'consentMode' property to see if Consent Mode V2 is enabled
   - This can replace our current mock data

3. CMP Detection:
   - Use 'cmp' property to identify Consent Management Platform
   - Can enhance our cookie detection results

4. GA4 Server-Side Detection:
   - Check 'ga4ServerSide' to see if server-side tracking is enabled
   - Can update our server-side tracking status

5. Integration Points:
   - Call this API after GTM detection (Step 6)
   - Store results in results.tagstackInfo
   - Update ScoreOverview component with real Consent Mode V2 status
   - Update PrivacyCookies component with CMP information
   - Update Server-side Tracking status
            `);
        } else {
            console.error(`\n❌ API call failed with status ${result.statusCode}`);
            console.log('Response:', result.data);
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testTagstackAPI();
