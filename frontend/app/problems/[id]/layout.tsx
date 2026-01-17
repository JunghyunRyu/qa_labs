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

  // SEO 최적화: 난이도와 도메인을 활용한 키워드 타겟팅
  const difficultyKr: Record<string, string> = {
    "Very Easy": "입문",
    Easy: "초급",
    Medium: "중급",
    Hard: "고급",
  };
  const difficultyLabel = difficultyKr[problem.difficulty] || problem.difficulty;
  const domainLabel = problem.domain || "일반";

  const title = `${problem.title} - ${difficultyLabel} QA 버그 찾기 | QA Arena`;
  const description =
    problem.short_description ||
    `[${difficultyLabel}] ${domainLabel} 시나리오 pytest 버그 찾기 문제. 테스트 코드로 숨겨진 버그를 찾고 AI 피드백으로 QA 역량을 키우세요. QA 코딩테스트 연습에 최적화.`;

  return {
    title,
    description,
    keywords: [
      `${problem.title}`,
      `QA ${difficultyLabel} 문제`,
      `${domainLabel} 버그 찾기`,
      "pytest 연습",
      "QA 코딩테스트",
    ],
    alternates: {
      canonical: `/problems/${id}`,
    },
    openGraph: {
      title: `${problem.title} - QA 버그 찾기 연습`,
      description,
      type: "article",
      url: `https://qa-arena.qalabs.kr/problems/${id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${problem.title} | QA Arena`,
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
