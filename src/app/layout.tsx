import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Chatmat",
  description: "Chat + Notes workspace",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ink-50 font-sans text-ink-900 antialiased dark:bg-ink-50 dark:text-ink-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
