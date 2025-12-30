import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문제 목록 | QA Arena",
  description: "다양한 난이도의 QA 챌린지를 풀어보세요. Fintech, E-commerce, Healthcare 등 실무 시나리오 기반 문제",
  openGraph: {
    title: "문제 목록 - QA Arena",
    description: "다양한 난이도의 QA 챌린지를 풀어보세요",
  },
};

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
