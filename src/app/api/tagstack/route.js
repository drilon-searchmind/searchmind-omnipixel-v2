import { NextResponse } from 'next/server';
import https from 'https';

/**
 * Proxy API route for Tagstack API calls
 * This avoids header size issues and keeps API keys server-side
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const containerId = searchParams.get('containerId');

        if (!containerId) {
            return NextResponse.json(
                { success: false, error: 'Container ID is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.TAGSTACK_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'TAGSTACK_API_KEY not configured' },
                { status: 500 }
            );
        }

        const tagstackUrl = `https://service.tagstack.io/api/scan?url=${encodeURIComponent(containerId)}`;

        console.log(`Calling Tagstack API for container: ${containerId}`);

        const result = await new Promise((resolve, reject) => {
            https.get(tagstackUrl, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'User-Agent': 'Omnipixel-Scanner/1.0'
                }
            }, (response) => {
                let data = '';

                // Handle HTTP 431 specifically
                if (response.statusCode === 431) {
                    response.on('data', () => {}); // Drain response
                    response.on('end', () => {
                        reject(new Error(`HTTP 431: Request header fields too large. This may indicate an issue with the API key format or request headers.`));
                    });
                    return;
                }

                // Handle other non-200 status codes
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
            }).on('error', (error) => {
                reject(error);
            });
        });

        return NextResponse.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Tagstack API proxy error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
