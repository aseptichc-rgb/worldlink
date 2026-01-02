import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkFlow - 헬스케어 인사이트 네트워크",
  description: "헬스케어 산업 인맥을 시각화하고 연결 고리를 발견하세요",
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
