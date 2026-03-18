import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FOLDDER",
  description: "AI-powered visual composition studio — build, transform and generate media with precision.",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
};

import { AppLayout } from "@/components/layout/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
