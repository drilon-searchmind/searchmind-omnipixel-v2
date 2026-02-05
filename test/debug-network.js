/**
 * Debug script to check if network request interception is working
 */

const { executeInitialScan } = require('../src/lib/scanner');

async function debugNetworkRequests() {
    console.log('🔍 Debugging network request interception...');

    let capturedRequests = [];

    // Override console.log to capture our network request logs
    const originalLog = console.log;
    console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('📡 Captured platform network request:')) {
            capturedRequests.push(args[1]); // The URL
        }
        if (args[0] && typeof args[0] === 'string' && args[0].includes('🔍 DEBUG: Platform-related request detected:')) {
            console.log('DEBUG CAPTURE:', args[1]);
        }
        originalLog.apply(console, args);
    };

    try {
        const results = await executeInitialScan('http://billigeautoruder.dk/', (step, message) => {
            console.log(`[${step}] ${message}`);
        });

        console.log('\n📊 RESULTS:');
        console.log('='.repeat(30));

        console.log('Captured network requests:', capturedRequests.length);
        capturedRequests.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });

        console.log('\nPlatform detection results:');
        if (results.pixelInfo?.platforms) {
            const platforms = results.pixelInfo.platforms;
            console.log(`Reaktion: ${platforms.reaktion.found} (${platforms.reaktion.methods.join(', ')})`);
            console.log(`Profitmetrics: ${platforms.profitmetrics.found} (${platforms.profitmetrics.methods.join(', ')})`);
            console.log(`Triplewhale: ${platforms.triplewhale.found} (${platforms.triplewhale.methods.join(', ')})`);
        }

        console.log('\nServer-side tracking:');
        console.log(`Detected: ${results.serverSideTracking}`);
        if (results.serverSideTrackingPlatform) {
            console.log(`Platform: ${results.serverSideTrackingPlatform}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }

    // Restore original console.log
    console.log = originalLog;
}

// Run the debug
debugNetworkRequests().catch(console.error);