import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "테스트 품질 평가 기준 | QA Arena",
  description:
    "QA Arena의 테스트 품질 평가 시스템 - 품질 지표, 감점 요소, 점수 계산 방식 안내",
};

// 품질 지표 데이터
const qualityIndicators = [
  {
    id: "normal",
    label: "일반값",
    description: "일반 입력값에 대한 기본 동작을 검증합니다",
    detail: "함수의 기본적인 동작을 확인하는 테스트입니다. 예: 양수 입력, 일반 문자열 등",
    color: "blue" as const,
  },
  {
    id: "boundary",
    label: "경계값",
    description: "경계값은 실무 버그가 가장 자주 발생하는 구간입니다",
    detail: "최솟값, 최댓값, 0, 빈 배열의 첫/마지막 요소 등 경계 조건을 테스트합니다",
    color: "green" as const,
  },
  {
    id: "edge",
    label: "극단값",
    description: "빈 값/None 등 극단 입력에서 안정성을 확인합니다",
    detail: "매우 큰 수, 매우 작은 수, 특수문자, 유니코드 등 극단적인 입력을 테스트합니다",
    color: "yellow" as const,
  },
  {
    id: "happy_path",
    label: "정상흐름",
    description: "정상 흐름이 스펙대로 동작하는지 검증합니다",
    detail: "가장 일반적인 사용 시나리오가 의도대로 작동하는지 확인합니다",
    color: "blue" as const,
  },
  {
    id: "error_handling",
    label: "예외처리",
    description: "예외/에러가 의도대로 처리되는지 확인합니다",
    detail: "잘못된 입력, 예외 상황에서 적절한 에러가 발생하는지 테스트합니다",
    color: "purple" as const,
  },
  {
    id: "empty",
    label: "빈값",
    description: "빈 입력 처리가 누락되면 품질 문제가 커집니다",
    detail: "빈 문자열, 빈 배열, None/null 등 빈 값에 대한 처리를 검증합니다",
    color: "orange" as const,
  },
  {
    id: "multiple",
    label: "다중케이스",
    description: "여러 케이스를 분리해 테스트하면 회귀 탐지가 쉬워집니다",
    detail: "parametrize 등을 활용해 다양한 입력 조합을 체계적으로 테스트합니다",
    color: "purple" as const,
  },
];

// 감점 요소 데이터
const penaltyFactors = [
  {
    id: "flaky",
    label: "불안정",
    description: "비결정적(랜덤/시간 의존) 테스트는 감점 요인입니다",
    detail: "random(), time.time() 등 실행마다 결과가 달라질 수 있는 코드는 테스트 신뢰성을 떨어뜨립니다",
  },
  {
    id: "no_assertion",
    label: "검증누락",
    description: "assert 없이 실행만 하는 테스트는 버그를 잡지 못합니다",
    detail: "테스트는 반드시 assert문으로 결과를 검증해야 합니다. 실행만 하는 테스트는 의미가 없습니다",
  },
  {
    id: "hardcoded",
    label: "하드코딩",
    description: "특정 값에만 의존하면 다른 입력에서 실패할 수 있습니다",
    detail: "테스트가 특정 값에만 의존하면 코드 변경 시 쉽게 깨질 수 있습니다",
  },
];

// 등급 시스템 데이터
const gradeSystem = [
  { grade: "A", range: "90-100", status: "우수", color: "green" },
  { grade: "B", range: "75-89", status: "양호", color: "blue" },
  { grade: "C", range: "60-74", status: "보통", color: "yellow" },
  { grade: "D", range: "40-59", status: "미흡", color: "orange" },
  { grade: "F", range: "0-39", status: "부족", color: "red" },
];

// 포화 함수 데이터
const saturationData = [
  { count: 0, score: 0 },
  { count: 1, score: 40 },
  { count: 2, score: 70 },
  { count: 3, score: 85 },
  { count: 4, score: 95 },
  { count: 5, score: 100 },
];

// 색상 클래스 매핑
const colorClasses: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-700",
  purple: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  orange: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
  red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
};

const gradeColorClasses: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
  blue: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
  orange: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700",
  red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
};

