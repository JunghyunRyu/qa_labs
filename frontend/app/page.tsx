import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HowItWorksSection from "@/components/how-it-works/HowItWorksSection";
import HeroResultPanel from "@/components/hero/HeroResultPanel";
import GuestModeBanner from "@/components/hero/GuestModeBanner";
import ScenarioShowcase from "@/components/showcase/ScenarioShowcase";

export const metadata: Metadata = {
  title: "QA Arena - 버그 탐지율 챌린지",
  description: "테스트 코드로 숨은 버그를 찾아내세요. 실전 시나리오와 AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼 by QaLabs",
  openGraph: {
    title: "QA Arena - 버그 탐지율 챌린지",
    description: "테스트 코드로 숨은 버그를 찾아내세요. AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼",
  },
};

// Hero copy constants
const heroCopy = {
  headline: "숨은 버그, 얼마나 찾아내나요?",
  subLine1: "당신의 테스트 시나리오가 얼마나 강력한지, 지금 바로 확인해보세요.",
  domainLabel: "도메인 선택",
  domainHelper: "선택하면 추천 문제가 바뀝니다",
};

const domains = [
  { key: "common", label: "공통", title: "공통 시나리오", hint: "경계값 · 예외처리 · 타입검증 · 널체크" },
  { key: "fintech", label: "핀테크", title: "결제/정산/수수료", hint: "정산 · 수수료 · 반올림 · 중복결제" },
  { key: "commerce", label: "커머스", title: "재고/주문/쿠폰", hint: "쿠폰 · 재고 · 주문 · 가격우선순위" },
  { key: "saas", label: "SaaS", title: "권한/요금제/쿼터", hint: "권한 · 요금제 · 쿼터 · 레이트리밋" },
  { key: "platform", label: "플랫폼", title: "상태전이/복구/장애", hint: "상태전이 · 재시도 · 서킷브레이커" },
  { key: "content", label: "콘텐츠", title: "문자열/정규화/발송", hint: "길이 · 정규화 · 금칙어 · 발송제한" },
];

