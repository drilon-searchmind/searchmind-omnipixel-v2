import { UrlScanner } from "@/components/url-scanner";

export default function Home() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<main className="w-full max-w-[1600px] space-y-8">
				<div className="space-y-2 text-center">
					<h1 className="text-7xl font-bold tracking-tight">
						Searchmind <br />
						Omnipixel
					</h1>
					<h5 className="text-xl text-muted-foreground mt-4">
						Omnipixel is a tool that allows you to analyze and visualize tracking data.
					</h5>
				</div>
				<div className="flex justify-center">
					<div className="w-full max-w-2xl">
						<UrlScanner />
					</div>
				</div>
			</main>
		</div>
	);
}
