/**
 * Direct Tagstack API Test (without API route)
 * Tests if HTTP 431 is caused by direct API call
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
    process.exit(1);
}

console.log('🔑 API Key:', TAGSTACK_API_KEY.substring(0, 8) + '...');
console.log('📏 API Key length:', TAGSTACK_API_KEY.length);
console.log('📏 Authorization header size:', Buffer.byteLength(`Bearer ${TAGSTACK_API_KEY}`, 'utf8'), 'bytes');

const url = `https://service.tagstack.io/api/scan?url=${encodeURIComponent(TEST_GTM_CONTAINER)}`;
const { URL } = require('url');
const urlObj = new URL(url);

console.log('\n📡 Making direct HTTPS request...');
console.log('URL:', url);

const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${TAGSTACK_API_KEY}`
    },
    timeout: 30000
};

// Log all headers
console.log('\n📋 Request Headers:');
Object.entries(options.headers).forEach(([key, value]) => {
    console.log(`  ${key}: ${value.substring(0, 20)}... (${Buffer.byteLength(value, 'utf8')} bytes)`);
});

const req = https.request(options, (response) => {
    console.log(`\n📊 Response Status: ${response.statusCode} ${response.statusMessage}`);
    
    if (response.statusCode === 431) {
        console.error('\n❌ HTTP 431: Request Header Fields Too Large');
        console.log('Response headers:', response.headers);
        process.exit(1);
    }

    let data = '';
    response.on('data', (chunk) => {
        data += chunk;
    });

    response.on('end', () => {
        try {
            const jsonData = JSON.parse(data);
            console.log('\n✅ Success! Response received');
            console.log('Response keys:', Object.keys(jsonData));
            if (jsonData.success) {
                console.log('✅ API call successful');
            } else {
                console.log('⚠️ API returned success: false');
                console.log('Message:', jsonData.message);
            }
        } catch (error) {
            console.error('❌ Failed to parse JSON:', error.message);
            console.log('Raw response (first 500 chars):', data.substring(0, 500));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    process.exit(1);
});

req.on('timeout', () => {
    console.error('❌ Request timeout');
    req.destroy();
    process.exit(1);
});

req.end();
