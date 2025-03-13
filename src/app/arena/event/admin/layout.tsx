import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blockmon Events Admin | Blocknogotchi",
  description: "Manage community events for Blockmon trainers",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
} 