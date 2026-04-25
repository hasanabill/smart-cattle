import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Cattle Health Monitoring",
  description:
    "IoT-enabled cattle health monitoring and anomaly detection dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-100 lg:flex-row">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
          <MobileNav />
          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
