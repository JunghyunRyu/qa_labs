"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Hero copy constants
const heroCopy = {
  headline: "AI가 코드를 더 빨리 쓰는 시대, 실력은 '숨은 버그를 찾아내는 설계'로 증명됩니다.",
  subLine1: "AI는 구현을 빠르게 돕습니다. 하지만 어떤 케이스가 위험한지는 업무 맥락이 정합니다.",
  micro: "AI 코치는 정답이 아니라, 놓친 케이스와 다음 테스트 설계를 제안합니다.",
  domainLabel: "실무 도메인으로 시작하기",
  domainHelper: "도메인을 선택하면 문제/추천 트랙이 해당 업무 시나리오로 맞춰집니다.",
};

const domains = [
  { key: "common", label: "Common", title: "공통 시나리오", cta: "내 버그 탐지율 측정하기", hint: "경계값 · 예외처리 · 타입검증 · 널체크" },
  { key: "fintech", label: "Fintech", title: "결제/정산/수수료", cta: "Fintech 시나리오로 진단하기", hint: "정산 · 수수료 · 반올림 · 중복결제" },
  { key: "commerce", label: "Commerce", title: "재고/주문/쿠폰", cta: "Commerce 시나리오로 진단하기", hint: "쿠폰 · 재고 · 주문 · 가격우선순위" },
  { key: "saas", label: "SaaS", title: "권한/요금제/쿼터", cta: "SaaS 시나리오로 진단하기", hint: "권한 · 요금제 · 쿼터 · 레이트리밋" },
  { key: "platform", label: "Platform", title: "상태전이/복구/장애", cta: "Platform 시나리오로 진단하기", hint: "상태전이 · 재시도 · 서킷브레이커" },
  { key: "content", label: "Content", title: "문자열/정규화/발송", cta: "Content 시나리오로 진단하기", hint: "길이 · 정규화 · 금칙어 · 발송제한" },
];

