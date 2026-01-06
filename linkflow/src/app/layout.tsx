import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://connect-cyan-sigma.vercel.app"),
  title: "헬스케어 퓨처포럼 2기 주소록",
  description: "원우들의 인맥을 시각화해서 새로운 기회를 발견해보세요",
  openGraph: {
    title: "헬스케어 퓨처포럼 2기 주소록",
    description: "원우들의 인맥을 시각화해서 새로운 기회를 발견해보세요",
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
    title: "헬스케어 퓨처포럼 2기 주소록",
    description: "원우들의 인맥을 시각화해서 새로운 기회를 발견해보세요",
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
