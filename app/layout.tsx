import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "온마음",
  description: "얼굴 표정 기반 일별 마음 상태 모니터링",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
