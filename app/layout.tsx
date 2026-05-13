import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kickoff — 유럽 축구 대시보드",
  description: "EPL, 라리가, 분데스리가, 세리에A 순위, 일정, 하이라이트, 한국 선수까지 한 화면에.",
  openGraph: {
    title: "Kickoff",
    description: "유럽 축구를 한눈에",
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
