import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제출 기록 | QA Arena",
  description: "나의 테스트 코드 제출 내역을 확인하세요. 풀이 이력, 점수 변화, AI 피드백 기록",
  openGraph: {
    title: "제출 기록 - QA Arena",
    description: "나의 테스트 코드 제출 내역을 확인하세요",
  },
};

export default function SubmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
