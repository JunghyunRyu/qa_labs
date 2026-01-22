"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

// 헤더/푸터를 완전히 숨길 경로 패턴
const NO_LAYOUT_PATHS = ["/auth/callback"];

// IDE 몰입 모드: 헤더/푸터 숨김, 전체 화면 사용
// - /problems/{id}: 문제 풀이 페이지
// - /ai-verifier/challenge/{id}: AI Verifier 챌린지 페이지
const IDE_MODE_PATTERN = /^\/problems\/\d+$|^\/ai-verifier\/challenge\/[\w-]+$/;

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideLayout = NO_LAYOUT_PATHS.some((path) => pathname.startsWith(path));
  const isIDEMode = IDE_MODE_PATTERN.test(pathname);

  // 인증 콜백 등 완전히 레이아웃 없는 페이지
  if (hideLayout) {
    return <>{children}</>;
  }

  // 문제 상세 페이지: IDE 몰입 모드 (헤더/푸터 없음, 전체 높이 사용)
  if (isIDEMode) {
    return <main className="h-screen">{children}</main>;
  }

  // 일반 페이지: 헤더 + 푸터
  return (
    <>
      <Header />
      <main className="pt-14">{children}</main>
      <Footer />
    </>
  );
}
