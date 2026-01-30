"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

const SCAN_STEPS = [
    { id: 1, title: "Initializing Scanner", description: "Setting up scanning environment" },
    { id: 2, title: "Navigating to URL", description: "Connecting to the target website" },
    { id: 3, title: "Waiting for Page Load", description: "Allowing page to load completely" },
    { id: 4, title: "Accepting Cookies", description: "Automatically accepting cookie consent" },
    { id: 5, title: "Analyzing Performance", description: "Fetching Core Web Vitals and metrics" },
    { id: 6, title: "Scanning GTM Containers", description: "Detecting Google Tag Manager implementations" },
    { id: 7, title: "Tagstack Analysis", description: "Analyzing GTM container with Tagstack" },
    { id: 8, title: "Finalizing Results", description: "Preparing scan results" },
];

function ScanContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const url = searchParams.get("url");

    const [currentStep, setCurrentStep] = useState(0);
    const [isScanning, setIsScanning] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) {
            router.push("/");
            return;
        }

        startScanning(url);
    }, [url, router]);

    const startScanning = async (targetUrl) => {
        try {
            // Use Server-Sent Events for real-time progress updates
            console.log('Starting scan with streaming updates for URL:', targetUrl);

            // Start the scan with streaming enabled
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: targetUrl, stream: true }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            // Read the stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let scanResults = null;

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('Stream ended');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log('Received SSE data:', data);

                            if (data.type === 'progress') {
                                // Update UI step based on progress
                                setCurrentStep(data.step);
                                console.log(`Step ${data.step}: ${data.message}`);
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            } else if (data.type === 'complete') {
                                if (data.success) {
                                    scanResults = data.data;
                                    console.log('Scan completed successfully:', scanResults);

                                    // Step 8: Finalizing (UI-only step)
                                    setCurrentStep(8);

                                    // Store scan results in sessionStorage to avoid URL size limits
                                    // Generate a unique session ID (without "scan_" prefix to avoid duplication)
                                    const sessionId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
                                    const storageKey = `scan_${sessionId}`;
                                    
                                    console.log('📦 Storing scan results in sessionStorage');
                                    console.log('   SessionId:', sessionId);
                                    console.log('   Storage key:', storageKey);
                                    console.log('   Target URL:', targetUrl);
                                    const resultsJson = JSON.stringify(scanResults);
                                    console.log('   Scan results size:', resultsJson.length, 'characters');
                                    console.log('   GTM Info in results:', scanResults.gtmInfo ? 'Present' : 'Missing');
                                    console.log('   Tagstack Info in results:', scanResults.tagstackInfo ? 'Present' : 'Missing');
                                    
                                    try {
                                        sessionStorage.setItem(storageKey, resultsJson);
                                        
                                        // Verify it was stored
                                        const verify = sessionStorage.getItem(storageKey);
                                        if (verify) {
                                            console.log('✅ Scan results stored and verified in sessionStorage');
                                            console.log('Stored data size:', verify.length, 'characters');
                                        } else {
                                            console.error('❌ Failed to verify storage - data not found after storing');
                                        }
                                    } catch (error) {
                                        console.error('❌ Failed to store in sessionStorage:', error);
                                        if (error.name === 'QuotaExceededError') {
                                            console.error('SessionStorage quota exceeded. Data too large.');
                                        }
                                        // Fallback: try to use URL parameter (may fail for large data)
                                        console.warn('Falling back to URL parameter (may cause HTTP 431 for large data)');
                                    }

                                    // Wait a moment before redirecting to ensure storage is complete
                                    setTimeout(() => {
                                        // Only pass URL and session ID in the URL, not the entire data
                                        const resultsUrl = `/results?url=${encodeURIComponent(targetUrl)}&sessionId=${sessionId}`;
                                        console.log('🔀 Redirecting to results page');
                                        console.log('   SessionId in URL:', sessionId);
                                        console.log('   Results URL:', resultsUrl);
                                        
                                        // Double-check the data is still in sessionStorage before redirecting
                                        const verifyBeforeRedirect = sessionStorage.getItem(storageKey);
                                        if (verifyBeforeRedirect) {
                                            console.log('   ✅ Verified data still in sessionStorage before redirect');
                                        } else {
                                            console.error('   ❌ WARNING: Data NOT found in sessionStorage before redirect!');
                                        }
                                        
                                        router.push(resultsUrl);
                                    }, 1000); // Increased delay to ensure storage completes
                                } else {
                                    throw new Error(data.error || 'Scanning failed');
                                }
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE data:', parseError, 'Line:', line);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Scan error:', err);
            setError(err.message);
            setIsScanning(false);
        }
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-light text-foreground">Scan Error</h2>
                        <p className="text-sm text-foreground/60">
                            An error occurred while scanning the URL
                        </p>
                    </div>
                    <div className="p-4 border border-border/40 rounded bg-background">
                        <p className="text-sm text-foreground/70 font-mono">{error}</p>
                    </div>
                    <Button onClick={() => router.push("/")} className="w-full">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-16 px-6">
            <div className="max-w-7xl mx-auto space-y-12 grid grid-cols-12 gap-6">
                <span className="col-span-6">
                    {/* Header */}
                    <div className="space-y-3 text-center">
                        <h1 className="text-3xl font-light text-foreground">Scanning URL</h1>
                        <p className="text-sm text-foreground/50 font-mono">
                            {url}
                        </p>
                    </div>

                    {/* Loading Indicator */}
                    {isScanning && (
                        <div className="text-center space-y-3 pt-4">
                            <div className="inline-block">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
                            </div>
                            <p className="text-sm text-foreground/50">
                                Please wait while we scan the website...
                            </p>
                        </div>
                    )}
                </span>

                <span className="col-span-6">
                    {/* Steps */}
                    <div className="space-y-3">
                        {SCAN_STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className={`flex items-start gap-4 p-5 border rounded transition-all ${index < currentStep
                                    ? "border-foreground/20 bg-foreground/5"
                                    : index === currentStep - 1
                                        ? "border-foreground/40 bg-foreground/10"
                                        : "border-border/40 bg-background"
                                    }`}
                            >
                                {/* Step Number/Icon */}
                                <div className="flex-shrink-0 mt-0.5">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-normal transition-all ${index < currentStep
                                            ? "bg-foreground text-background"
                                            : index === currentStep - 1
                                                ? "bg-foreground text-background animate-pulse"
                                                : "bg-secondary text-foreground/40 border border-border/60"
                                            }`}
                                    >
                                        {index < currentStep ? (
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 space-y-1">
                                    <h3 className={`text-base font-normal ${index < currentStep
                                        ? "text-foreground"
                                        : index === currentStep - 1
                                            ? "text-foreground"
                                            : "text-foreground/60"
                                        }`}>
                                        {step.title}
                                    </h3>
                                    <p className={`text-sm ${index < currentStep
                                        ? "text-foreground/50"
                                        : index === currentStep - 1
                                            ? "text-foreground/50"
                                            : "text-foreground/40"
                                        }`}>
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </span>
            </div>
        </div>
    );
}

export default function ScanPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-foreground/20 border-t-foreground"></div>
            </div>
        }>
            <ScanContent />
        </Suspense>
    );
}
