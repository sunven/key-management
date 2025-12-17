import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Key Management System",
  description: "Manage your API providers and tokens",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased bg-slate-950 text-cyan-50 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black`}
      >
        <div className="fixed inset-0 z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <Navbar />
        {children}
        <Toaster theme="dark" className="font-mono" toastOptions={{
          className: 'bg-slate-900 border-cyan-800 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
        }} />
      </body>
    </html>
  );
}
