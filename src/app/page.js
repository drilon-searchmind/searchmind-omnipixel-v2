import { UrlScanner } from "@/components/url-scanner";
import Image from "next/image";

export default function Home() {
	return (
		<div className="flex min-h-auto items-center justify-center mt-20">
			<main className="w-full max-w-[1600px] space-y-8">
				<div className="space-y-0 text-center">
					<span className="flex items-center justify-center gap-0">
						<Image
							src="/images/tagstackLogo2NoBG.png"
							alt="Tagstack Logo"
							width={100}
							height={100}
							className="object-contain"
						/>
						<h1 className="text-7xl font-bold tracking-tight text-primary">
							<span>Omnipixel</span>
						</h1>
					</span>
					<h5 className="text-xl text-muted-foreground mt-10">
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
