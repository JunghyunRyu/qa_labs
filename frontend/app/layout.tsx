import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/AuthContext";
import LayoutWrapper from "@/components/LayoutWrapper";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import {
  WebsiteJsonLd,
  OrganizationJsonLd,
  EducationalPlatformJsonLd,
} from "@/components/seo/WebsiteJsonLd";
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
  title: "QA Arena - QA 엔지니어 코딩테스트 & 버그 찾기 연습",
  description:
    "pytest와 Python으로 실전 QA 코딩테스트를 준비하세요. 뮤테이션 테스트 기반 버그 찾기 연습, AI 피드백으로 테스트 자동화 역량 향상. QA 포트폴리오 준비에 최적화된 무료 플랫폼.",
  metadataBase: new URL("https://qa-arena.qalabs.kr"),
  keywords: [
    "QA 코딩테스트",
    "QA 엔지니어",
    "버그 찾기",
    "테스트 코드 연습",
    "pytest",
    "뮤테이션 테스트",
    "QA 포트폴리오",
    "테스트 자동화",
    "SDET",
    "소프트웨어 테스팅",
  ],

  openGraph: {
    title: "QA Arena - QA 엔지니어 코딩테스트 & 버그 찾기 연습",
    description:
      "pytest로 숨겨진 버그를 찾아내세요. AI 피드백과 함께 QA 역량을 성장시키는 실전 트레이닝 플랫폼. 무료로 시작하세요!",
    url: "https://qa-arena.qalabs.kr",
    siteName: "QA Arena",
    images: [
      {
        url: "/og_image.jpg",
        width: 1200,
        height: 630,
        alt: "QA Arena - QA 엔지니어 코딩테스트 연습 플랫폼",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },

  // 카카오톡 대응 AL 태그
  alternates: {
    canonical: "https://qa-arena.qalabs.kr",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "QA Arena - QA 코딩테스트 & 버그 찾기 연습",
    description:
      "pytest로 버그를 찾고, AI 피드백으로 성장하세요. QA 엔지니어를 위한 무료 실전 연습 플랫폼.",
    images: ["/og_image.jpg"],
  },

  // 검색엔진 사이트 소유권 확인
  verification: {
    google: "GH7OCKpW9IbxdXjKMGxvnO406OQF6gft1N2wgyiSoEo",
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
    <html lang="ko" suppressHydrationWarning>
      <head>
        <WebsiteJsonLd />
        <OrganizationJsonLd />
        <EducationalPlatformJsonLd />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleAnalytics />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
