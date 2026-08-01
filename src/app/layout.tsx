import type { Metadata } from "next";
import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/layout";
import { AuthProvider, CartProvider, PreferencesProvider, ToastProvider, WishlistProvider } from "@/contexts";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "FitFIXto - Premium Gym Equipment & Training",
  description: "Commercial-grade equipment, certified supplements, pro trainers & expert installation. Built for strength.",
  keywords: "gym equipment, fitness, supplements, personal training, home gym setup",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body style={{ overscrollBehaviorX: "contain", overscrollBehaviorY: "contain" }} suppressHydrationWarning>
        <ToastProvider>
          <PreferencesProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteChrome>{children}</SiteChrome>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
          </PreferencesProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
