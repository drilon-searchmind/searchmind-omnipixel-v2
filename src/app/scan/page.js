"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";

const SCAN_STEPS = [
    { id: 1, title: "Initializing Scanner", description: "Setting up scanning environment" },
    { id: 2, title: "Navigating to URL", description: "Connecting to the target website" },
    { id: 3, title: "Waiting for Page Load", description: "Allowing page to load completely" },
    { id: 4, title: "Accepting Cookies", description: "Automatically accepting cookie consent" },
    { id: 5, title: "Analyzing Tracking Data", description: "Scanning for tracking pixels and scripts" },
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
            // Step 1: Initialize (simulate)
            setCurrentStep(1);
            await delay(500);

            // Step 2: Navigate to URL (call API)
            setCurrentStep(2);

            let response;
            try {
                console.log('Making API call to /api/scan with URL:', targetUrl);
                response = await fetch('/api/scan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: targetUrl }),
                });

                console.log('API response received:', response);
                console.log('API response status:', response.status);
                console.log('API response ok:', response.ok);
                console.log('API response type:', typeof response);
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw new Error(`Network error: ${fetchError.message}`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API returned ${response.status}: ${errorText}`);
            }

            let scanResults;
            try {
                scanResults = await response.json();
                console.log('Scan results:', scanResults);
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                throw new Error(`Failed to parse API response: ${jsonError.message}`);
            }

            if (!scanResults.success) {
                throw new Error(scanResults.data?.error || scanResults.message || 'Scanning failed');
            }

            // Steps 2-4 completed via API (includes cookie acceptance)
            // Add visual progression for remaining steps
            setCurrentStep(3);
            await delay(500);
            setCurrentStep(4);
            await delay(500);
            setCurrentStep(5);

            // Step 6: Analyze tracking data (simulate)
            await delay(2000);

            // Complete - redirect to results with scan data
            const resultsUrl = `/results?url=${encodeURIComponent(targetUrl)}&scanData=${encodeURIComponent(JSON.stringify(scanResults.data))}`;
            router.push(resultsUrl);

        } catch (err) {
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
            <div className="container max-w-3xl mx-auto space-y-12">
                {/* Header */}
                <div className="space-y-3 text-center">
                    <h1 className="text-3xl font-light text-foreground">Scanning URL</h1>
                    <p className="text-sm text-foreground/50 font-mono">
                        {url}
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                    {SCAN_STEPS.map((step, index) => (
                        <div
                            key={step.id}
                            className={`flex items-start gap-4 p-5 border rounded transition-all ${
                                index < currentStep
                                    ? "border-foreground/20 bg-foreground/5"
                                    : index === currentStep - 1
                                    ? "border-foreground/40 bg-foreground/10"
                                    : "border-border/40 bg-background"
                            }`}
                        >
                            {/* Step Number/Icon */}
                            <div className="flex-shrink-0 mt-0.5">
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-normal transition-all ${
                                        index < currentStep
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
                                <h3 className={`text-base font-normal ${
                                    index < currentStep 
                                        ? "text-foreground" 
                                        : index === currentStep - 1 
                                        ? "text-foreground" 
                                        : "text-foreground/60"
                                }`}>
                                    {step.title}
                                </h3>
                                <p className={`text-sm ${
                                    index < currentStep 
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
