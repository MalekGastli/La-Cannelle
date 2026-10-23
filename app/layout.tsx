import type { Metadata } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { ClientEnhancements } from "@/components/site/ClientEnhancements";

export const runtime = "nodejs";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "la cannelle",
  description: "La Cannelle",
  icons: {
    icon: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-theme="light" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        {children}
        <ClientEnhancements />
      </body>
    </html>
  );
}
