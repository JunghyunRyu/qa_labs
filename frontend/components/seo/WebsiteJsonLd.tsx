/**
 * JSON-LD structured data for the website.
 * Helps search engines understand the site structure and enables sitelinks search box.
 */

export function WebsiteJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QA Arena",
    alternateName: ["QA 아레나", "QA Labs"],
    url: "https://qa-arena.qalabs.kr",
    description:
      "pytest와 Python으로 실전 QA 코딩테스트를 준비하세요. 뮤테이션 테스트 기반 버그 찾기 연습 플랫폼.",
    inLanguage: "ko",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate:
          "https://qa-arena.qalabs.kr/problems?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QA Arena",
    alternateName: "QaLabs",
    url: "https://qa-arena.qalabs.kr",
    logo: "https://qa-arena.qalabs.kr/logo.png",
    description:
      "QA 엔지니어를 위한 코딩테스트 연습 플랫폼. 뮤테이션 테스트 기반 버그 찾기 훈련.",
    foundingDate: "2025",
    sameAs: ["https://github.com/JunghyunRyu/qa_labs"],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["Korean", "English"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function EducationalPlatformJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "QA 코딩테스트 트레이닝",
    description:
      "pytest를 활용한 뮤테이션 테스트 기반 QA 코딩테스트 연습. AI 피드백으로 테스트 역량 향상.",
    provider: {
      "@type": "Organization",
      name: "QA Arena",
      url: "https://qa-arena.qalabs.kr",
    },
    isAccessibleForFree: true,
    inLanguage: "ko",
    coursePrerequisites: "Python 기초, pytest 기본 문법",
    educationalLevel: ["Beginner", "Intermediate", "Advanced"],
    teaches: [
      "뮤테이션 테스트",
      "pytest 테스트 코드 작성",
      "버그 탐지 기법",
      "경계값 분석",
      "동등 분할",
    ],
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT1H",
    },
    audience: {
      "@type": "Audience",
      audienceType: ["QA Engineer", "SDET", "Software Developer", "취업 준비생"],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "25",
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default WebsiteJsonLd;
