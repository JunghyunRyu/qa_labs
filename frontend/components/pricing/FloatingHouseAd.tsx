/**
 * FloatingHouseAd - 전역 플로팅 HouseAd 래퍼
 * PR5: UX/Pricing
 *
 * 레이아웃에서 사용할 수 있는 클라이언트 컴포넌트
 * 특정 페이지에서는 표시하지 않음 (pricing, auth 등)
 */

"use client";

import { usePathname } from "next/navigation";
import HouseAd from "./HouseAd";

// HouseAd를 표시하지 않을 페이지 경로
const EXCLUDED_PATHS = [
  "/pricing",
  "/auth",
  "/problems/", // 문제 상세 페이지 (집중 모드)
  "/dashboard", // 대시보드 (자체 HouseAd 보유)
];

export default function FloatingHouseAd() {
  const pathname = usePathname();

  // 제외 경로 체크
  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
  if (isExcluded) return null;

  // HouseAd 자체에서 localStorage 기반 빈도 제어를 수행함
  // 유료 플랜 체크는 추후 Plan API 연동 시 추가 가능

  return (
    <HouseAd
      variant="floating"
      targetPlan="lite"
      placement={`floating_${pathname.replace(/\//g, "_") || "home"}`}
    />
  );
}
