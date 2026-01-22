import { NextResponse } from 'next/server';
import { executeInitialScan } from '@/lib/scanner';

export async function POST(request) {
    try {
        console.log('Scan API called with request:', request.method, request.url);

        let body;
        try {
            body = await request.json();
            console.log('Request body:', body);
        } catch (parseError) {
            console.error('Failed to parse request body:', parseError);
            return NextResponse.json(
                { success: false, message: 'Invalid JSON in request body' },
                { status: 400 }
            );
        }

        const { url } = body;

        if (!url) {
            console.log('No URL provided in request');
            return NextResponse.json(
                { success: false, message: 'URL is required' },
                { status: 400 }
            );
        }

        console.log(`URL received: ${url}`);

        // Validate URL format
        try {
            new URL(url);
            console.log(`URL validation passed: ${url}`);
        } catch (urlError) {
            console.log(`URL validation failed: ${url}`, urlError.message);
            return NextResponse.json(
                { success: false, message: 'Invalid URL format' },
                { status: 400 }
            );
        }

        console.log(`Starting scan for URL: ${url}`);

        // Execute the scanning process
        const scanResults = await executeInitialScan(url, (step, message) => {
            console.log(`Step ${step}: ${message}`);
        });

        console.log('Scan completed:', scanResults.success ? 'success' : 'failed');

        if (!scanResults.success) {
            return NextResponse.json(
                { success: false, message: scanResults.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: scanResults
        });

    } catch (error) {
        console.error('Scan API error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}