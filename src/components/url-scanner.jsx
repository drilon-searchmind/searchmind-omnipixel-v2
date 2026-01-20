"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function UrlScanner({ className, onSubmit }) {
    const [url, setUrl] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsLoading(true);
        try {
            // Navigate to scan page with URL parameter
            router.push(`/scan?url=${encodeURIComponent(url.trim())}`);

            // If custom onSubmit is provided, call it too
            if (onSubmit) {
                await onSubmit(url);
            }
        } catch (error) {
            console.error("Error scanning URL:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={cn("w-full", className)}>
            <div className="flex flex-col gap-4 sm:flex-row">
                <Input
                    type="url"
                    placeholder="Enter URL to scan..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !url.trim()}>
                    {isLoading ? "Scanning..." : "Scan URL"}
                </Button>
            </div>
        </form>
    );
}
