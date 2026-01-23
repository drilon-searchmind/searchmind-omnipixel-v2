import { Card, CardContent } from "@/components/ui/card";

const features = [
	{
		title: "Comprehensive Analysis",
		description: "Deep dive into tracking implementations, cookie compliance, and performance metrics"
	},
	{
		title: "Real-time Scanning",
		description: "Instant website analysis with automated cookie acceptance and CMP detection"
	},
	{
		title: "Technical Insights",
		description: "Detailed breakdown of marketing scripts, Core Web Vitals, and GTM configurations"
	}
];

export function FeaturesSection() {
	return (
		<section className="w-full py-20 border-t border-border/40 relative z-10 bg-white">
			<div className="container max-w-[1200px] mx-auto px-6">
				<div className="grid gap-8 md:grid-cols-3">
					{features.map((feature, index) => (
						<Card key={index} className="border-0 shadow-none bg-transparent">
							<CardContent className="p-0 space-y-3">
								<h3 className="text-lg font-medium text-foreground">
									{feature.title}
								</h3>
								<p className="text-sm text-foreground/60 leading-relaxed">
									{feature.description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		</section>
	);
}
