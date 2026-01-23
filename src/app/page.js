"use client"

import { UrlScanner } from "@/components/url-scanner";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";

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
						<UrlScanner />
					</div>
				</div>
			</section>

			{/* Features Section */}
			<FeaturesSection />
		</main>
	);
}