// Feature Card 데이터
const features = [
  {
    image: "/images/qa-scenario-card.png",
    title: "실전 버그 헌팅 시나리오",
    description: "경계값, 예외 처리 등 실무에서 자주 놓치는 버그 패턴을 학습하세요",
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
    title: "Mutant 기반 자동 채점",
    description: "정답 코드와 버그 코드에 테스트를 실행해 버그 탐지율로 채점합니다",
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
    title: "AI 코치의 맞춤 피드백",
    description: "잘한 점, 개선점, 놓친 테스트 케이스를 AI가 구체적으로 제안합니다",
    iconBg: "bg-sky-100 dark:bg-sky-900/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

// How It Works 단계 데이터
const steps = [
  { number: "01", title: "문제 선택", description: "난이도와 스킬 태그로 원하는 QA 문제를 선택하세요" },
  { number: "02", title: "테스트 코드 작성", description: "브라우저 에디터에서 pytest 테스트 코드를 작성하세요" },
  { number: "03", title: "버그 탐지 채점", description: "정답/버그 코드에 테스트를 실행해 탐지율을 계산합니다" },
  { number: "04", title: "AI 피드백 수령", description: "AI 코치가 잘한 점, 개선점, 추가 테스트 케이스를 제안합니다" },
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

// Showcase 데이터 (실무 시나리오 하이라이트)
const showcase = [
  // Common
  {
    domain: "common",
    emoji: "🔢",
    title: "리스트 합계 경계값 테스트",
    scenario: "빈 리스트, 음수, off-by-one 오류는 가장 흔하지만 가장 자주 놓치는 버그입니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["빈 리스트", "음수 입력", "±1 오차"],
    href: "/problems/problem-e01",
  },
  {
    domain: "common",
    emoji: "⚠️",
    title: "예외 처리 누락 테스트",
    scenario: "None/null 체크, 타입 검증 누락은 런타임 크래시의 주범입니다.",
    difficulty: "Easy" as const,
    mutants: 5,
    badges: ["널 체크", "타입 검증", "예외 전파"],
    href: "/problems/problem-e02",
  },
  {
    domain: "common",
    emoji: "🔄",
    title: "문자열 파싱 엣지케이스",
    scenario: "공백, 특수문자, 유니코드 처리 누락은 데이터 손상으로 이어집니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["공백 처리", "특수문자", "인코딩"],
    href: "/problems/problem-m02",
  },
  // Commerce
  {
    domain: "commerce",
    emoji: "🛒",
    title: "장바구니 합계 경계값 테스트",
    scenario: "빈 장바구니/음수/계산 오차 처리 누락은 결제 단계에서 장애와 환불 이슈로 이어집니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["±1 오차", "빈 리스트", "음수 입력"],
    href: "/problems/problem-e15",
  },
  {
    domain: "commerce",
    emoji: "🎫",
    title: "쿠폰 적용 우선순위 테스트",
    scenario: "중복 쿠폰, 최소금액 미달, 만료 체크 누락은 매출 손실로 직결됩니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["중복 적용", "최소금액", "만료 검증"],
    href: "/problems/problem-m03",
  },
  {
    domain: "commerce",
    emoji: "📦",
    title: "재고 동시성 테스트",
    scenario: "동시 주문 시 재고 차감 경쟁 조건은 overselling 사고로 이어집니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["경쟁 조건", "원자성", "롤백"],
    href: "/problems/problem-h02",
  },
  // SaaS
  {
    domain: "saas",
    emoji: "🔐",
    title: "사용자 인증 예외 테스트",
    scenario: "만료 토큰·필드 누락·서명 오류를 놓치면 보안 사고 또는 로그인 장애로 이어집니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["만료된 토큰", "필드 누락", "서명 불일치"],
    href: "/problems/problem-m01",
  },
  {
    domain: "saas",
    emoji: "👥",
    title: "권한 검증 테스트",
    scenario: "역할 기반 접근제어 누락은 데이터 유출과 권한 상승 취약점이 됩니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["역할 검증", "리소스 소유권", "권한 상승"],
    href: "/problems/problem-m04",
  },
  {
    domain: "saas",
    emoji: "📊",
    title: "요금제 쿼터 테스트",
    scenario: "API 호출 한도, 저장 용량 초과 처리 누락은 무료 사용자의 유료 기능 접근을 허용합니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["쿼터 초과", "플랜 검증", "레이트리밋"],
    href: "/problems/problem-h03",
  },
  // Fintech
  {
    domain: "fintech",
    emoji: "💸",
    title: "결제 금액 계산 엣지 케이스",
    scenario: "쿠폰/할인/세금 적용 순서가 바뀌면 과금 오류와 정산 불일치가 즉시 발생합니다.",
    difficulty: "Hard" as const,
    mutants: 8,
    badges: ["반올림 오류", "쿠폰 중복", "세금 계산 순서"],
    href: "/problems/problem-h01",
  },
  {
    domain: "fintech",
    emoji: "🔄",
    title: "중복 결제 방지 테스트",
    scenario: "네트워크 재시도, 버튼 더블클릭 시 중복 차감은 환불 클레임으로 이어집니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["멱등성", "재시도", "트랜잭션"],
    href: "/problems/problem-m05",
  },
  {
    domain: "fintech",
    emoji: "📈",
    title: "수수료 정산 테스트",
    scenario: "소수점 처리, 통화 변환, 수수료율 적용 순서 오류는 정산 불일치를 만듭니다.",
    difficulty: "Hard" as const,
    mutants: 8,
    badges: ["소수점 처리", "통화 변환", "정산 순서"],
    href: "/problems/problem-h04",
  },
  // Platform
  {
    domain: "platform",
    emoji: "🔄",
    title: "상태 전이 테스트",
    scenario: "잘못된 상태 전이 허용은 데이터 정합성 붕괴와 복구 불가능 상태로 이어집니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["상태 머신", "전이 검증", "불변 조건"],
    href: "/problems/problem-m06",
  },
  {
    domain: "platform",
    emoji: "⚡",
    title: "서킷브레이커 테스트",
    scenario: "외부 서비스 장애 전파 차단 실패는 전체 시스템 다운으로 확대됩니다.",
    difficulty: "Hard" as const,
    mutants: 7,
    badges: ["장애 격리", "폴백", "복구"],
    href: "/problems/problem-h05",
  },
  {
    domain: "platform",
    emoji: "🔁",
    title: "재시도 로직 테스트",
    scenario: "무한 재시도, 백오프 누락은 시스템 과부하와 연쇄 장애를 유발합니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["최대 재시도", "지수 백오프", "타임아웃"],
    href: "/problems/problem-m07",
  },
  // Content
  {
    domain: "content",
    emoji: "📝",
    title: "문자열 길이 검증 테스트",
    scenario: "바이트/문자 길이 혼동, 이모지 처리 누락은 DB 오류와 UI 깨짐을 유발합니다.",
    difficulty: "Easy" as const,
    mutants: 4,
    badges: ["바이트 길이", "유니코드", "이모지"],
    href: "/problems/problem-e03",
  },
  {
    domain: "content",
    emoji: "🚫",
    title: "금칙어 필터 테스트",
    scenario: "우회 패턴(띄어쓰기, 유사문자) 미탐지는 커뮤니티 운영 리스크가 됩니다.",
    difficulty: "Medium" as const,
    mutants: 6,
    badges: ["우회 패턴", "정규화", "유사문자"],
    href: "/problems/problem-m08",
  },
  {
    domain: "content",
    emoji: "📧",
    title: "발송 제한 테스트",
    scenario: "일일 한도, 수신 거부, 중복 발송 체크 누락은 스팸 신고와 서비스 차단으로 이어집니다.",
    difficulty: "Medium" as const,
    mutants: 5,
    badges: ["일일 한도", "수신 거부", "중복 방지"],
    href: "/problems/problem-m09",
  },
];

// Sample Problems 데이터 (메인 페이지 미리보기용)
const sampleProblems = [
  {
    title: "리스트 합계 경계값 테스트",
    description: "정수 리스트를 입력받아 합을 계산하는 함수의 경계값을 테스트하세요",
    difficulty: "Easy" as const,
    tag: "boundary",
    image: "/images/problems/boundary.png",
    bugPatterns: ["off-by-one", "empty list", "negative"],
    mutantCount: 4,
  },
  {
    title: "사용자 인증 예외 테스트",
    description: "잘못된 자격 증명과 만료된 토큰에 대한 예외 처리를 검증하세요",
    difficulty: "Medium" as const,
    tag: "exception",
    image: "/images/problems/auth.png",
    bugPatterns: ["expired token", "missing field", "invalid signature"],
    mutantCount: 6,
  },
  {
    title: "결제 금액 계산 테스트",
    description: "할인, 쿠폰, 세금이 복합 적용되는 결제 금액 계산의 엣지 케이스를 찾아내세요",
    difficulty: "Hard" as const,
    tag: "edge_case",
    image: "/images/problems/payment.png",
    bugPatterns: ["rounding", "coupon stacking", "tax order"],
    mutantCount: 8,
  },
];

// 난이도별 스타일 설정
const difficultyStyles = {
  Easy: "bg-green-500/90 text-white",
  Medium: "bg-yellow-500/90 text-white",
  Hard: "bg-red-500/90 text-white",
};

export default function Home() {
  const [selectedDomain, setSelectedDomain] = useState("common");
  const currentDomain = domains.find((d) => d.key === selectedDomain) || domains[0];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[75svh] flex items-center justify-center overflow-hidden">
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

        {/* Content - with panel background for better readability */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          <div className="bg-black/25 backdrop-blur-sm rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg hero-headline">
              AI가 코드를 더 빨리 쓰는 시대,<br className="desktop-break" />{' '}
              실력은 <span className="highlight">&apos;숨은 버그를 찾아내는 설계&apos;</span>로 증명됩니다.
            </h1>
            <div className="mt-6 text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              <span className="block">{heroCopy.subLine1}</span>
              <span className="block mt-2">
                실무 시나리오에서{" "}
                <span className="font-semibold text-white underline underline-offset-4 decoration-white/40">
                  숨은 버그를 얼마나 잡는지(탐지율)
                </span>
                로 검증 범위를 숫자로 확인하세요.
              </span>
            </div>

            {/* Micro copy */}
            <p className="mt-4 text-sm text-white/60 max-w-xl mx-auto">
              {heroCopy.micro}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href={`/problems${selectedDomain !== "common" ? `?domain=${selectedDomain}` : ""}`}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              {currentDomain.cta}
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/30"
            >
              실무 시나리오 둘러보기
            </a>
          </div>

          {/* Domain Badges */}
          <div className="mt-12 text-center">
            <p className="text-sm md:text-base font-medium text-white/75 mb-3">{heroCopy.domainLabel}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {domains.map((d) => (
                <button
                  key={d.key}
                  title={d.title}
                  onClick={() => setSelectedDomain(d.key)}
                  className={`px-3.5 py-1.5 text-sm rounded-full border transition-all cursor-pointer ${
                    selectedDomain === d.key
                      ? "bg-white/30 text-white border-white/50 font-semibold"
                      : "text-white/90 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 hover:border-white/40"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-white/65 leading-relaxed">{heroCopy.domainHelper}</p>
            {/* Domain hint - changes based on selection */}
            <p className="mt-3 text-xs text-blue-300/80 font-medium tracking-wide">
              {currentDomain.hint}
            </p>
          </div>
        </div>
      </section>

      {/* Proof Points Section */}
      <section className="proof-points-section py-16 bg-slate-50 dark:bg-gray-900/50 relative">
        {/* Top Divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: 버그 탐지율 채점 */}
            <div className="proof-card bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">숨은 버그 탐지율 채점</h3>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                정답 통과가 아니라
              </p>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                숨은 버그를 얼마나 잡는지로 점수를 냅니다.
              </p>
            </div>

            {/* Card 2: 브라우저 즉시 실행 */}
            <div className="proof-card bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">브라우저에서 즉시 실행</h3>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                로컬 세팅 없이 바로 실행하고,</p>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                결과와 로그를 즉시 확인합니다.
              </p>
            </div>

            {/* Card 3: AI 코치 리포트 */}
            <div className="proof-card bg-white dark:bg-gray-800 p-8 rounded-2xl text-center border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 min-h-[280px] flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI 코치 리포트</h3>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                놓친 케이스와 다음 테스트를
              </p>
              <p className="card-desc text-sm text-gray-500 dark:text-gray-400 px-2">
                바로 실행 가능한 액션으로 정리합니다.
              </p>              
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section - Dark Theme with Spotlight */}
      <section
        className="relative overflow-hidden py-16"
        style={{
          backgroundColor: '#0f172a',
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0) 60%),
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px',
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              {selectedDomain === "common"
                ? "이런 버그, 찾아낼 수 있나요?"
                : `${currentDomain.label} 시나리오 추천`}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-slate-300">
              {selectedDomain === "common"
                ? <>평범한 테스트는 통과합니다. 하지만 운영에서는 사고가 납니다.<br className="hidden sm:block" />실제 현업에서 자주 발생하는 시나리오를 미리 확인해보세요.</>
                : <>{currentDomain.title} 도메인에서 자주 발생하는 버그 시나리오입니다.<br className="hidden sm:block" />실무에서 놓치기 쉬운 케이스를 미리 연습해보세요.</>}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {showcase
              .filter((p) => p.domain === selectedDomain)
              .slice(0, 3)
              .map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group flex flex-col h-full rounded-2xl border border-slate-700 bg-slate-800 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="rounded-full border border-slate-600 bg-slate-700 px-3 py-1 text-xs font-medium text-slate-200 capitalize">
                      {p.domain}
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className={`inline-block rounded px-2 py-1 text-xs font-bold ${
                      p.difficulty === 'Easy'
                        ? 'bg-green-500/20 text-green-400'
                        : p.difficulty === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {p.difficulty === 'Easy' ? '초급' : p.difficulty === 'Medium' ? '중급' : '고급'}
                    </span>
                    <div className="mt-1.5 text-slate-400">🐞 숨은 버그: {p.mutants}개</div>
                  </div>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-white group-hover:text-slate-100">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{p.scenario}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {p.badges.map((b) => (
                    <span
                      key={b}
                      className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                    >
                      {b}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-6 text-sm font-bold text-blue-400 group-hover:text-blue-300 transition-colors inline-flex items-center gap-1">
                  도전하기
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA 버튼 - 섹션 하단 중앙 */}
          <div className="mt-10 text-center">
            <Link
              href={`/problems${selectedDomain !== "common" ? `?domain=${selectedDomain}` : ""}`}
              className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10 hover:border-white transition-colors"
            >
              {selectedDomain === "common" ? "실무 시나리오 더 보기" : `${currentDomain.label} 문제 전체 보기`}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[var(--foreground)]">
            주요 기능
          </h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-2xl mx-auto">
            QA-Arena는 실무 중심의 학습 경험을 제공합니다
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition hover:shadow-md"
              >
                {/* Image area - aspect-square 유지 */}
                <div className="relative aspect-square">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* readability overlay - 하단만 적용 */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 dark:from-slate-800/90 to-transparent" />
                </div>

                {/* Icon badge (overlap) */}
                <div className="relative -mt-7 flex justify-center">
                  <div className={`h-14 w-14 rounded-full ${feature.iconBg} shadow ring-1 ring-black/5 grid place-items-center`}>
                    <div className={feature.iconColor}>{feature.icon}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-7 pt-4 text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
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

      {/* Problem Preview Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[var(--foreground)]">
            이런 문제를 풀게 됩니다
          </h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-2xl mx-auto">
            실무에서 마주치는 다양한 버그 시나리오를 연습하세요
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sampleProblems.map((problem, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition hover:shadow-lg"
              >
                {/* 이미지 영역 (상단) - 160px 높이 */}
                <div className="relative h-40">
                  <Image
                    src={problem.image}
                    alt={problem.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />

                  {/* Mutants 배지 (우상단 오버레이) */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-purple-600/90 text-white text-xs font-semibold flex items-center gap-1 shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Mutants: {problem.mutantCount}
                  </div>

                  {/* 난이도/태그 배지 (좌하단 오버레이) */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${difficultyStyles[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 shadow-sm">
                      {problem.tag}
                    </span>
                  </div>

                  {/* 가독성 그라데이션 */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* 콘텐츠 영역 */}
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {problem.description}
                  </p>

                  {/* 버그 패턴 칩 (하단) */}
                  <div className="flex flex-wrap gap-1.5">
                    {problem.bugPatterns.map((pattern, patternIndex) => (
                      <span
                        key={patternIndex}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>

                {/* hover sheen effect */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -left-24 top-10 h-24 w-40 rotate-12 bg-white/20 blur-2xl" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              전체 문제 보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            이렇게 진행됩니다
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            간단한 4단계로 QA 역량을 키워보세요
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="space-y-6 order-2 lg:order-1">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Judge Image */}
            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/Judge.png"
                  alt="Judge System"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Feedback Sample Section */}
      <section className="py-16 sm:py-20 px-4 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[var(--foreground)]">
            AI 코치가 이렇게 피드백합니다
          </h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-2xl mx-auto">
            채점 완료 후 AI가 코드를 분석하여 개선 방향을 제시합니다
          </p>

          <div className="bg-[var(--card-background)] border border-[var(--card-border)] rounded-xl p-6 sm:p-8 shadow-lg">
            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
              <p className="text-[var(--foreground)]">
                기본적인 양수 입력 케이스는 잘 커버했지만, 음수와 빈 리스트에 대한 테스트가 부족합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div>
                <h4 className="font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  잘한 점
                </h4>
                <ul className="space-y-2 text-sm text-[var(--muted)]">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    정상 흐름에 대한 테스트를 잘 작성했습니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    assert 문을 명확하게 사용했습니다
                  </li>
                </ul>
              </div>

              {/* Weaknesses */}
              <div>
                <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  개선할 점
                </h4>
                <ul className="space-y-2 text-sm text-[var(--muted)]">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    경계값(빈 리스트, 0)에 대한 케이스가 없습니다
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    음수 값에 대한 테스트가 누락되었습니다
                  </li>
                </ul>
              </div>
            </div>

            {/* Suggested Tests */}
            <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                추가 테스트 제안
              </h4>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">→</span>
                  빈 리스트([]) 입력에 대한 테스트를 추가해 보세요
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">→</span>
                  음수가 포함된 리스트([-1, 1, 2])에 대한 테스트를 추가해 보세요
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Mode Banner Section */}
      <section className="py-12 px-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">로그인 없이 바로 시작</h2>
          </div>
          <p className="text-[var(--muted)] mb-6 max-w-xl mx-auto">
            게스트 모드로 즉시 문제를 풀고 채점 결과를 확인하세요.
            <br className="hidden sm:block" />
            GitHub 로그인 시 AI 피드백과 제출 기록 저장 기능이 추가됩니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/problems"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              게스트로 시작하기
            </Link>
            <Link
              href="/api/v1/auth/github/login"
              className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub로 로그인
            </Link>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-16 sm:py-20 px-4 bg-[var(--background)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[var(--foreground)]">
            누구를 위한 플랫폼인가요?
          </h2>
          <p className="text-center text-[var(--muted)] mb-12 max-w-2xl mx-auto">
            QA-Arena는 테스트 역량을 키우고 싶은 모든 분을 위해 만들어졌습니다
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {audiences.map((a) => (
              <div
                key={a.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition hover:shadow-md"
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
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-sky-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            QA 역량, 지금 바로 검증해보세요
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            3분이면 첫 문제를 풀고 AI 피드백을 받을 수 있습니다. 무료로 시작하세요.
          </p>
          <Link
            href="/problems"
            className="inline-block px-10 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
          >
            첫 문제 풀러 가기
          </Link>
        </div>
      </section>
    </div>
  );
}
