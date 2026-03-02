import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluesky Social",
  description: "Your home for social internet. Join a thriving community where you can express yourself freely.",
  keywords: ["Bluesky", "Social", "AT Protocol", "Decentralized", "Twitter Alternative"],
  authors: [{ name: "Bluesky" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Bluesky Social",
    description: "Your home for social internet",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bluesky Social",
    description: "Your home for social internet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
