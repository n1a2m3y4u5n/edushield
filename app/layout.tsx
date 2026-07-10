import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduShield — AI 교원·학부모 민원 중개 플랫폼",
  description: "AI 기반 민원 중재로 교권을 보호합니다. 교육부 교육 공공데이터 AI활용대회 출품작.",
  keywords: ["교권 보호", "학부모 민원", "AI 중재", "NEIS", "교육 공공데이터"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
