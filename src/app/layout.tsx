import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://nodded.app")
  ),
  title: "Nodded - 신뢰 기반 비즈니스 네트워크",
  description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다. 초대 기반 폐쇄형 비즈니스 인맥 플랫폼",
  keywords: ["비즈니스 네트워크", "인맥 관리", "커피챗", "네트워킹", "스타트업"],
  authors: [{ name: "Nodded" }],
  // 검색 엔진 인덱싱 차단 - 개인정보 보호
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'none',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "Nodded - 비즈니스 네트워킹의 새로운 방법",
    description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다",
    type: "website",
    locale: "ko_KR",
    siteName: "Nodded",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Nodded - 비즈니스 네트워킹의 새로운 방법",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nodded - 비즈니스 네트워킹의 새로운 방법",
    description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nodded",
    startupImage: [
      {
        url: "/splash/splash-1170x2532.png",
        media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Nodded",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} antialiased bg-[#0D1117] text-white`}
      >
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
