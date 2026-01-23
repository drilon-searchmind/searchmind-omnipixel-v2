import Image from "next/image";

export function HeroSection() {
	return (
		<section className="w-full py-24 md:py-32">
			<div className="container max-w-[1200px] mx-auto px-6">
				<div className="flex flex-col md:flex-row items-center md:items-start gap-12 md:gap-8">
					{/* Left Side - Text Content (60% width) */}
					<div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
						{/* Logo and Title */}
						<div className="flex flex-col items-center md:items-start gap-6">
							<Image
								src="/images/tagstackLogo2NoBG.png"
								alt="Omnipixel Logo"
								width={80}
								height={80}
								className="object-contain"
							/>
							<h1 className="text-6xl md:text-7xl font-light tracking-tight text-foreground">
								Omnipixel
							</h1>
						</div>

						{/* Subtitle */}
						<p className="text-xl md:text-2xl font-light text-foreground/60 max-w-2xl leading-relaxed">
							Analyze and visualize tracking data with precision and clarity
						</p>
					</div>

					{/* Right Side - Texture Image (40% width, 80% height) */}
					<div className="w-full md:w-[40%] flex-shrink-0 absolute right-0 z-0 overflow-hidden">
						<div 
							className="relative w-full h-[60vh] md:h-[80vh] rounded overflow-hidden animate-fade-in-left"
							style={{
								backgroundImage: 'url(/textures/h-co-jQ0RUW5kVGc-unsplash.jpg)',
								backgroundSize: 'cover',
								backgroundPosition: 'center',
								backgroundRepeat: 'no-repeat'
							}}
						>
							{/* Foreground overlay */}
							<div className="absolute inset-0 bg-foreground/90 z-0"></div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
