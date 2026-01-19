import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center p-8 pt-16">
			<main className="w-full max-w-4xl space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="text-4xl font-bold tracking-tight">
						Design System Demo
					</h1>
					<p className="text-muted-foreground">
						Clean, minimalistic components built with shadcn/ui
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Button Variants</CardTitle>
							<CardDescription>
								Different button styles and sizes
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button>Default</Button>
								<Button variant="secondary">Secondary</Button>
								<Button variant="outline">Outline</Button>
								<Button variant="ghost">Ghost</Button>
								<Button variant="destructive">Destructive</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button size="sm">Small</Button>
								<Button size="default">Default</Button>
								<Button size="lg">Large</Button>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Card Component</CardTitle>
							<CardDescription>
								Flexible container for content
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Cards are perfect for grouping related content and creating
								visual hierarchy in your application.
							</p>
						</CardContent>
						<CardFooter>
							<Button variant="outline" size="sm">
								Learn More
							</Button>
						</CardFooter>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Design System</CardTitle>
						<CardDescription>
							Built with Tailwind CSS v4 and shadcn/ui
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm">
							This design system provides consistent styling across your
							application. See{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 text-xs">
								DESIGN_SYSTEM.md
							</code>{" "}
							for complete documentation.
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