export default function QualityPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="section-base bg-[var(--background)]">
        <div className="section-container">
          <div className="section-header">
            <h1 className="section-title">테스트 품질 평가 기준</h1>
            <p className="section-subtitle">
              버그 탐지율 외에도 테스트 설계 품질을 다각도로 분석합니다.
              <br className="hidden sm:block" />
              좋은 테스트는 다양한 입력을 커버하고, 명확한 검증을 수행합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Quality Indicators Section */}
      <section className="section-base bg-[var(--surface)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">품질 지표</h2>
            <p className="section-subtitle">
              테스트 코드에서 평가하는 7가지 품질 지표입니다.
              다양한 지표를 커버할수록 높은 점수를 받습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qualityIndicators.map((indicator) => (
              <div key={indicator.id} className="card-base">
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4 border ${colorClasses[indicator.color]}`}
                >
                  {indicator.label}
                </div>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--foreground)" }}
                >
                  {indicator.description}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {indicator.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Penalty Factors Section */}
      <section className="section-base bg-[var(--background)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title text-red-600 dark:text-red-400">
              감점 요소
            </h2>
            <p className="section-subtitle">
              아래 안티패턴이 발견되면 점수가 감점됩니다.
              테스트 품질을 높이려면 이러한 패턴을 피하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {penaltyFactors.map((factor) => (
              <div
                key={factor.id}
                className="card-base border-red-200 dark:border-red-800/50"
              >
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4 border ${colorClasses.red}`}
                >
                  {factor.label}
                </div>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--foreground)" }}
                >
                  {factor.description}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {factor.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring Formula Section */}
      <section className="section-base bg-[var(--surface)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">점수 계산 방식</h2>
            <p className="section-subtitle">
              테스트 품질 점수는 세 가지 축의 가중 평균으로 계산됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formula Card */}
            <div className="card-base">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--foreground)" }}
              >
                점수 공식
              </h3>
              <div
                className="font-mono text-sm p-4 rounded-lg mb-4"
                style={{ backgroundColor: "var(--surface)" }}
              >
                <p className="mb-2">
                  <span style={{ color: "var(--accent)" }}>base_score</span> =
                </p>
                <p className="pl-4 mb-1">
                  (값유형 <span className="text-blue-500">× 0.35</span>) +
                </p>
                <p className="pl-4 mb-1">
                  (입력다양성 <span className="text-green-500">× 0.30</span>) +
                </p>
                <p className="pl-4 mb-3">
                  (테스트목적 <span className="text-purple-500">× 0.35</span>)
                </p>
                <p className="mb-2">
                  <span className="text-red-500">penalty</span> = sum(감점 요소)
                </p>
                <p>
                  <span style={{ color: "var(--accent)" }}>final_score</span> =
                  max(0, base_score + penalty)
                </p>
              </div>
              <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                <p>
                  <strong>값유형 (35%)</strong>: 일반값, 경계값, 극단값 등
                </p>
                <p>
                  <strong>입력다양성 (30%)</strong>: 단일값, 복수값, 빈값 등
                </p>
                <p>
                  <strong>테스트목적 (35%)</strong>: 정상경로, 예외처리 등
                </p>
              </div>
            </div>

            {/* Saturation Chart */}
            <div className="card-base">
              <h3
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--foreground)" }}
              >
                포화 함수
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                각 카테고리에서 커버한 항목 수에 따라 점수가 결정됩니다.
                5개 이상 커버하면 만점입니다.
              </p>
              <div className="space-y-3">
                {saturationData.map((item) => (
                  <div key={item.count} className="flex items-center gap-4">
                    <span
                      className="w-16 text-sm font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.count}개
                    </span>
                    <div className="flex-1 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.score}%`,
                          backgroundColor: "var(--accent)",
                        }}
                      />
                    </div>
                    <span
                      className="w-12 text-sm font-medium text-right"
                      style={{ color: "var(--foreground)" }}
                    >
                      {item.score}점
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grade System Section */}
      <section className="section-base bg-[var(--background)]">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">등급 시스템</h2>
            <p className="section-subtitle">
              최종 점수에 따라 A~F 등급이 부여됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {gradeSystem.map((item) => (
              <div
                key={item.grade}
                className={`card-base text-center border-2 ${gradeColorClasses[item.color]}`}
              >
                <div className="text-4xl font-bold mb-2">{item.grade}</div>
                <div className="text-lg font-medium mb-1">{item.status}</div>
                <div className="text-sm opacity-75">{item.range}점</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-base bg-[var(--surface)]">
        <div className="section-container">
          <div className="text-center">
            <h2
              className="text-2xl font-bold mb-4"
              style={{ color: "var(--foreground)" }}
            >
              테스트 품질, 직접 측정해보세요
            </h2>
            <p
              className="mb-8 max-w-xl mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              문제를 풀고 테스트 코드를 제출하면 품질 분석 결과를 확인할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/problems"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--accent)" }}
              >
                문제 풀러 가기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium border transition-colors"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--foreground)",
                }}
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
