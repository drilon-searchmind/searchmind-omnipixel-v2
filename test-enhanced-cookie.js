// Test script for enhanced cookie detection
const { executeInitialScan } = require('./src/lib/scanner.js');

async function testEnhancedCookieDetection() {
    console.log('Testing enhanced cookie detection and CMP identification...');

    try {
        const result = await executeInitialScan('https://pompdelux.dk', (step, msg) => {
            console.log(`Step ${step}: ${msg}`);
        });

        console.log('\n=== COOKIE ANALYSIS RESULTS ===');
        console.log('Success:', result.success);

        if (result.cookieInfo) {
            console.log('\n--- Cookie Information ---');
            console.log('Provider:', result.cookieInfo.provider);
            console.log('Accepted:', result.cookieInfo.accepted);
            console.log('Method:', result.cookieInfo.method);
            console.log('Message:', result.cookieInfo.message);

            if (result.cookieInfo.cmp) {
                console.log('\n--- CMP Details ---');
                console.log('Name:', result.cookieInfo.cmp.name);
                console.log('Confidence:', result.cookieInfo.cmp.confidence);
                console.log('Elements:', result.cookieInfo.cmp.elements);
                console.log('Scripts:', result.cookieInfo.cmp.scripts);
                if (result.cookieInfo.cmp.version) {
                    console.log('Version:', result.cookieInfo.cmp.version);
                }
            }

            if (result.cookieInfo.cookies) {
                console.log('\n--- Cookie Statistics ---');
                console.log('Total Cookies:', result.cookieInfo.cookies.count);
                console.log('Cookie Domains:', result.cookieInfo.cookies.domains);
                console.log('Cookie Keys:', result.cookieInfo.cookies.keys);
            }

            if (result.cookieInfo.element) {
                console.log('\n--- Button Details ---');
                console.log('Tag:', result.cookieInfo.element.tagName);
                console.log('ID:', result.cookieInfo.element.id || 'none');
                console.log('Class:', result.cookieInfo.element.className || 'none');
                console.log('Text:', `"${result.cookieInfo.element.text}"`);
            }
        } else {
            console.log('No cookie information available');
        }

    } catch (error) {
        console.error('Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testEnhancedCookieDetection();