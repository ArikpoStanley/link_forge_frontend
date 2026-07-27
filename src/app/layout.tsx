import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuspay TransID — Modular KYC",
  description:
    "Generate Modular KYC verification links and complete checks inline or via hosted URL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
