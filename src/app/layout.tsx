import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import "@/styles/report-print.css";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { SITE_URL } from "@/lib/site";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ankit Singh | AI Portfolio",
    template: "%s | Ankit Singh",
  },
  description:
    "Engineer-turned AI Product Manager building at the intersection of product strategy, AI, and execution. Prototype fast, ship with trust!",
  keywords: [
    "Ankit Singh",
    "Product Manager",
    "Strategy",
    "Operations",
    "AI",
    "Portfolio",
  ],
  authors: [{ name: "Ankit Singh" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Ankit Singh | AI Portfolio",
    title: "Ankit Singh | AI Portfolio",
    description:
      "Engineer-turned AI Product Manager building at the intersection of product strategy, AI, and execution. Prototype fast, ship with trust!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ankit Singh | AI Portfolio",
    description:
      "Engineer-turned AI Product Manager building at the intersection of product strategy, AI, and execution. Prototype fast, ship with trust!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} h-full`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}

