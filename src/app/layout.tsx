import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIESEC LCAU - Asset Management",
  description: "Asset Management Web App for AIESEC Assumption University, Finance and Legality Function.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
