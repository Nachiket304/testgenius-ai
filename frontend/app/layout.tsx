import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
const geistSans = Geist({

  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Speclyze - AI-Powered QA Copilot',
  description: 'Analyze specifications and generate comprehensive test cases using AI. Transform requirements into tests in seconds.',
  keywords: ['QA', 'testing', 'AI', 'automation', 'test cases', 'Speclyze'],
  authors: [{ name: 'Nachiket Patel' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Speclyze - AI-Powered QA Copilot',
    description: 'Analyze specs, generate tests with AI',
    url: 'https://speclyze.vercel.app',
    siteName: 'Speclyze',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Speclyze - AI-Powered QA Copilot',
    description: 'Analyze specs, generate tests with AI',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
