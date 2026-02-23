import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DexieProvider } from "@/components/providers/DexieProvider";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";
import { ConnectionMonitor } from "@/components/ConnectionMonitor";
import { OfflineIndicator } from "@/components/OfflineIndicator";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "POS Karczma Łabędź",
  description: "System POS gastronomiczny — Karczma Łabędź",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POS Karczma",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#895a3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="/" />
        <link rel="dns-prefetch" href="/" />
        <link
          rel="preload"
          href="/api/products?minimal=true"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/api/categories"
          as="fetch"
          crossOrigin="anonymous"
        />
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConnectionMonitor />
        <QueryProvider>
          <DexieProvider>{children}</DexieProvider>
        </QueryProvider>
        <OfflineIndicator />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
