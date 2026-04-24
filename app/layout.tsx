import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRM BFHL Challenge",
  description: "Full stack solution for the SRM engineering challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
