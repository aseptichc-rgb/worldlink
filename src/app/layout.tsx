import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "NEXUS - 신뢰 기반 비즈니스 네트워크",
  description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다. 초대 기반 폐쇄형 비즈니스 인맥 플랫폼",
  keywords: ["비즈니스 네트워크", "인맥 관리", "커피챗", "네트워킹", "스타트업"],
  authors: [{ name: "NEXUS" }],
  openGraph: {
    title: "NEXUS - 신뢰 기반 비즈니스 네트워크",
    description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다",
    type: "website",
    locale: "ko_KR",
    siteName: "NEXUS",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEXUS - 신뢰 기반 비즈니스 네트워크",
    description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
