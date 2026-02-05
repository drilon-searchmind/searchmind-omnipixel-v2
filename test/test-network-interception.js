/**
 * Test network request interception in the scanner
 * This tests that the scanner can capture network requests during page load
 */

const { executeInitialScan } = require('../src/lib/scanner');

async function testNetworkInterception() {
    console.log('🧪 Testing network request interception in scanner');
    console.log('=' .repeat(55));

    const testUrl = 'http://billigeautoruder.dk/';

    console.log(`Testing with URL: ${testUrl}`);
    console.log('This should capture Reaktion network requests...');

    const progressCallback = (step, message, data) => {
        console.log(`[${step}] ${message}`);

        // Log captured network requests
        if (data && data.pixelInfo) {
            console.log('Pixel scan data received');
        }
    };

    try {
        const results = await executeInitialScan(testUrl, progressCallback);

        console.log('\n📊 SCAN RESULTS:');
        console.log('=' .repeat(30));

        console.log(`Scan success: ${results.success}`);

        if (results.error) {
            console.log(`Error: ${results.error}`);
        }

        // Check dataLayer
        if (results.dataLayer) {
            console.log(`✅ DataLayer found: ${results.dataLayer.length} events`);
        } else {
            console.log('❌ DataLayer not found');
        }

        // Check platform detection
        if (results.pixelInfo && results.pixelInfo.platforms) {
            const platforms = results.pixelInfo.platforms;
            console.log('\n🏢 PLATFORM DETECTION:');
            console.log(`Reaktion: ${platforms.reaktion.found ? '✅' : '❌'} (${platforms.reaktion.methods.join(', ')})`);
            console.log(`Profitmetrics: ${platforms.profitmetrics.found ? '✅' : '❌'} (${platforms.profitmetrics.methods.join(', ')})`);
            console.log(`Triplewhale: ${platforms.triplewhale.found ? '✅' : '❌'} (${platforms.triplewhale.methods.join(', ')})`);

            if (platforms.reaktion.found) {
                console.log('🎉 SUCCESS: Reaktion detected on billigeautoruder.dk!');
            } else {
                console.log('❌ FAILED: Reaktion not detected');

                // Debug: Check if network requests were captured
                console.log('\n🔍 DEBUG: Checking scan steps for network request info...');
                results.steps.forEach(step => {
                    if (step.result && step.result.pixelResult) {
                        console.log(`Step ${step.id}: Pixel scan completed`);
                    }
                });
            }
        } else {
            console.log('❌ No platform info in results');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testNetworkInterception().then(() => {
    console.log('\n🏁 Network interception test completed');
}).catch(console.error);