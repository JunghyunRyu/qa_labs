import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  title: "QA-Arena",
  description: "AI-Assisted QA Coding Test Platform",
  metadataBase: new URL("https://qa-arena.qalabs.kr"), // 중요!

  openGraph: {
    title: "QA-Arena",
    description: "AI-Assisted QA Coding Test Platform",
    url: "https://qa-arena.qalabs.kr",
    siteName: "QA-Arena",
    images: [
      {
        url: "/og_image.png", // public 폴더에 저장된 OG 이미지
        width: 1200,
        height: 630,
        alt: "QA-Arena OG Image",
      },
    ],
    type: "website",
  },

  // 카카오톡 대응 AL 태그
  alternates: {
    canonical: "https://qa-arena.qalabs.kr",
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
