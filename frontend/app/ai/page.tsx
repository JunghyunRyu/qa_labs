import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI 활용 가이드 | QA Arena",
  description:
    "QA Arena의 AI 기능 활용법 - AI 코치, 힌트, 피드백으로 테스트 품질을 높이세요",
};

// FAQ 데이터 - Edge Cases & Protocols (HTML 지원)
const faqs = [
  {
    tag: "Reliability",
    question: "AI가 할루시네이션(거짓말)을 하면 어떡합니까?",
    answer: `
      핵심은 <strong class="text-slate-200">'교차 검증(Cross-Validation)'</strong>입니다.<br/><br/>
      QA Arena의 AI는 단순히 텍스트만 생성하지 않습니다. 귀하가 작성한 코드를
      실제 <strong class="text-slate-200">격리 환경(Sandbox)</strong>에서 실행하고,
      그 실행 로그(Fact)를 기반으로 분석합니다.<br/><br/>
      <span class="text-violet-400 italic">"AI의 해석은 틀릴 수 있어도, Pytest의 실행 결과는 거짓말을 하지 않습니다."</span>
    `,
  },
  {
    tag: "Policy",
    question: "무료 모델도 많은데, 굳이 토큰 제한을 둔 이유가 뭔가요?",
    answer: `
      <strong class="text-slate-200">"값싼 답변 100개보다, 확실한 인사이트 1개가 낫습니다."</strong><br/><br/>
      우리는 저렴한 경량 모델 대신, 복잡한 코드 맥락을 이해할 수 있는
      <strong class="text-slate-200">고비용 Reasoning 모델(GPT-5.2급)</strong>을 메인 엔진으로 사용합니다.<br/><br/>
      토큰은 이 고성능 엔진을 돌리기 위한 최소한의 연료입니다.
    `,
  },
  {
    tag: "Security Policy",
    question: "회사 프로젝트 코드를 올려도 되나요?",
    answer: `
      <strong class="text-red-400">권장하지 않습니다 (Not Recommended).</strong><br/><br/>
      시스템은 휘발성 컨테이너를 사용하여 기술적으로 안전하지만,
      <strong class="text-slate-200">사내 보안 규정(Compliance)</strong> 위반 소지가 있습니다.<br/><br/>
      민감한 비즈니스 로직은 제거하고, <strong class="text-slate-200">일반화(Sanitization)된 코드 형태</strong>로
      테스트하시길 강력히 권고합니다. 발생한 보안 이슈에 대한 책임은 사용자에게 있습니다.
    `,
  },
  {
    tag: "Tech Choice",
    question: "왜 더 최신 모델이 아닌 'GPT-5.2'를 쓰나요?",
    answer: `
      <strong class="text-slate-200">"최신(Newest)이 항상 최고(Best)는 아니기 때문입니다."</strong><br/><br/>
      우리는 QA Arena 런칭 전, 약 1,000건의 테스트 케이스 생성 벤치마크를 수행했습니다.<br/><br/>
      그 결과, 현재 모델이 다른 최신 모델들보다 <strong class="text-slate-200">'엣지 케이스 탐지율'과
      '환각(Hallucination) 통제'</strong> 면에서 가장 우수한 퍼포먼스를 보여주었습니다.
      우리는 유행이 아닌 <strong class="text-violet-400">데이터(Metric)</strong>를 믿습니다.
    `,
  },
  {
    tag: "Bounty",
    question: "QA 플랫폼인데 버그를 발견했습니다. (Irony?)",
    answer: `
      <strong class="text-emerald-400">Nice Catch!</strong> 훌륭한 QA 엔지니어의 자질을 갖추셨군요.<br/><br/>
      우측 하단 '피드백' 채널을 통해 제보해 주세요.
      유효한 버그라면 <strong class="text-slate-200">'Bug Hunter' 뱃지</strong>와 함께
      두둑한 보너스 토큰을 지급해 드립니다.<br/>
      <span class="text-slate-500 text-sm">(베타 기간 한정)</span>
    `,
  },
];

