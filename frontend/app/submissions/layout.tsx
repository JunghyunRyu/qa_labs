import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA 테스트 제출 기록 - 풀이 이력 & AI 피드백 | QA Arena",
  description:
    "나의 QA 코딩테스트 제출 내역을 확인하세요. pytest 테스트 코드 풀이 이력, 버그 탐지율 점수 변화, AI 피드백 기록. QA 포트폴리오 관리.",
  openGraph: {
    title: "QA 테스트 제출 기록 | QA Arena",
    description: "나의 테스트 코드 제출 내역과 AI 피드백을 확인하세요",
  },
};

export default function SubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
