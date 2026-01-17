import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA 학습 대시보드 - 성장 기록 & 통계 | QA Arena",
  description:
    "나의 QA 코딩테스트 성장 기록을 확인하세요. 문제 풀이 통계, SDET 랭크 진행 상황, 버그 탐지율 분석. QA 포트폴리오 준비에 활용하세요.",
  openGraph: {
    title: "QA 학습 대시보드 | QA Arena",
    description: "나의 QA 성장 기록과 통계를 확인하세요",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
