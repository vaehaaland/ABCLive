import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const googleSansFlex = localFont({
  variable: "--font-google-sans-flex",
  src: '../public/fonts/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf',
  display: "swap",
  adjustFontFallback: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ABC Live",
    template: "%s | ABC Live",
  },
  description: "Oppdragsplanlegging for ABC Studio og Alvsvåg AS",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "ABC Live",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${googleSansFlex.variable} ${manrope.variable} ${inter.variable}  h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