export default function AIGuidePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative w-full pt-20 md:pt-28 pb-0 overflow-hidden bg-slate-950">
        {/* 배경 효과: Grid 패턴 */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* 작은 뱃지: AI 기술 강조 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full bg-slate-900/60 border border-slate-700 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm font-medium text-slate-300">Powered by LLM Analysis</span>
          </div>

          {/* 메인 타이틀 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            <span className="block">20년 차 시니어처럼 든든하게,</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              동료처럼 편안하게.
            </span>
          </h1>

          {/* 서브 타이틀 */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            막히는 구간은 힌트로 뚫고, 놓친 버그는 피드백으로 잡으세요.
            <br className="hidden md:block" />
            코드 작성부터 회고까지, AI Copilot이 실시간으로 함께합니다.
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/problems"
              className="px-8 py-4 text-lg font-bold text-white rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 transform hover:-translate-y-1"
            >
              AI 코칭 경험하기
            </Link>
            <a
              href="#token-system"
              className="px-8 py-4 text-lg font-semibold text-slate-300 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all"
            >
              토큰 시스템 알아보기
            </a>
          </div>

          {/* 하단 UI 프리뷰 이미지 */}
          <div className="mt-16 relative z-10 mx-auto max-w-4xl animate-float">
            <div className="relative rounded-t-xl bg-slate-800/80 p-2 border border-slate-700 border-b-0 shadow-2xl">
              {/* 브라우저 상단 바 */}
              <div className="flex gap-2 mb-2 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              {/* AI Chat 인터페이스 미리보기 */}
              <div className="bg-slate-900 rounded-t-lg p-6 min-h-[200px]">
                {/* 채팅 메시지 예시 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center text-base shadow-inner">👤</div>
                    <div className="bg-slate-800 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-slate-300 text-sm">이 테스트가 왜 실패했는지 모르겠어요</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center text-sm">✨</div>
                    <div className="bg-violet-900/30 border border-violet-700/50 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-slate-200 text-sm">경계값 테스트가 누락되었네요.</p>
                      <p className="text-slate-200 text-sm mt-1">입력값이 0일 때와 음수일 때를 확인해보세요.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* 하단 그라디언트 페이드 */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section - Bento Grid */}
      <section className="w-full py-24 bg-slate-950 relative overflow-hidden">
        {/* 상단 그라디언트 라인 */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              단순한 도구가 아닙니다.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                당신의 &apos;엔지니어링 파트너&apos;입니다.
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              막히는 순간에는 길을 터주고, 완료된 코드에는 깊이를 더합니다.
              <br />
              세 가지 핵심 기능으로 완벽한 QA 사이클을 경험하세요.
            </p>
          </div>

          {/* Bento Grid 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. AI Coach */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-violet-500/50 transition-all duration-300 min-h-[420px]">
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-8 h-full flex flex-col relative z-10">
                <div className="mb-4 w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  실시간 페어 프로그래밍
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  &quot;이 코드가 왜 실패했지?&quot;
                  <br />
                  단순 답변이 아닙니다. 스택 트레이스를 분석하고, 최적의 테스트
                  전략을 역제안합니다.
                </p>

                {/* Micro-UI: 채팅 화면 */}
                <div className="flex-1 w-full bg-slate-950 rounded-t-xl border border-slate-800 border-b-0 p-4 space-y-3 opacity-80 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-2">
                  <div className="flex justify-end">
                    <div className="bg-violet-600 text-white text-xs px-3 py-2 rounded-2xl rounded-tr-sm">
                      엣지 케이스가 뭐지?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-300 text-xs px-3 py-2 rounded-2xl rounded-tl-sm border border-slate-700">
                      입력값이 NULL일 때를 고려해보세요.
                    </div>
                  </div>
                </div>

                {/* 비용 뱃지 */}
                <div className="absolute top-6 right-6">
                  <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-1 rounded-full border border-violet-500/20">
                    1 토큰/메시지
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Intelligent Hints */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-yellow-500/50 transition-all duration-300 min-h-[420px]">
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-8 h-full flex flex-col relative z-10">
                <div className="mb-4 w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-2xl">
                  💡
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  사고력을 깨우는 넛지
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  정답을 바로 보지 마세요.
                  <br />
                  방향성 제시부터 구체적 접근법까지, 3단계 힌트로 스스로 해결하는
                  힘을 기릅니다.
                </p>

                {/* Micro-UI: 블러 처리된 힌트 */}
                <div className="flex-1 w-full bg-slate-950 rounded-xl border border-slate-800 p-4 relative overflow-hidden group-hover:border-yellow-500/30 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-xs">Level 1</span>
                      <div className="h-2 flex-1 bg-slate-800 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500/60 text-xs">Level 2</span>
                      <div className="h-2 flex-1 bg-slate-800 rounded" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500/30 text-xs">Level 3</span>
                      <div className="h-2 flex-1 bg-slate-800 rounded" />
                    </div>
                  </div>
                  {/* 블러 오버레이 */}
                  <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center bg-slate-950/30 group-hover:backdrop-blur-none transition-all duration-700">
                    <span className="text-yellow-400 text-xs font-bold px-3 py-1 border border-yellow-500/50 rounded-full bg-slate-900 group-hover:opacity-0 transition-opacity">
                      Hover to Unlock
                    </span>
                  </div>
                </div>

                {/* 비용 뱃지 */}
                <div className="absolute top-6 right-6">
                  <span className="text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                    점수 패널티
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Deep Feedback */}
            <div className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 min-h-[420px]">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-8 h-full flex flex-col relative z-10">
                <div className="mb-4 w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                  📊
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  즉각적인 코드 감사
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  제출하는 순간 분석이 끝납니다.
                  <br />
                  놓친 테스트 케이스, 안티 패턴, 개선 제안까지 리포트로
                  받아보세요.
                </p>

                {/* Micro-UI: 체크리스트 */}
                <div className="flex-1 w-full bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-slate-400 text-xs">잘한 점 분석</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                    <span className="text-slate-400 text-xs">개선할 점 제안</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50">
                    <div className="w-4 h-4 rounded-full border border-slate-600" />
                    <span className="text-slate-500 text-xs">
                      추가 테스트 케이스
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-emerald-400 text-xs font-bold">
                      Grade: A+
                    </span>
                  </div>
                </div>

                {/* 비용 뱃지 */}
                <div className="absolute top-6 right-6">
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                    무료
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture Section - Blueprint */}
      <section className="w-full py-24 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
        {/* 배경 장식: 회로 라인 */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M0 50 H40 M60 50 H100 M50 0 V40 M50 60 V100" stroke="white" strokeWidth="0.5" fill="none"/>
                <circle cx="50" cy="50" r="3" fill="white"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)"/>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-slate-900/80 border border-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Systems Operational</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Dual-Engine <span className="text-cyan-400">AI Architecture</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              State-of-the-Art 추론 모델과 Context-Aware 시스템이<br className="hidden md:block" />
              엔지니어의 역량 데이터를 실시간으로 오케스트레이션합니다.
            </p>
          </div>

          {/* 메인 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Deep Reasoning Engine */}
            <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-cyan-500/30 transition-colors">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="text-cyan-400 text-xs font-bold tracking-wider uppercase mb-2">Deep Reasoning Engine</div>
                  <h3 className="text-2xl font-bold text-white">GPT-5.2</h3>
                  <p className="text-slate-500 text-sm mt-1">Responses API + Semantic Analysis</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <span className="text-3xl">🧠</span>
                </div>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                의미론적 코드 분석(Semantic Analysis)을 수행하는 고성능 추론 코어입니다.
                AST 기반 패턴 인식과 결합하여 다각적 리팩토링 전략을 도출합니다.
              </p>

              <div className="flex flex-col md:flex-row gap-6">
                {/* 왼쪽: Inference Scale with Live Monitor */}
                <div className="flex-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Inference Compute Scale
                    </span>
                    {/* Dynamic Badge */}
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-blue-400">Live Monitor</span>
                    </span>
                  </div>

                  {/* 게이지 바 */}
                  <div className="flex gap-1 h-2 mb-2">
                    <div className="flex-1 rounded-l-full bg-slate-800 opacity-50"></div>
                    <div className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse"></div>
                    <div className="flex-1 bg-slate-800 opacity-30"></div>
                    <div className="flex-1 rounded-r-full bg-slate-800 opacity-30 border-l border-slate-700"></div>
                  </div>

                  {/* 하단: 전략 명시 */}
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <div className="text-[10px] text-slate-500 mb-0.5">Runtime Strategy</div>
                      <div className="text-sm font-bold text-white">
                        Auto-Scaling <span className="text-slate-500 font-normal text-xs">(Low ~ xHigh)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: Context-Aware Shaping (If-Else 로직 스타일) */}
                <div className="flex-1 bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Context-Aware Shaping
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-red-400 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                        <span>If Score &lt; 30</span>
                        <span className="text-slate-600">→</span>
                      </div>
                      <span className="font-mono text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                        High Verbosity
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-amber-400 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                        <span>If 30 - 70</span>
                        <span className="text-slate-600">→</span>
                      </div>
                      <span className="font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Balanced Guide
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs group">
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-400 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                        <span>If Score &gt; 70</span>
                        <span className="text-slate-600">→</span>
                      </div>
                      <span className="font-mono text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Concise Audit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Interactive Copilot */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors">
              <div className="text-violet-400 text-xs font-bold tracking-wider uppercase mb-2">Interactive Copilot</div>
              <h3 className="text-xl font-bold text-white mb-1">GPT-4o-mini</h3>
              <p className="text-slate-500 text-sm mb-4">Low-Latency Interaction</p>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 mt-6">
                <div className="text-xs text-slate-500 mb-3">Optimized for</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400">⚡</span>
                    <span className="text-xs text-slate-300">Instant Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400">💬</span>
                    <span className="text-xs text-slate-300">Context-Retention</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400">🎯</span>
                    <span className="text-xs text-slate-300">Precision Guidance</span>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 text-xs mt-6 pt-4 border-t border-slate-800">
                실시간 페어 프로그래밍에 최적화된 경량화 모델입니다.
              </p>
            </div>

            {/* 3. Sandboxed Execution Environment */}
            <div className="md:col-span-3 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <span className="text-lg">🔒</span>
                  </div>
                  <div>
                    <div className="text-emerald-400 text-xs font-bold tracking-wider uppercase">Secure Runtime</div>
                    <h4 className="text-white font-semibold">Sandboxed Execution Environment</h4>
                  </div>
                </div>
                <div className="flex-1 text-slate-400 text-sm">
                  모든 코드는 휘발성(Ephemeral) 컨테이너 및 WASM 샌드박스 내에서 격리 실행됩니다.
                  호스트 시스템과의 상호 간섭이 원천 차단됩니다.
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">Secure Docker</span>
                  <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded border border-slate-700">WASM/Pyodide</span>
                  <span className="px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded border border-slate-700">Resource Quota</span>
                </div>
              </div>
            </div>
          </div>

          {/* 기술 면책 조항 */}
          <p className="text-center text-slate-600 text-xs mt-8">
            * 모델 및 설정은 서비스 품질 향상을 위해 사전 고지 없이 변경될 수 있습니다.
          </p>
        </div>
      </section>

      {/* Token System Section - Energy Core */}
      <section
        id="token-system"
        className="w-full py-24 bg-slate-950 border-t border-slate-800 relative overflow-hidden"
      >
        {/* 배경 조명 효과 (Amber Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI 인텔리전스를 위한{" "}
              <span className="text-amber-400">연료(Fuel)</span>
            </h2>
            <p className="text-slate-400">
              복잡한 구독 모델은 잊으세요.
              <br className="md:hidden" />
              매일 아침, 당신의 성장을 위한 에너지가 자동으로 충전됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* 왼쪽: 공급 (Supply) - 배터리/충전 컨셉 */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 h-full flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              {/* 장식용 배경 */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16" />

              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="text-amber-400 font-bold tracking-wider text-sm uppercase">
                    Energy Source
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Daily Recharge */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-white font-medium text-lg">
                        일일 자동 충전
                      </span>
                      <span className="text-amber-400 font-bold text-2xl">
                        3 Tokens
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[30%] animate-pulse" />
                    </div>
                    <p className="text-slate-500 text-xs mt-2">
                      매일 00:00 (KST) 리셋
                    </p>
                  </div>

                  {/* Monthly Recharge */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-white font-medium text-lg">
                        월간 기본 제공
                      </span>
                      <span className="text-white font-bold text-2xl">
                        50 Tokens
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-slate-600 h-full w-full" />
                    </div>
                    <p className="text-slate-500 text-xs mt-2">매월 1일 리셋</p>
                  </div>
                </div>
              </div>

              {/* 베타 기간 특별 혜택 강조 */}
              <div className="mt-8 p-4 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 rounded-r-lg">
                <p className="text-amber-200 text-sm font-semibold">
                  🎁 Beta Special:
                  <br />
                  부족하신가요? 요청 시{" "}
                  <span className="text-white underline decoration-amber-500 decoration-2 underline-offset-2">
                    무제한 추가 충전
                  </span>{" "}
                  해드립니다.
                </p>
              </div>
            </div>

            {/* 오른쪽: 소비 (Demand) - 스킬 메뉴판 컨셉 */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 h-full hover:border-slate-700 transition-colors">
              <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <span>기능별 소모량</span>
                <span className="text-slate-500 text-sm font-normal ml-auto">
                  효율적인 투자
                </span>
              </h3>

              <ul className="space-y-4">
                {/* Item 1 */}
                <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-sm">
                      🤖
                    </div>
                    <div className="text-slate-300 group-hover:text-white transition-colors">
                      AI 코치와 대화
                    </div>
                  </div>
                  <div className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    1 Token
                  </div>
                </li>

                {/* Item 2 */}
                <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-sm">
                      💡
                    </div>
                    <div className="text-slate-300 group-hover:text-white transition-colors">
                      단계별 힌트 해제
                    </div>
                  </div>
                  <div className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    1 Token
                  </div>
                </li>

                {/* Item 3 */}
                <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">
                      📊
                    </div>
                    <div className="text-slate-300 group-hover:text-white transition-colors">
                      기본 피드백 리포트
                    </div>
                  </div>
                  <div className="text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    FREE
                  </div>
                </li>

                {/* Item 4 */}
                <li className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">
                      🔍
                    </div>
                    <div className="text-slate-300 group-hover:text-white transition-colors">
                      심층 코드 분석
                    </div>
                  </div>
                  <div className="text-white font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                    2 Tokens
                  </div>
                </li>
              </ul>

              {/* Pro Tip */}
              <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <p className="text-slate-500 text-sm">
                  💡 <span className="text-slate-300">Tip:</span> 매일 주어지는
                  무료 토큰을 먼저 사용하세요.
                  <br />
                  사용하지 않은 일일 토큰은 자정에 소멸됩니다.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section - Edge Cases & Protocols */}
      <section className="w-full py-24 bg-slate-950 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          {/* 헤더 */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Edge Cases & Protocols
            </h2>
            <p className="text-slate-400">
              궁금해하실 만한{" "}
              <span className="text-slate-200 font-mono bg-slate-800 px-1.5 py-0.5 rounded text-sm">
                Runtime Exception
              </span>
              과{" "}
              <span className="text-slate-200 font-mono bg-slate-800 px-1.5 py-0.5 rounded text-sm">
                Policy
              </span>
              들을 모았습니다.
            </p>
          </div>

          {/* FAQ 리스트 - Terminal Style */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border rounded-xl transition-all duration-300 overflow-hidden
                           bg-slate-900/30 border-slate-800 hover:border-slate-700
                           open:bg-slate-900 open:border-violet-500/50 open:shadow-[0_0_15px_rgba(139,92,246,0.1)]"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs px-2 py-1 rounded border shrink-0
                                     bg-slate-800 border-slate-700 text-slate-500
                                     group-open:bg-violet-500/10 group-open:border-violet-500/20 group-open:text-violet-400">
                      {faq.tag}
                    </span>
                    <span className="font-bold text-slate-300 group-hover:text-white group-open:text-white transition-colors">
                      Q. {faq.question}
                    </span>
                  </div>
                  <span className="ml-4 flex-shrink-0 text-slate-500 group-open:rotate-180 group-open:text-violet-400 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <div className="border-t border-dashed border-slate-800/50 pt-4 ml-[5.5rem]">
                    <div className="flex gap-3">
                      <span className="text-violet-500 font-bold shrink-0 mt-0.5">A.</span>
                      <div
                        className="text-slate-400 text-[15px] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>

          {/* 추가 문의 유도 */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              다른 예외 상황(Exception)이 발생했나요?{" "}
              <br className="md:hidden" />
              <a
                href="mailto:support@qalabs.kr"
                className="text-violet-400 hover:text-violet-300 underline underline-offset-4 transition-colors"
              >
                엔지니어에게 직접 문의하기
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - Dark Mode */}
      <section className="w-full py-24 bg-slate-950 border-t border-slate-900 relative overflow-hidden">
        {/* Glow 효과 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to <span className="text-violet-400">Level Up</span>?
            </h2>
            <p className="text-slate-400 mb-10 max-w-xl mx-auto">
              막히면 AI 코치에게 물어보고, 제출하면 즉시 피드백을 받으세요.
              <br className="hidden md:block" />
              당신의 QA 스킬이 한 단계 성장하는 것을 직접 확인하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/problems"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white
                           bg-gradient-to-r from-violet-600 to-indigo-600
                           hover:from-violet-500 hover:to-indigo-500
                           shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30
                           transition-all duration-300 transform hover:-translate-y-1"
              >
                AI 코칭 시작하기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold
                           text-slate-300 bg-slate-800/50 border border-slate-700
                           hover:bg-slate-800 hover:text-white hover:border-slate-600
                           transition-all duration-300"
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
