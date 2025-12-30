import type { Metadata } from "next";
import { ProblemJsonLd } from "@/components/ProblemJsonLd";

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
    `난이도: ${problem.difficulty} | ${problem.category || "일반"} 시나리오의 버그를 찾아보세요`;

  return {
    title,
    description,
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
