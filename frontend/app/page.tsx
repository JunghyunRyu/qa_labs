import Image from "next/image";
import Link from "next/link";

// Feature Card 데이터
const features = [
  {
    image: "/images/qa-scenario-card.png",
    title: "실전 QA 시나리오",
    description: "실무에서 마주치는 다양한 QA 상황을 연습하세요",
  },
  {
    image: "/images/auto-grading-card.png",
    title: "pytest 자동 채점",
    description: "코드를 제출하면 즉시 테스트 결과를 확인하세요",
  },
  {
    image: "/images/ai-code-review-card.png",
    title: "AI 코드 리뷰",
    description: "AI가 제공하는 맞춤형 피드백과 힌트를 받아보세요",
  },
];

// How It Works 단계 데이터
const steps = [
  { number: "01", title: "문제 선택", description: "난이도와 유형별로 다양한 QA 문제를 선택하세요" },
  { number: "02", title: "코드 작성", description: "Monaco 에디터에서 pytest 테스트 코드를 작성하세요" },
  { number: "03", title: "자동 채점", description: "제출 즉시 테스트가 실행되고 결과를 확인하세요" },
  { number: "04", title: "AI 피드백", description: "AI가 코드를 분석하고 개선 방향을 제안합니다" },
];

export default function Home() {
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
            QA-Arena
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 font-medium">
            AI 기반 QA 코딩 테스트 플랫폼
          </p>
          <p className="text-base sm:text-lg text-white/70 max-w-md">
            실전 QA 시나리오로 테스트 코드 작성 능력을 키우고,
            AI 피드백으로 빠르게 성장하세요
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/problems"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              문제 풀러 가기
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/30"
            >
              더 알아보기
            </a>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-[var(--card-background)] rounded-xl border border-[var(--card-border)] p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="relative w-full aspect-square mb-6 rounded-lg overflow-hidden bg-slate-900">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-xl font-bold mb-2 text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="text-[var(--muted)]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 px-4 bg-gray-100 dark:bg-gray-900">
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

      {/* Final CTA Section */}
      <section className="py-16 sm:py-20 px-4 bg-[var(--background)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[var(--foreground)]">
            지금 바로 시작하세요
          </h2>
          <p className="text-[var(--muted)] mb-8 max-w-xl mx-auto">
            QA-Arena에서 실전 QA 역량을 키우고, AI 피드백으로 빠르게 성장하세요
          </p>
          <Link
            href="/problems"
            className="inline-block px-10 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            문제 풀러 가기
          </Link>
        </div>
      </section>
    </div>
  );
}