// Feature Card 데이터
const features = [
  {
    image: "/images/qa-scenario-card.png",
    title: "STEP 01. 실전 시나리오로 시작",
    description: "계산기 예제가 아니라, 현업에서 실제로 터지는 장애 상황을 시나리오로 마주합니다.",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    image: "/images/auto-grading-card.png",
    title: "STEP 02. 테스트 강도 검증",
    description: "숨겨진 버그를 찾는 능력으로 테스트의 강도를 객관적으로 평가받아보세요.",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    image: "/images/ai-code-review-card.png",
    title: "STEP 03. AI 분석 리포트로 회고",
    description: "'어떤 시나리오를 놓쳤을까?' AI가 커버리지 사각지대를 분석하고, 더 견고한 테스트를 위한 인사이트를 제공합니다.",
    iconBg: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

// Target Audience 데이터
const audiences = [
  {
    title: "QA 엔지니어",
    desc: "테스트 자동화 스킬을 객관적으로 검증하고 싶은 현업 전문가",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    imageSrc: "/images/audience/qa-engineer.webp",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "SDET 지망생",
    desc: "pytest 기반 테스트 설계를 실전처럼 연습하고 싶은 취준생",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    imageSrc: "/images/audience/sdet.webp",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 14l9-5-9-5-9 5 9 5z" />
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
      </svg>
    ),
  },
  {
    title: "개발팀 리드",
    desc: "팀원의 QA 역량을 객관적으로 평가하고 싶은 매니저",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    imageSrc: "/images/audience/lead.webp",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

// Showcase 데이터 (실제 DB 문제와 연결)
const showcase = [
  // Common
  {
    domain: "common",
    emoji: "🔢",
    title: "점수 등급 계산 함수 테스트",
    scenario: "경계값과 동등 분할을 활용해 등급 판정 로직의 허점을 찾아보세요.",
    difficulty: "Easy" as const,
    mutants: 5,
    badges: ["경계값", "동등 분할", "등급 판정"],
    href: "/problems/problem-e04",
  },
  {
    domain: "common",
    emoji: "🛒",
    title: "장바구니 복합 할인 계산 테스트",
    scenario: "회원 등급/쿠폰/프로모션이 겹칠 때 할인 순서와 반올림 오류를 검증합니다.",
    difficulty: "Hard" as const,
    mutants: 8,
    badges: ["복합 할인", "반올림", "상태 기반"],
    href: "/problems/problem-h01",
  },
  {
    domain: "common",
    emoji: "💳",
    title: "할인 계산기 조합 테스트",
    scenario: "여러 할인 조건이 조합될 때 발생하는 엣지케이스를 탐지합니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["조합 테스트", "가격/할인", "다중 조건"],
    href: "/problems/problem-m02",
  },
  // Commerce
  {
    domain: "commerce",
    emoji: "🎫",
    title: "입장료 계산 함수 테스트",
    scenario: "연령별 할인, 무료 입장 조건 등 동등 분할로 티켓팅 로직을 검증합니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["동등 분할", "티켓팅", "연령별 할인"],
    href: "/problems/problem-e05",
  },
  {
    domain: "commerce",
    emoji: "📦",
    title: "배송비 계산 함수 테스트",
    scenario: "금액 구간별 배송비 정책의 경계값을 정확히 검증합니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["경계값", "배송비", "동등 분할"],
    href: "/problems/problem-e06",
  },
  {
    domain: "commerce",
    emoji: "📊",
    title: "CSV 고객 데이터 변환 테스트",
    scenario: "다단계 데이터 파이프라인에서 발생하는 변환 오류를 검증합니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["데이터 변환", "CSV", "입력 검증"],
    href: "/problems/problem-h02",
  },
  // SaaS
  {
    domain: "saas",
    emoji: "🔐",
    title: "API 필수 파라미터 검증 테스트",
    scenario: "필수 필드 누락, 타입 오류 등 API 입력 검증의 허점을 찾습니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["입력 검증", "API", "딕셔너리"],
    href: "/problems/problem-sa-e01",
  },
  {
    domain: "saas",
    emoji: "📧",
    title: "이메일 주소 유효성 검증 테스트",
    scenario: "복잡한 이메일 형식의 경계값과 예외 케이스를 검증합니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["문자열", "입력 검증", "이메일"],
    href: "/problems/problem-m01",
  },
  {
    domain: "saas",
    emoji: "⏱️",
    title: "Rate Limiter 토큰 버킷 테스트",
    scenario: "요청 제한, 토큰 보충, 시간 경과 로직의 상태 기반 테스트입니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["Rate Limit", "상태 기반 테스트", "시간 제어"],
    href: "/problems/problem-h07",
  },
  // Fintech
  {
    domain: "fintech",
    emoji: "💰",
    title: "출금 가능 여부 판단 테스트",
    scenario: "잔액, 한도, 상태 조건을 조합한 출금 가능 여부 경계값 테스트입니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["경계값", "금융", "입력 검증"],
    href: "/problems/problem-ft-e01",
  },
  {
    domain: "fintech",
    emoji: "💳",
    title: "거래 금액 구간별 수수료 계산 테스트",
    scenario: "금액 구간별 수수료율 적용의 경계값과 반올림 오류를 검증합니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["동등 분할", "금융", "정수"],
    href: "/problems/problem-ft-e03",
  },
  {
    domain: "fintech",
    emoji: "⚠️",
    title: "계층형 예외 처리 주문 테스트",
    scenario: "여러 단계에서 발생하는 예외 전파와 처리 로직을 검증합니다.",
    difficulty: "Hard" as const,
    mutants: 8,
    badges: ["예외 처리", "딕셔너리", "입력 검증"],
    href: "/problems/problem-h04",
  },
  // Platform
  {
    domain: "platform",
    emoji: "🔑",
    title: "JWT 토큰 형식 검증 테스트",
    scenario: "토큰 구조, 필드 존재, 형식 오류 등 인증 로직의 허점을 찾습니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["보안", "문자열", "입력 검증"],
    href: "/problems/problem-pl-e01",
  },
  {
    domain: "platform",
    emoji: "⚡",
    title: "서킷브레이커 상태 머신 테스트",
    scenario: "CLOSED/OPEN/HALF_OPEN 상태 전이와 복구 로직을 검증합니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["상태 기반 테스트", "재시도/복원력", "시간 제어"],
    href: "/problems/problem-h09",
  },
  {
    domain: "platform",
    emoji: "🔄",
    title: "비결정적 코드의 결정적 테스트",
    scenario: "랜덤, 시간 의존 코드를 테스트 가능하게 만드는 기법을 연습합니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["결정 테이블", "의존성 주입", "날짜/시간"],
    href: "/problems/problem-m07",
  },
  // Content
  {
    domain: "content",
    emoji: "📝",
    title: "장바구니 아이템 검증 테스트",
    scenario: "상품 정보의 필수 필드와 값 범위를 검증하는 경계값 테스트입니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["경계값", "리스트", "장바구니"],
    href: "/problems/problem-e03",
  },
  {
    domain: "content",
    emoji: "📄",
    title: "페이지네이션 응답 헬퍼 테스트",
    scenario: "offset, limit, 전체 개수 계산의 경계값을 검증합니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["페이지네이션", "경계값", "API"],
    href: "/problems/problem-m08",
  },
  {
    domain: "content",
    emoji: "🔒",
    title: "안전한 마크다운 HTML 변환기 테스트",
    scenario: "XSS 공격 벡터와 마크다운 파싱 엣지케이스를 검증합니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["보안", "파싱", "문자열"],
    href: "/problems/problem-ct-h01",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - 2컬럼 레이아웃 */}
      <section className="relative min-h-[70svh] flex items-center justify-center overflow-hidden py-8 lg:py-12">
        {/* Background Image */}
        <Image
          src="/images/hero-background.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
          {/* 2컬럼 그리드: Desktop (좌: 카피/CTA, 우: ResultPanel) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* 좌측: 카피 + CTA */}
            <div className="text-center lg:text-left">
              <div className="bg-black/15 backdrop-blur-sm rounded-2xl px-6 py-6 sm:px-8 sm:py-8 inline-block">
                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-5xl font-bold text-white drop-shadow-lg hero-headline leading-tight">
                  당신의 테스트는<br className="hidden sm:block" />{' '}
                  <span className="highlight">버그를 잡을 수 있습니까?</span>
                </h1>
                <p className="mt-5 text-base sm:text-lg text-white/85 max-w-xl lg:max-w-none">
                  테스트 커버리지 100%의 함정을 확인해보세요.
                </p>
              </div>

            </div>

            {/* 우측: HeroResultPanel */}
            <div className="flex justify-center lg:justify-end">
              <HeroResultPanel />
            </div>
          </div>

          {/* 하단: 단순화된 CTA */}
          <div className="mt-10 lg:mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-500/30 hover:scale-[1.02]"
            >
              3분 만에 실력 측정하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-white/50 text-sm">로그인 없이 바로 시작</span>
          </div>
        </div>
      </section>

      {/* Proof Points Section */}
      <section id="why" className="section-base bg-[var(--surface)] relative scroll-mt-16">
        <div className="section-container">
          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title break-keep">
              테스트 통과 ≠ 버그 없음
            </h2>
            <p className="section-subtitle break-keep">
              테스트가 초록불(Pass)이라고 해서, 버그가 없는 것은 아닙니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: 버그 탐지율 채점 */}
            <div className="card-base p-8 text-center min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                {/* 타겟 + 버그 아이콘 */}
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  {/* 타겟 원 */}
                  <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                  <circle cx="12" cy="12" r="5" strokeWidth={1.5} />

                  {/* 십자선 */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 3v4M12 17v4M3 12h4M17 12h4"
                  />

                  {/* 버그 몸통 */}
                  <ellipse cx="12" cy="12" rx="2" ry="2.5" strokeWidth={1.5} fill="currentColor" />

                  {/* 버그 더듬이 */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10.5 10l-1-1.5M13.5 10l1-1.5"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">숨은 버그 탐지율 채점</h3>
              <p className="card-desc text-sm text-[var(--text-secondary)] leading-relaxed px-2">
                단순 커버리지가 아닙니다. </p>
              <p className="card-desc text-sm text-[var(--text-secondary)] leading-relaxed px-2">
                <span className="font-semibold text-[var(--accent)]">{''}버그 탐지율</span>{' '}
              로 진짜 검증 강도를 측정합니다.</p>
            </div>

            {/* Card 2: 브라우저 즉시 실행 */}
            <div className="card-base p-8 text-center min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                {/* 브라우저 + 플레이 아이콘 */}
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  {/* 브라우저 창 */}
                  <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={1.5} />

                  {/* 브라우저 상단 바 */}
                  <path strokeWidth={1.5} d="M3 8h18" />

                  {/* 상단 점들 */}
                  <circle cx="6" cy="6" r="0.8" fill="currentColor" />
                  <circle cx="9" cy="6" r="0.8" fill="currentColor" />

                  {/* 플레이 버튼 (fill-only) */}
                  <path fill="currentColor" d="M10 11v6l5-3-5-3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">브라우저에서 즉시 실행</h3>
              <p className="card-desc text-sm text-[var(--text-secondary)] leading-relaxed px-2">
                <span className="font-semibold text-[var(--accent)]">로컬 세팅 없이</span>{' '}
                바로 코드를 작성하고, 실행 결과와 로그를 즉시 확인합니다.
              </p>
            </div>

            {/* Card 3: AI 분석 리포트 */}
            <div className="card-base p-8 text-center min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                {/* 문서 + 돋보기 + AI 노드 아이콘 */}
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  {/* 문서 */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4h10l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 4v4h4" />

                  {/* 문서 라인 */}
                  <path strokeLinecap="round" strokeWidth={1.5} d="M7 9h4" />
                  <path strokeLinecap="round" strokeWidth={1.5} d="M7 12h6" />

                  {/* 돋보기 */}
                  <circle cx="17" cy="17" r="3" strokeWidth={1.5} />
                  <path strokeLinecap="round" strokeWidth={1.5} d="M19.5 19.5L22 22" />

                  {/* AI 노드 점들 */}
                  <circle cx="8" cy="16" r="1" fill="currentColor" />
                  <circle cx="12" cy="16" r="1" fill="currentColor" />

                  {/* 노드 연결 */}
                  <path strokeWidth={1.5} d="M9 16h2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">AI 분석 리포트</h3>
              <p className="card-desc text-sm text-[var(--text-secondary)] leading-relaxed px-2">
                놓친 케이스와 취약 지점을 요약하고{" "}
                <span className="card-desc font-semibold text-[var(--accent)] whitespace-nowrap">
                  보완할 테스트 우선순위
                </span>{" "}
                를 제안합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section - Dark Theme with Domain Filter */}
      <ScenarioShowcase
        domains={domains.map((d) => ({ key: d.key, label: d.label }))}
        problems={showcase}
      />

      {/* Features Section */}
      <section id="features" className="section-base bg-[var(--background)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title break-keep">
              막막했던 테스트 설계, 3단계로 완성됩니다
            </h2>
            <p className="section-subtitle break-keep">
              이론이 아니라 실전입니다. 시나리오 → 검증 → 회고로 테스트 설계를 완성하세요.
            </p>
          </div>

          {/* Feature Cards Grid with Flow Arrows (5-column layout) */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-8 md:gap-6 md:items-center">
            {/* STEP 01 Card */}
            <div className="card-base group overflow-hidden !p-0">
              <div className="relative aspect-square">
                <Image
                  src={features[0].image}
                  alt={features[0].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 dark:from-slate-800/90 to-transparent" />
              </div>
              <div className="relative -mt-7 flex justify-center">
                <div className={`h-14 w-14 rounded-full ${features[0].iconBg} shadow ring-1 ring-black/5 grid place-items-center`}>
                  <div className={features[0].iconColor}>{features[0].icon}</div>
                </div>
              </div>
              <div className="px-6 pb-7 pt-4 text-center">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{features[0].title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{features[0].description}</p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center justify-center -translate-y-12">
              <svg
                className="w-16 h-6 text-slate-400/70 dark:text-slate-500/70"
                viewBox="0 0 64 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M2 12H54" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                <path d="M50 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* STEP 02 Card */}
            <div className="card-base group overflow-hidden !p-0">
              <div className="relative aspect-square">
                <Image
                  src={features[1].image}
                  alt={features[1].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 dark:from-slate-800/90 to-transparent" />
              </div>
              <div className="relative -mt-7 flex justify-center">
                <div className={`h-14 w-14 rounded-full ${features[1].iconBg} shadow ring-1 ring-black/5 grid place-items-center`}>
                  <div className={features[1].iconColor}>{features[1].icon}</div>
                </div>
              </div>
              <div className="px-6 pb-7 pt-4 text-center">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{features[1].title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{features[1].description}</p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center justify-center -translate-y-12">
              <svg
                className="w-16 h-6 text-slate-400/70 dark:text-slate-500/70"
                viewBox="0 0 64 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M2 12H54" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                <path d="M50 6l6 6-6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* STEP 03 Card */}
            <div className="card-base group overflow-hidden !p-0">
              <div className="relative aspect-square">
                <Image
                  src={features[2].image}
                  alt={features[2].title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 dark:from-slate-800/90 to-transparent" />
              </div>
              <div className="relative -mt-7 flex justify-center">
                <div className={`h-14 w-14 rounded-full ${features[2].iconBg} shadow ring-1 ring-black/5 grid place-items-center`}>
                  <div className={features[2].iconColor}>{features[2].icon}</div>
                </div>
              </div>
              <div className="px-6 pb-7 pt-4 text-center">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{features[2].title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{features[2].description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Guest Mode Banner Section - 로그인 상태에 따라 분기 */}
      <GuestModeBanner />

      {/* Target Audience Section */}
      <section className="section-base bg-[var(--surface)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              이런 분들을 위한 플랫폼입니다
            </h2>
            <p className="section-subtitle">
              QA Arena는 테스트 역량을 키우고 싶은 모든 분을 위해 만들어졌습니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="card-base group relative overflow-hidden !p-0"
              >
                {/* Image area */}
                <div className="relative h-44">
                  <Image
                    src={a.imageSrc}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority={false}
                  />
                  {/* readability overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-white/90 dark:to-slate-800/90" />
                </div>

                {/* Icon badge (overlap) */}
                <div className="relative -mt-7 flex justify-center">
                  <div className={`h-14 w-14 rounded-full ${a.iconBg} shadow ring-1 ring-black/5 grid place-items-center`}>
                    <div className={a.iconColor}>{a.icon}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-7 pt-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{a.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{a.desc}</p>
                </div>

                {/* subtle hover sheen (optional) */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -left-24 top-10 h-24 w-40 rotate-12 bg-white/20 blur-2xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Final CTA Section */}
<section className="section-base relative overflow-hidden bg-[var(--background)]">
  {/* subtle brand glow - 라이트 모드만 */}
  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-blue-600/10 dark:from-transparent dark:via-transparent dark:to-transparent" />
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.18),transparent_55%)] dark:bg-transparent" />

  <div className="section-container relative !max-w-4xl text-center py-16 sm:py-20">
    <h2 className="section-title mb-4 text-slate-900 dark:text-white">
      QA 역량, 운영에서 터지기 전에 잡아내세요
    </h2>

    <p className="mb-8 max-w-xl mx-auto text-[var(--text-secondary)]">
      3분 안에 첫 문제를 풀고, 테스트 품질 피드백을 바로 받아볼 수 있습니다.
    </p>

    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        href="/problems"
        className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-lg
                   bg-blue-600 text-white shadow-lg transition
                   hover:bg-blue-700 hover:shadow-xl
                   dark:bg-[#238636] dark:hover:bg-[#2ea043]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-[#0d1117]"
      >
        첫 문제 풀러 가기
      </Link>

      <Link
        href="/scenarios"
        className="inline-flex items-center justify-center px-10 py-4 rounded-xl font-semibold text-lg
                   bg-white text-slate-900 border border-slate-200 shadow-sm transition
                   hover:bg-slate-50
                   dark:bg-[#21262d] text-[var(--foreground)] dark:border-[#30363d] dark:hover:bg-[#30363d] dark:hover:border-[#484f58]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-[#0d1117]"
      >
        시나리오 둘러보기
      </Link>
    </div>

    <p className="mt-6 text-sm text-[var(--text-muted)]">
      회원가입 없이도 시작할 수 있어요.
    </p>
  </div>
</section>
    </div>
  );
}
