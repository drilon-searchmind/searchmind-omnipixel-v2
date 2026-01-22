// Simple test script for the scan API
async function testAPI() {
    try {
        console.log('Testing scan API...');

        const response = await fetch('http://localhost:3000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: 'https://example.com' }),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testAPI();