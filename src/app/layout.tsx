import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NEXUS - 신뢰 기반 비즈니스 네트워크",
  description: "단순한 주소록을 넘어, 비즈니스 기회의 지도를 그리다. 초대 기반 폐쇄형 비즈니스 인맥 플랫폼",
  keywords: ["비즈니스 네트워크", "인맥 관리", "커피챗", "네트워킹", "스타트업"],
  authors: [{ name: "NEXUS" }],
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
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152" },
      { url: "/icons/icon-192x192.png", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NEXUS",
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
    "apple-mobile-web-app-title": "NEXUS",
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
        className={`${notoSansKR.variable} antialiased bg-black text-white`}
      >
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
