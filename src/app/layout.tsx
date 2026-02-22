import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAPID ROLE | Next-Gen iGaming",
  description: "Speed. Anonymity. High-performance crypto gaming.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "RAPID ROLE",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#020202",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body className="mesh-gradient-bg min-h-screen antialiased">
        <Providers>
          {children}
          {modal}
          <IOSInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
