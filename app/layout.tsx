import type { Metadata } from "next";
import "./globals.css";
import { ClientEnhancements } from "@/components/site/ClientEnhancements";

export const runtime = "nodejs";

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
    <html lang="de" data-theme="light">
      <body className="antialiased">
        {children}
        <ClientEnhancements />
      </body>
    </html>
  );
}
