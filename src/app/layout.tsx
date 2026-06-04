import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#3d5228",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"
  ),
  title: "Uitjes Grashoek – Dag uit in de Peel & Maas",
  description:
    "Inspiratie voor daguitstapjes vanuit Grashoek. Gefilterd op activiteit, weer en reistijd.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Uitjes Grashoek",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <header className="sticky top-0 z-50 bg-[var(--primary-dark)] text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <a href="/" className="text-xl font-semibold tracking-tight hover:opacity-90">
              Uitjes Grashoek
            </a>
            <span className="text-white/50 text-sm ml-2 hidden sm:block">
              Dag uit in de Peel &amp; Maas
            </span>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-[var(--primary-dark)] text-white/70 text-sm py-4 text-center mt-8">
          Uitjes vanuit Grashoek · Peel &amp; Maas regio
        </footer>
      </body>
    </html>
  );
}
