"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Contact", href: "#contact" },
];

export function Navigation() {
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

	return (
		<nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border/40">
			<div className="container max-w-[1600px] mx-auto px-6">
				<div className="flex h-20 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center">
						<a href="/" className="flex items-center gap-2 text-lg font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity">
							<Image
								src="/images/tagstackLogo2NoBG.png"
								alt="Tagstack Logo"
								width={28}
								height={28}
								className="object-contain"
							/>
							<span className="font-semibold">Omnipixel</span>
						</a>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:gap-8">
						{navigationItems.map((item) => (
							<a
								key={item.name}
								href={item.href}
								className="text-sm font-normal text-foreground/70 transition-colors hover:text-foreground"
							>
								{item.name}
							</a>
						))}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							aria-label="Toggle menu"
						>
							<svg
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								{mobileMenuOpen ? (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								) : (
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 6h16M4 12h16M4 18h16"
									/>
								)}
							</svg>
						</Button>
					</div>
				</div>

				{/* Mobile Menu */}
				<div
					className={cn(
						"md:hidden",
						mobileMenuOpen
							? "block border-t border-border/40"
							: "hidden"
					)}
				>
					<div className="space-y-0 px-2 pb-4 pt-3">
						{navigationItems.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className="block px-3 py-2.5 text-sm font-normal text-foreground/70 transition-colors hover:text-foreground hover:bg-secondary/50"
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}
