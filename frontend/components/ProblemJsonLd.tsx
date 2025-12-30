/**
 * JSON-LD structured data component for problem pages.
 * Helps search engines understand the content as a Quiz/learning resource.
 */

interface Problem {
  id: string;
  title: string;
  short_description?: string;
  difficulty: string;
  category?: string;
}

interface ProblemJsonLdProps {
  problem: Problem;
}

export function ProblemJsonLd({ problem }: ProblemJsonLdProps) {
  // Map difficulty to educational level
  const educationalLevelMap: { [key: string]: string } = {
    "Very Easy": "Beginner",
    Easy: "Beginner",
    Medium: "Intermediate",
    Hard: "Advanced",
    "Very Hard": "Advanced",
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: problem.title,
    description:
      problem.short_description ||
      `${problem.title} - QA Arena 버그 탐지 챌린지`,
    educationalLevel: educationalLevelMap[problem.difficulty] || "Intermediate",
    learningResourceType: "Quiz",
    interactivityType: "active",
    isAccessibleForFree: true,
    inLanguage: "ko",
    provider: {
      "@type": "Organization",
      name: "QA Arena",
      url: "https://qa-arena.qalabs.kr",
    },
    audience: {
      "@type": "Audience",
      audienceType: "QA Engineer, Software Developer, SDET",
    },
    about: {
      "@type": "Thing",
      name: "Software Testing",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default ProblemJsonLd;
