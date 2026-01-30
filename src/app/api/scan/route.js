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

        // Check if client wants streaming updates
        const useStreaming = body.stream === true;

        if (useStreaming) {
            // Use Server-Sent Events for real-time progress
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    const sendProgress = (step, message) => {
                        const data = JSON.stringify({ type: 'progress', step, message });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    };

                    const sendError = (error) => {
                        const data = JSON.stringify({ type: 'error', message: error.message });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    };

                    try {
                        const scanResults = await executeInitialScan(url, sendProgress);

                        if (!scanResults.success) {
                            sendError(new Error(scanResults.error));
                            const data = JSON.stringify({ type: 'complete', success: false, error: scanResults.error });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        } else {
                            const data = JSON.stringify({ type: 'complete', success: true, data: scanResults });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        }
                    } catch (error) {
                        sendError(error);
                        const data = JSON.stringify({ type: 'complete', success: false, error: error.message });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    } finally {
                        controller.close();
                    }
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            // Standard non-streaming response
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
        }

    } catch (error) {
        console.error('Scan API error:', error);
        console.error('Error stack:', error.stack);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}