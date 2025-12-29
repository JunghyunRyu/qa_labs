"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import HowItWorksSection from "@/components/how-it-works/HowItWorksSection";

// Hero copy constants
const heroCopy = {
  headline: "AI가 코드를 더 빨리 쓰는 시대, 실력은 '숨은 버그를 찾아내는 설계'로 증명됩니다.",
  subLine1: "AI는 구현을 빠르게 돕습니다. 하지만 어떤 케이스가 위험한지는 업무 맥락이 정합니다.",
  micro: "AI 도우미는 정답이 아니라, 놓친 케이스와 다음 테스트 설계를 제안합니다.",
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
    title: "STEP 02. 탐지력(킬 비율)로 검증",
    description: "숨은 버그(변이)를 심어, 내 테스트가 결함을 얼마나 잡는지 점수로 확인합니다.",
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
    description: "놓친 케이스와 취약 지점을 요약하고, 보완할 테스트 우선순위를 제안합니다.",
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
  const [selectedDomain, setSelectedDomain] = useState("common");
  const currentDomain = domains.find((d) => d.key === selectedDomain) || domains[0];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[70svh] flex items-center justify-center overflow-hidden py-8">
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
        <div className="relative z-10 flex flex-col items-center gap-5 px-4 text-center">
          <div className="bg-black/15 backdrop-blur-sm rounded-2xl px-6 py-6 sm:px-10 sm:py-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg hero-headline">
              AI가 코드를 더 빨리 쓰는 시대,<br className="desktop-break" />{' '}
              실력은 <span className="highlight">&apos;숨은 버그를 찾아내는 설계&apos;</span>로 증명됩니다.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl mx-auto">
              실무 시나리오에서{" "}
              <span className="font-semibold text-white">숨은 버그를 얼마나 잡는지</span>
              , 탐지율로 확인하세요.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <Link
              href={`/problems${selectedDomain !== "common" ? `?domain=${selectedDomain}` : ""}`}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              {currentDomain.cta}
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-3 text-white/80 text-sm font-medium hover:text-white transition-colors"
            >
              진행 방식 보기 ↓
            </a>
          </div>

          {/* Featured Problem Card - CTA 바로 아래 배치 */}
          <div className="mt-6 mx-auto w-full max-w-xl">
            <p className="mb-2 text-xs text-white/50 text-center">
              처음이라면 이 문제로 시작 →
            </p>
            <Link
              href="/problems/problem-e04"
              className="group cursor-pointer
                         flex items-center justify-between gap-4 rounded-2xl
                         border-2 border-white/20 bg-white/10 px-5 py-4 backdrop-blur
                         transition-colors transition-shadow transition-transform
                         hover:bg-white/15 hover:border-blue-400/60
                         hover:shadow-[0_0_24px_rgba(59,130,246,0.22)]
                         active:scale-[0.985]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70
                         focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
            >
              <div className="min-w-0 text-left">
                <span className="block text-base font-semibold text-white truncate
                                 group-hover:text-blue-100 group-focus-visible:text-blue-100 transition-colors">
                  점수 등급 계산 함수 테스트
                </span>
                <span className="block mt-1 text-sm text-white/75
                                 group-hover:text-white/90 group-focus-visible:text-white/90 transition-colors">
                  Easy · 숨은 버그 5개 · 경계값 · 동등분할
                </span>
              </div>
              <span className="shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold
                               bg-blue-600 text-white shadow-lg transition-colors
                               group-hover:bg-blue-500 group-focus-visible:bg-blue-500">
                도전하기
                <ChevronRight className="w-4 h-4 transition-transform
                                         group-hover:translate-x-1 group-focus-visible:translate-x-1" />
              </span>
            </Link>
          </div>

          {/* Domain Badges */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/60 mb-2">{heroCopy.domainLabel}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {domains.map((d) => (
                <button
                  key={d.key}
                  title={d.title}
                  onClick={() => {
                    setSelectedDomain(d.key);
                    // 커스텀 스무스 스크롤 (브라우저 smooth 무시 문제 해결)
                    requestAnimationFrame(() => {
                      const el = document.getElementById("scenario-showcase");
                      if (!el) return;
                      const headerOffset = 96;
                      const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset;
                      const startY = window.scrollY;
                      const diff = targetY - startY;
                      const duration = 600; // ms
                      let startTime: number | null = null;

                      const easeInOutCubic = (t: number) =>
                        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

                      const animateScroll = (currentTime: number) => {
                        if (!startTime) startTime = currentTime;
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const easeProgress = easeInOutCubic(progress);
                        window.scrollTo(0, startY + diff * easeProgress);
                        if (progress < 1) requestAnimationFrame(animateScroll);
                      };

                      requestAnimationFrame(animateScroll);
                    });
                  }}
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
            <p className="mt-2 text-xs text-white/50">
              도메인을 고르면 추천 문제가 바뀝니다 · {currentDomain.hint}
            </p>
          </div>
        </div>
      </section>

      {/* Proof Points Section */}
      <section id="why" className="section-base bg-[var(--surface)] relative scroll-mt-16">
        <div className="section-container">
          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title break-keep">
              왜 정답 통과만으로는 부족할까요?
            </h2>
            <p className="section-subtitle break-keep">
              정답 여부를 넘어, 숨은 버그를 잡는 힘을 측정하고 개선합니다.
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">숨은 버그 탐지율 채점</h3>
              <p className="card-desc text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                정답 통과가 아니라, 테스트가 결함을 얼마나 잡는지{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">검증 강도</span>를
                점수로 확인합니다.
              </p>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">브라우저에서 즉시 실행</h3>
              <p className="card-desc text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">로컬 세팅 없이</span>{' '}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI 분석 리포트</h3>
              <p className="card-desc text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-2">
                놓친 케이스와 취약 지점을 요약하고{" "}
                <span className="card-desc font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                  보완할 테스트 우선순위를
                </span>{" "}
                제안합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase Section - Dark Theme */}
      <section
        id="scenario-showcase"
        className="section-base bg-slate-900 dark:bg-slate-950 relative overflow-hidden scroll-mt-24"
      >
        {/* Grid Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 60%),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 40px 40px, 40px 40px',
          }}
        />
        <div className="section-container relative z-10">
          <div className="section-header">
            <h2 className="section-title !text-white">
              {selectedDomain === "common"
                ? "이런 버그, 찾아낼 수 있나요?"
                : `${currentDomain.label} 시나리오 추천`}
            </h2>
            <p className="section-subtitle !text-slate-300">
              {selectedDomain === "common"
                ? <>평범한 테스트는 통과합니다. 하지만 운영에서는 사고가 납니다.<br className="hidden sm:block" />실제 현업에서 자주 발생하는 시나리오를 미리 확인해보세요.</>
                : <>{currentDomain.title} 도메인에서 자주 발생하는 버그 시나리오입니다.<br className="hidden sm:block" />실무에서 놓치기 쉬운 케이스를 미리 연습해보세요.</>}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {showcase
              .filter((p) => p.domain === selectedDomain)
              .slice(0, 3)
              .map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="card-dark group flex flex-col h-full"
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
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* 도메인별 더 보기 버튼 */}
            {selectedDomain !== "common" && (
              <Link
                href={`/problems?domain=${selectedDomain}`}
                className="inline-flex items-center justify-center rounded-full border border-white/30 bg-transparent px-6 py-3 text-sm font-medium text-white hover:bg-white/10 hover:border-white transition-colors"
              >
                {currentDomain.label} 더 보기
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            {/* 전체 문제 보기 버튼 */}
            <Link
              href="/problems"
              className="inline-flex items-center justify-center rounded-full border border-blue-400/50 bg-blue-500/20 px-6 py-3 text-sm font-medium text-blue-300 hover:bg-blue-500/30 hover:border-blue-400 transition-colors"
            >
              전체 문제 보기
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{features[0].title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{features[0].description}</p>
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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{features[1].title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{features[1].description}</p>
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
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{features[2].title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{features[2].description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* AI Feedback Sample Section */}
      <section id="ai-feedback" className="section-base bg-[var(--background)] scroll-mt-16">
        <div className="section-container !max-w-4xl">
          <div className="section-header">
            <h2 className="section-title">
              AI 도우미가 이렇게 피드백합니다
            </h2>
            <p className="section-subtitle">
              채점 완료 후 AI가 코드를 분석하여 개선 방향을 제시합니다
            </p>
          </div>

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
      <section className="section-base bg-[var(--surface)]">
        <div className="section-container !max-w-4xl text-center">
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
      <section className="section-base bg-[var(--background)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">
              누구를 위한 플랫폼인가요?
            </h2>
            <p className="section-subtitle">
              QA-Arena는 테스트 역량을 키우고 싶은 모든 분을 위해 만들어졌습니다
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
      <section className="section-base bg-gradient-to-br from-sky-500 to-blue-600">
        <div className="section-container !max-w-4xl text-center">
          <h2 className="section-title !text-white !mb-4">
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
