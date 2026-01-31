import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "LMS Pro - Premium Öğrenim",
  description: "Gelişmiş Öğrenim Yönetim Sistemi",
  manifest: "/manifest.json",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  other: {
    "dns-prefetch": "//fonts.googleapis.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
