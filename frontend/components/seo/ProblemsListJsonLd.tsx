/**
 * JSON-LD structured data for the problems list page.
 * Creates an ItemList schema for better search result presentation.
 */

interface Problem {
  slug: string;
  title: string;
  difficulty: string;
  domain?: string;
}

interface ProblemsListJsonLdProps {
  problems: Problem[];
  totalCount: number;
}

export function ProblemsListJsonLd({
  problems,
  totalCount,
}: ProblemsListJsonLdProps) {
  const difficultyMap: Record<string, string> = {
    "Very Easy": "입문",
    Easy: "초급",
    Medium: "중급",
    Hard: "고급",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "QA 코딩테스트 문제 목록",
    description: `총 ${totalCount}개의 QA 버그 찾기 연습 문제. 난이도별 pytest 테스트 코드 작성 훈련.`,
    numberOfItems: totalCount,
    itemListElement: problems.slice(0, 10).map((problem, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Quiz",
        name: problem.title,
        url: `https://qa-arena.qalabs.kr/problems/${problem.slug}`,
        educationalLevel: difficultyMap[problem.difficulty] || problem.difficulty,
        about: problem.domain || "일반",
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default ProblemsListJsonLd;
