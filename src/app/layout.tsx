import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';

import "./globals.css";
import { AppKit } from "./context/appkit";
import Navbar from "./components/Navbar";
import ApolloProvider from "./components/ApolloProvider";

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
          <ApolloProvider>
            <Navbar />
            <div className="pt-16">
              {children}
            </div>
            <Toaster position="top-right" richColors closeButton />
          </ApolloProvider>
        </AppKit>
      </body>
    </html>
  );
}
