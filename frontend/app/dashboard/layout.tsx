import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "학습 현황 | QA Arena",
  description: "나의 QA 성장 기록을 확인하세요. 문제 풀이 통계, 진행 상황, 성취도 분석",
  openGraph: {
    title: "학습 현황 - QA Arena",
    description: "나의 QA 성장 기록을 확인하세요",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
