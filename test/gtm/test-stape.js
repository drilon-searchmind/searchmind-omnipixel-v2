/**
 * Test Stape script GTM extraction
 */

const https = require('https');

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

async function testStapeScript() {
    const stapeUrl = 'https://sp.stapecdn.com/widget/script_pixel?shop_id=85221310798';

    try {
        console.log(`📡 Fetching Stape script: ${stapeUrl}`);
        const content = await fetchUrl(stapeUrl);
        console.log(`📄 Script length: ${content.length} characters`);

        // Look for GTM_ID
        const gtmIdMatch = content.match(/const\s+GTM_ID\s*=\s*['"]([^'"]+)['"]/);
        if (gtmIdMatch) {
            const gtmId = gtmIdMatch[1];
            console.log(`\n🎯 Found GTM_ID: ${gtmId}`);
            console.log(`🔄 Converted to: GTM-${gtmId}`);
            console.log(`\n✅ SUCCESS! GTM Container: GTM-${gtmId}`);
            return `GTM-${gtmId}`;
        } else {
            console.log('\n❌ GTM_ID not found in script');
            
            // Show preview of script
            console.log('\n📋 Script preview (first 500 chars):');
            console.log(content.substring(0, 500));
            
            // Check for any GTM references
            const gtmMatches = content.match(/GTM-[A-Z0-9]{6,}/g);
            if (gtmMatches) {
                console.log('\nℹ️  Found GTM references:');
                gtmMatches.forEach(match => console.log(`   ${match}`));
            }
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testStapeScript();