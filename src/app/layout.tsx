import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/chrome/Footer";
import { Header } from "@/components/chrome/Header";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/styles/globals.css";

const sans = Noto_Sans_KR({ weight: ["400", "600", "700"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "고창민 · 성능 엔지니어", template: "%s · 고창민" },
  description: "측정으로 웹과 웹뷰의 병목을 찾아 결과로 바꾸는 프론트엔드 엔지니어 고창민입니다.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
          <Header />
          <main id="main-content" className="site-main" tabIndex={-1}>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
