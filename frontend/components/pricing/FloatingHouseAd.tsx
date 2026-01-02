/**
 * FloatingHouseAd - 전역 플로팅 HouseAd 래퍼
 * PR5: UX/Pricing
 *
 * 레이아웃에서 사용할 수 있는 클라이언트 컴포넌트
 * 특정 페이지에서는 표시하지 않음 (pricing, auth 등)
 */

"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import HouseAd from "./HouseAd";

// HouseAd를 표시하지 않을 페이지 경로
const EXCLUDED_PATHS = [
  "/pricing",
  "/auth",
  "/problems/", // 문제 상세 페이지 (집중 모드)
];

export default function FloatingHouseAd() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // 제외 경로 체크
  const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
  if (isExcluded) return null;

  // 이미 유료 플랜 사용자는 표시하지 않음
  // (user.tier가 premium이면 유료 사용자로 간주)
  if (isAuthenticated && user?.tier === "premium") {
    return null;
  }

  return (
    <HouseAd
      variant="floating"
      targetPlan="lite"
      placement={`floating_${pathname.replace(/\//g, "_") || "home"}`}
    />
  );
}
