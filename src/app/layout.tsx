import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AppKit } from "./context/appkit";
import Navbar from "./components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Blocknogotchi - ETHUprising",
  description: "Blocknogotchi web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <AppKit>
          <Navbar />
          <div className="pt-16">
            {children}
          </div>
        </AppKit>
      </body>
    </html>
  );
}
