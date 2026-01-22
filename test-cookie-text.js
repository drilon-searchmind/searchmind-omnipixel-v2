// Test the new text-based cookie acceptance
async function testCookieAcceptance() {
    try {
        console.log('Testing new text-based cookie acceptance...');

        const response = await fetch('http://localhost:3000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: 'https://pompdelux.dk/' }),
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('Cookie acceptance results:');
            console.log('Cookie Info:', JSON.stringify(data.data.cookieInfo, null, 2));
            console.log('Page has cookies:', data.data.pageInfo.cookies > 0 ? 'YES' : 'NO');

            // Show steps
            console.log('\nSteps completed:');
            data.data.steps.forEach(step => {
                console.log(`Step ${step.id}: ${step.result.message}`);
            });
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testCookieAcceptance();