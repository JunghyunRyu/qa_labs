import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QA Arena",
  description: "버그 탐지율 챌린지 - 테스트 코드로 숨은 버그를 찾아내세요 | by QaLabs",
  metadataBase: new URL("https://qa-arena.qalabs.kr"), // 중요!

  openGraph: {
    title: "QA Arena - 버그 탐지율 챌린지",
    description: "테스트 코드로 숨은 버그를 찾아내세요. AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼 by QaLabs",
    url: "https://qa-arena.qalabs.kr",
    siteName: "QA Arena",
    images: [
      {
        url: "/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "QA Arena OG Image",
      },
    ],
    type: "website",
  },

  // 카카오톡 대응 AL 태그
  alternates: {
    canonical: "https://qa-arena.qalabs.kr",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "QA Arena - 버그 탐지율 챌린지",
    description: "테스트 코드로 숨은 버그를 찾아내세요. AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼",
    images: ["/og_image.jpg"],
  },

  // 검색엔진 사이트 소유권 확인
  verification: {
    other: {
      "naver-site-verification": ["44565d431b2bf6c57cd9433473b49fecb3a72139"],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
