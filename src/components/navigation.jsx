"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Services", href: "#services" },
  { name: "Contact", href: "#contact" },
];

export function Navigation() {
	const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

	return (
		<nav className="sticky top-0 z-50 w-full border-b backdrop-blur">
			<div className="container max-w-[1600px] mx-auto">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center">
						<a href="/" className="text-xl font-semibold tracking-tight">
							Omnipixel
						</a>
					</div>

					{/* Desktop Navigation */}
					<div className="hidden md:flex md:items-center md:space-x-6">
						{navigationItems.map((item) => (
							<a
								key={item.name}
								href={item.href}
								className="text-sm font-medium text-foreground transition-colors hover:text-foreground/80"
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
							? "block border-t"
							: "hidden"
					)}
				>
					<div className="space-y-1 px-2 pb-3 pt-2">
						{navigationItems.map((item) => (
							<a
								key={item.name}
								href={item.href}
								className="block rounded-md px-3 py-2 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.name}
							</a>
						))}
					</div>
				</div>
			</div>
		</nav>
	);
}
