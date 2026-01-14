import type { Metadata } from "next";
import Link from "next/link";
import HowItWorksSection from "@/components/how-it-works/HowItWorksSection";
import HeroResultPanel from "@/components/hero/HeroResultPanel";
import ScenarioShowcase from "@/components/showcase/ScenarioShowcase";
import AITeaserSection from "@/components/home/AITeaserSection";
import HeroCTA from "@/components/landing/HeroCTA";
import FooterCTA from "@/components/landing/FooterCTA";

export const metadata: Metadata = {
  title: "QA Arena - 버그 탐지율 챌린지",
  description: "테스트 코드로 숨은 버그를 찾아내세요. 실전 시나리오와 AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼 by QaLabs",
  openGraph: {
    title: "QA Arena - 버그 탐지율 챌린지",
    description: "테스트 코드로 숨은 버그를 찾아내세요. AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼",
  },
};

// Domain 데이터 (Showcase 필터용)
const domains = [
  { key: "common", label: "공통", title: "공통 시나리오", hint: "경계값 · 예외처리 · 타입검증 · 널체크" },
  { key: "fintech", label: "핀테크", title: "결제/정산/수수료", hint: "정산 · 수수료 · 반올림 · 중복결제" },
  { key: "commerce", label: "커머스", title: "재고/주문/쿠폰", hint: "쿠폰 · 재고 · 주문 · 가격우선순위" },
  { key: "saas", label: "SaaS", title: "권한/요금제/쿼터", hint: "권한 · 요금제 · 쿼터 · 레이트리밋" },
  { key: "platform", label: "플랫폼", title: "상태전이/복구/장애", hint: "상태전이 · 재시도 · 서킷브레이커" },
  { key: "content", label: "콘텐츠", title: "문자열/정규화/발송", hint: "길이 · 정규화 · 금칙어 · 발송제한" },
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-violet-500/30">

      {/* ========================================
          1. Hero Section: Dark Theme + Neon Gradient
          ======================================== */}
      <section className="relative min-h-[85svh] flex items-center justify-center overflow-hidden py-20">
        {/* 배경 효과: Grid 패턴 */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow 효과 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* 좌측: Copywriting & CTA */}
            <div className="text-center lg:text-left space-y-8">
              {/* Live Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-700 backdrop-blur-sm mx-auto lg:mx-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-slate-300">🚀 Now Running: Mutation Analysis Engine</span>
              </div>

              {/* Main Title */}
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight break-keep">
                <span className="block text-white mb-2">당신의 테스트 방패는</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                  얼마나 촘촘합니까?
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mt-6">
                코드에 <strong className="text-slate-200">수백 개의 인공 버그(Mutants)</strong>를 심어 빈틈을 파고듭니다.<br className="hidden lg:block" />
                당신의 테스트가 이 공격을 막아낼 수 있는지 지금 검증하세요.
              </p>

              {/* CTA Buttons */}
              <HeroCTA />

              {/* Bonus Info */}
              <p className="text-sm text-slate-500">
                🎁 가입 즉시 <span className="text-blue-400 font-semibold">AI 분석 토큰 50개</span> 무료 제공
              </p>
            </div>

            {/* 우측: HeroResultPanel (동적 애니메이션 버전) */}
            <div className="flex justify-center lg:justify-end">
              <HeroResultPanel />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          2. AI Teaser Section: "The Missing Link"
          ======================================== */}
      <section id="ai-features" className="scroll-mt-16">
        <AITeaserSection />
      </section>

      {/* ========================================
          3. Proof Points Section (Dark Mode)
          ======================================== */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              테스트 통과 ≠ 버그 없음
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              테스트가 초록불(Pass)이라고 해서, 버그가 없는 것은 아닙니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">가짜 커버리지 판별</h3>
              <p className="text-slate-400 leading-relaxed">
                단순 커버리지가 아닙니다.
                <span className="text-blue-400 font-semibold"> 버그 탐지율</span>로 진짜 검증 강도를 측정합니다.
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">로컬 설정 Zero</h3>
              <p className="text-slate-400 leading-relaxed">
                복잡한 로컬 환경 탓하지 마세요.
                <span className="text-emerald-400 font-semibold"> 0초 만에</span> 격리된 환경에서 순수 로직을 검증합니다.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-violet-900/30 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">🤖</div>
              <h3 className="text-xl font-bold text-white mb-3">테스트 사각지대 분석</h3>
              <p className="text-slate-400 leading-relaxed">
                AI가 당신이 놓친
                <span className="text-violet-400 font-semibold"> 사각지대(Blind Spots)</span>를 찾아내고, 보완할 엣지 케이스를 제안합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          4. How It Works Section
          ======================================== */}
      <section id="how-it-works" className="py-24 bg-slate-900/50 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">어떻게 진행되나요?</h2>
          <p className="text-slate-400">단 3단계로 당신의 테스트 역량을 증명하세요.</p>
        </div>
        <HowItWorksSection />
      </section>

      {/* ========================================
          5. Showcase Section
          ======================================== */}
      <section id="scenario-showcase" className="py-24 bg-slate-950 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">운영에서 터지는 실제 시나리오</h2>
            <p className="text-slate-400">평범한 테스트는 통과하지만, 운영에서는 사고가 나는 케이스들을 모았습니다.</p>
          </div>

          <ScenarioShowcase
            domains={domains.map((d) => ({ key: d.key, label: d.label }))}
            problems={showcase}
          />
        </div>
      </section>

      {/* ========================================
          6. Target Audience Section
          ======================================== */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">이런 분들에게 필수입니다</h2>
            <p className="text-slate-400">QA Arena는 실전 역량을 키우고 싶은 엔지니어를 위해 만들어졌습니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-900/20 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">🔍</div>
              <h3 className="text-xl font-bold text-white mb-3">QA 엔지니어</h3>
              <p className="text-slate-400 leading-relaxed">
                단순 기능 점검을 넘어, 코드 레벨에서 결함을 찾아내는
                <span className="text-blue-400"> SDET 역량</span>을 증명하고 싶으신가요?
              </p>
            </div>

            {/* Card 2 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-emerald-900/20 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">🎓</div>
              <h3 className="text-xl font-bold text-white mb-3">취업/이직 준비생</h3>
              <p className="text-slate-400 leading-relaxed">
                &quot;테스트 짤 줄 압니다&quot;라고 말만 하지 마세요.
                객관적인 <span className="text-emerald-400">지표와 포트폴리오</span>로 증명하세요.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all hover:-translate-y-1">
              <div className="w-14 h-14 bg-purple-900/20 rounded-xl flex items-center justify-center mb-6 text-2xl group-hover:scale-110 transition-transform">👥</div>
              <h3 className="text-xl font-bold text-white mb-3">개발 팀 리드</h3>
              <p className="text-slate-400 leading-relaxed">
                팀원들의 테스트 코드 품질이 걱정되시나요?
                실전 같은 시나리오로 <span className="text-purple-400">팀 전체의 QA 수준</span>을 높이세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          7. Footer CTA: 회원가입 유도 강화형
          ======================================== */}
      <section className="py-24 relative overflow-hidden bg-slate-950 border-t border-slate-900">
        {/* 배경 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* 메인 카피 */}
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight break-keep">
            로그인 없이도 풀 수 있지만,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              당신의 성장은 기록되어야 합니다.
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto">
            일회성 문제 풀이로 끝내지 마세요.
            <br />
            회원이 되어 <strong className="text-white">AI Copilot</strong>과 함께 당신만의{" "}
            <strong className="text-white">QA 포트폴리오</strong>를 완성하세요.
          </p>

          {/* 회원 혜택 3단 콤보 (Benefit Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left max-w-3xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">
                ⚡
              </div>
              <div>
                <div className="text-white font-bold">월 50 토큰 무료</div>
                <div className="text-sm text-slate-500">AI 심층 분석 & 코칭</div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-2xl shrink-0">
                📊
              </div>
              <div>
                <div className="text-white font-bold">성장 데이터 시각화</div>
                <div className="text-sm text-slate-500">영역별 강점/약점 분석</div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-purple-500/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">
                💾
              </div>
              <div>
                <div className="text-white font-bold">풀이 기록 영구 저장</div>
                <div className="text-sm text-slate-500">나만의 오답노트 생성</div>
              </div>
            </div>
          </div>

          {/* CTA 버튼 그룹 */}
          <FooterCTA />

          <p className="mt-6 text-xs text-slate-600">
            * 이메일 스팸 없음. 오직 로그인 식별용으로만 사용됩니다.
          </p>
        </div>
      </section>

    </div>
  );
}
