import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Omnipixel",
    description: "Omnipixel Application",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body
                className={`${outfit.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <Navigation />
                {children}
            </body>
        </html>
    );
}
