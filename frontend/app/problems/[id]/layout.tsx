import type { Metadata } from "next";
import { ProblemJsonLd } from "@/components/ProblemJsonLd";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

// 서버 사이드: INTERNAL_API_URL (컨테이너 간 통신), 클라이언트: NEXT_PUBLIC_API_URL
const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

async function getProblemData(id: string) {
  try {
    const res = await fetch(`${API_URL}/v1/problems/${id}`, {
      next: { revalidate: 3600 }, // 1시간 캐시
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const problem = await getProblemData(id);

  if (!problem) {
    return {
      title: "문제를 찾을 수 없습니다 | QA Arena",
      description: "요청하신 문제를 찾을 수 없습니다.",
    };
  }

  const title = `${problem.title} | QA Arena`;
  const description =
    problem.short_description ||
    `[${problem.difficulty}] ${problem.category || "일반"} 시나리오 기반 QA 챌린지입니다. 테스트 코드를 작성하여 숨겨진 버그를 찾아내고, AI 피드백으로 테스트 역량을 성장시키세요. QA Arena에서 도전하세요!`;

  return {
    title,
    description,
    alternates: {
      canonical: `/problems/${id}`,
    },
    openGraph: {
      title: `도전: ${problem.title}`,
      description,
      type: "article",
      url: `https://qa-arena.qalabs.kr/problems/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `도전: ${problem.title}`,
      description,
    },
  };
}

export default async function ProblemDetailLayout({ params, children }: Props) {
  const { id } = await params;
  const problem = await getProblemData(id);

  return (
    <>
      {problem && <ProblemJsonLd problem={{ ...problem, id }} />}
      {children}
    </>
  );
}
