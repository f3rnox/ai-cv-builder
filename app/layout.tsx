import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DisplaySettingsInitializer from "@/components/DisplaySettingsInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI CV Builder",
  description: "Create and manage multiple tailor-made CVs with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-background text-foreground dark:bg-gray-950 print:h-auto print:bg-white print:text-black`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans transition-colors duration-300 print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:text-black [-webkit-print-color-adjust:exact] [print-color-adjust:exact]">
        <DisplaySettingsInitializer />
        {children}
      </body>
    </html>
  );
}
