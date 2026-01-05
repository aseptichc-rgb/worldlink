import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://connect-cyan-sigma.vercel.app"),
  title: "LinkFlow - 헬스케어 인사이트 네트워크",
  description: "헬스케어 산업 인맥을 시각화하고 연결 고리를 발견하세요",
  openGraph: {
    title: "LinkFlow - 헬스케어 인사이트 네트워크",
    description: "헬스케어 산업 인맥을 시각화하고 연결 고리를 발견하세요",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinkFlow 헬스케어 네트워크",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkFlow - 헬스케어 인사이트 네트워크",
    description: "헬스케어 산업 인맥을 시각화하고 연결 고리를 발견하세요",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
