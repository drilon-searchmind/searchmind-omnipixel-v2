"use client"

import { Suspense } from "react";
import { UrlScanner } from "@/components/url-scanner";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import PreviousScans from "@/components/previous-scans";

export default function Home() {
	return (
		<main className="min-h-screen bg-background">
			{/* Hero Section */}
			<HeroSection />

			{/* Scanner Section */}
			<section className="w-full py-16 border-t border-border/40">
				<div className="container max-w-[1200px] mx-auto px-6">
					<div className="space-y-6">
						<div className="text-center space-y-2">
							<h2 className="text-2xl font-light text-foreground">
								Start Analyzing
							</h2>
							<p className="text-sm text-foreground/50">
								Enter a URL to begin comprehensive website analysis
							</p>
						</div>
						<Suspense fallback={
							<div className="w-full">
								<div className="flex flex-col gap-3 sm:flex-row">
									<div className="flex-1 h-12 bg-background border border-border/60 rounded-md animate-pulse" />
									<div className="h-12 w-24 bg-foreground/20 rounded-md animate-pulse" />
								</div>
							</div>
						}>
							<UrlScanner />
						</Suspense>
						<PreviousScans />
					</div>
				</div>
			</section>

			{/* Features Section */}
			<FeaturesSection />
		</main>
	);
}
