import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "QA 코딩테스트 문제 목록 - 버그 찾기 연습 | QA Arena",
  description:
    "난이도별 QA 코딩테스트 문제를 풀어보세요. Python pytest로 Fintech, E-commerce 등 실무 시나리오의 숨겨진 버그를 찾는 연습. 무료 QA 엔지니어 테스트 준비.",
  keywords: ["QA 코딩테스트 문제", "버그 찾기 연습", "pytest 문제", "QA 테스트 연습"],
  openGraph: {
    title: "QA 코딩테스트 문제 목록 | QA Arena",
    description:
      "난이도별 QA 챌린지. pytest로 실무 시나리오의 버그를 찾아보세요.",
  },
};

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
