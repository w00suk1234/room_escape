import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Remembers Echo",
  description: "기억을 잃은 채 누군가의 기록 속에서 자신의 이름을 찾는 SF 방탈출 비주얼노벨.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
