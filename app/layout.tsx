import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KUMON イベントラボ",
  description: "教室イベントの企画・設計・振り返りを一元管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
