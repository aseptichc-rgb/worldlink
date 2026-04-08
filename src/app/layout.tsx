import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import PushNotificationInit from "@/components/pwa/PushNotificationInit";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://researchnexus.app")
  ),
  title: "ResearchNexus - 연구를 연결하다, 지식을 확장하다",
  description: "논문과 연구 관심사 기반으로 연구자를 연결하는 네트워킹 플랫폼. 공동 연구의 기회를 발견하세요.",
  keywords: ["연구자 네트워크", "논문", "학술 협업", "연구 매칭", "학회"],
  authors: [{ name: "ResearchNexus" }],
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
    title: "ResearchNexus - 연구자를 위한 인맥 플랫폼",
    description: "논문과 연구 관심사 기반으로 연구자를 연결하는 네트워킹 플랫폼",
    type: "website",
    locale: "ko_KR",
    siteName: "ResearchNexus",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ResearchNexus - 연구를 연결하다, 지식을 확장하다",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ResearchNexus - 연구자를 위한 인맥 플랫폼",
    description: "논문과 연구 관심사 기반으로 연구자를 연결하는 네트워킹 플랫폼",
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
    title: "ResearchNexus",
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
    "apple-mobile-web-app-title": "ResearchNexus",
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
        className={`${inter.variable} ${sourceSerif.variable} antialiased bg-[#0D1117] text-white`}
      >
        {children}
        <InstallPrompt />
        <PushNotificationInit />
      </body>
    </html>
  );
}
