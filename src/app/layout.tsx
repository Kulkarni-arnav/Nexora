import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NEXORA AI — Your knowledge. Searchable, understandable, intelligent.",
    template: "%s | NEXORA AI",
  },
  description:
    "NEXORA AI is a production-quality AI Knowledge Management & Research Assistant SaaS. Transform your documents into searchable, intelligent knowledge.",
  keywords: [
    "AI",
    "knowledge management",
    "research assistant",
    "RAG",
    "document search",
    "vector search",
  ],
  authors: [{ name: "NEXORA AI Team" }],
  creator: "NEXORA AI",
  publisher: "NEXORA AI",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "NEXORA AI",
    title: "NEXORA AI — Your knowledge. Searchable, understandable, intelligent.",
    description:
      "Transform your documents into searchable, intelligent knowledge with AI-powered research assistance.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXORA AI",
    description:
      "Your knowledge. Searchable, understandable, intelligent.",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.99 0 0)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.12 0.02 260)" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}