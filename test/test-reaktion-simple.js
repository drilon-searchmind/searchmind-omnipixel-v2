/**
 * Simple test for Reaktion detection
 * Tests the pixel scanner with mock data to verify Reaktion detection works
 */

const { scanForPixels } = require('../src/lib/pixel-scanner');

async function testReaktionDetection() {
    console.log('🧪 Testing Reaktion detection with pixel scanner');
    console.log('=' .repeat(50));

    // Test 1: HTML pattern detection
    console.log('\n📄 Test 1: HTML Pattern Detection');
    console.log('-'.repeat(30));

    const mockHtml = `
        <html>
        <head>
            <script src="https://app.reaktion.com/assets/tracking/store-shopify.js?s=vvGyDaRVktgyOav2bRPUJjN7t4FSCQXk"></script>
            <script>
                // Some other tracking code
                window.dataLayer = [];
            </script>
        </head>
        <body>
            <h1>Test Site</h1>
        </body>
        </html>
    `;

    const mockNetworkRequests = [
        {
            url: 'https://api.reaktion.com/tracking/stores/vvGyDaRVktgyOav2bRPUJjN7t4FSCQXk/sessions/KboAKwmSKv8DWeVIQEN0D0GP7m2TbdX9wnyH1wwaAyoIVqbVworD8N9N2TNd61di/conversions',
            method: 'POST',
            resourceType: 'fetch',
            timestamp: Date.now()
        }
    ];

    const pageEvaluate = async (fn) => {
        // Mock page evaluation - return empty for this test
        return null;
    };

    try {
        const results = await scanForPixels(mockHtml, 'http://test.com', pageEvaluate, mockNetworkRequests);

        console.log('Results:', {
            reaktion: {
                found: results.platforms.reaktion.found,
                methods: results.platforms.reaktion.methods
            }
        });

        if (results.platforms.reaktion.found) {
            console.log('✅ SUCCESS: Reaktion detected!');
            console.log('Detection methods:', results.platforms.reaktion.methods);
        } else {
            console.log('❌ FAILED: Reaktion not detected');

            // Debug information
            console.log('\n🔍 DEBUG INFO:');
            console.log('HTML contains Reaktion script:', mockHtml.includes('reaktion.com'));
            console.log('Network requests captured:', mockNetworkRequests.length);

            // Test individual patterns
            const reaktionPatterns = [
                /app\.reaktion\.com/i,
                /reaktion\.com\/scripts/i,
                /reaktion\.com\/assets/i,
                /reaktion.*analytics/i,
                /window\.reaktion/i,
                /reaktion.*tracking/i,
                /reaktion.*store/i
            ];

            console.log('Testing patterns:');
            reaktionPatterns.forEach((pattern, index) => {
                const match = pattern.test(mockHtml);
                console.log(`  Pattern ${index + 1} (${pattern}): ${match ? '✅' : '❌'}`);
            });
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }

    // Test 2: Network-only detection
    console.log('\n🌐 Test 2: Network-Only Detection');
    console.log('-'.repeat(30));

    const emptyHtml = '<html><body><h1>Test</h1></body></html>';
    const networkOnlyRequests = [
        {
            url: 'https://api.reaktion.com/tracking/stores/abc123/sessions/def456/conversions',
            method: 'POST',
            resourceType: 'fetch',
            timestamp: Date.now()
        },
        {
            url: 'https://app.reaktion.com/assets/tracking/store-shopify.js?s=xyz789',
            method: 'GET',
            resourceType: 'script',
            timestamp: Date.now()
        }
    ];

    try {
        const results2 = await scanForPixels(emptyHtml, 'http://test2.com', pageEvaluate, networkOnlyRequests);

        console.log('Results:', {
            reaktion: {
                found: results2.platforms.reaktion.found,
                methods: results2.platforms.reaktion.methods
            }
        });

        if (results2.platforms.reaktion.found) {
            console.log('✅ SUCCESS: Reaktion detected via network only!');
            console.log('Detection methods:', results2.platforms.reaktion.methods);
        } else {
            console.log('❌ FAILED: Reaktion not detected via network');
        }

    } catch (error) {
        console.error('❌ Network test failed with error:', error);
    }
}

// Run the test
testReaktionDetection().then(() => {
    console.log('\n🏁 Test completed');
}).catch(console.error);