import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "FitFIXto - Premium Gym Equipment & Training",
  description: "Commercial-grade equipment, certified supplements, pro trainers & expert installation. Built for strength.",
  keywords: "gym equipment, fitness, supplements, personal training, home gym setup",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
