"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function UrlScanner({ className, onSubmit }) {
    const [url, setUrl] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasBeenFocused, setHasBeenFocused] = React.useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasAutoScanned = React.useRef(false);

    const startScan = React.useCallback(async (urlToScan) => {
        if (!urlToScan?.trim()) return;

        setIsLoading(true);
        try {
            // Get referrer and customerId from URL params to pass through
            const referrer = searchParams.get("referrer");
            const customerId = searchParams.get("customerId");
            
            // Build scan URL with all necessary parameters
            const params = new URLSearchParams();
            params.set("url", urlToScan.trim());
            if (referrer) params.set("referrer", referrer);
            if (customerId) params.set("customerId", customerId);
            
            router.push(`/scan?${params.toString()}`);

            // If custom onSubmit is provided, call it too
            if (onSubmit) {
                await onSubmit(urlToScan);
            }
        } catch (error) {
            console.error("Error scanning URL:", error);
        } finally {
            setIsLoading(false);
        }
    }, [router, onSubmit, searchParams]);

    // Check for customerUrl in query params and auto-start scan
    React.useEffect(() => {
        const customerUrl = searchParams.get("customerUrl");
        if (customerUrl && !hasAutoScanned.current) {
            hasAutoScanned.current = true;
            setUrl(customerUrl);
            // Wait 1 second then automatically start the scan
            const timer = setTimeout(() => {
                startScan(customerUrl);
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [searchParams, startScan]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await startScan(url);
    };

    return (
        <form onSubmit={handleSubmit} className={cn("w-full relative z-10", className)}>
            <div className="flex flex-col gap-3 sm:flex-row transition-all duration-200 animate-fade-in-up">
                <Input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setHasBeenFocused(true)}
                    className={cn(
                        "flex-1 h-12 text-base bg-background",
                        hasBeenFocused
                            ? "border-border/60 focus:border-foreground/40"
                            : "border-foreground animate-pulse shadow-sm"
                    )}
                    disabled={isLoading}
                />
                <Button 
                    type="submit" 
                    disabled={isLoading || !url.trim()}
                    className="h-12 px-8 bg-foreground text-background hover:opacity-90 font-normal border"
                >
                    {isLoading ? "Scanning..." : "Scan"}
                </Button>
            </div>
        </form>
    );
}
