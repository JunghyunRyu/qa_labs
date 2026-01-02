/**
 * Pricing Page (PR5: UX/Pricing)
 *
 * 플랜 비교 및 업그레이드 페이지
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingCard from "@/components/pricing/PricingCard";
import { PLAN_CONFIGS, type PlanKey } from "@/types/plan";
import { getMyPlan } from "@/lib/api/plans";
import { Sparkles, Shield, Zap } from "lucide-react";

export default function PricingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("free");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        const response = await getMyPlan();
        setCurrentPlan(response.plan.plan_key);
      } catch {
        // 비로그인 사용자는 free로 표시
        setCurrentPlan("free");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentPlan();
  }, []);

  const handleSelectPlan = (planKey: PlanKey) => {
    // 현재는 문의 페이지로 이동 (추후 결제 연동 시 변경)
    if (planKey === "free") {
      router.push("/");
    } else {
      // 결제 연동 전까지는 알림
      alert(`${PLAN_CONFIGS[planKey].name} 플랜은 준비 중입니다. 곧 만나요!`);
    }
  };

  const plans = Object.values(PLAN_CONFIGS);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
              나에게 맞는 플랜 선택하기
            </h1>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              테스트 코드 작성 능력을 키우고 싶다면,
              <br />
              AI 코치와 함께 더 효과적으로 학습하세요.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center items-center gap-4 mb-10">
            <span
              className={`text-sm ${!isYearly ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"}`}
            >
              월간 결제
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                  isYearly ? "translate-x-7" : ""
                }`}
              />
            </button>
            <span
              className={`text-sm ${isYearly ? "text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"}`}
            >
              연간 결제
              <span className="ml-1 text-xs text-emerald-500 font-semibold">
                2개월 무료
              </span>
            </span>
          </div>

          {/* Pricing Cards */}
          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[500px] rounded-2xl bg-[var(--card-background)] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.key}
                  plan={plan}
                  currentPlan={currentPlan}
                  isYearly={isYearly}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          )}

          {/* Features Section */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-10">
              모든 플랜에 포함된 기능
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureItem
                icon={<Sparkles className="w-6 h-6 text-blue-500" />}
                title="AI 기반 피드백"
                description="테스트 코드에 대한 즉각적인 AI 피드백으로 개선점을 파악하세요."
              />
              <FeatureItem
                icon={<Shield className="w-6 h-6 text-emerald-500" />}
                title="뮤테이션 테스팅"
                description="실제 버그를 감지하는 능력을 측정하는 뮤테이션 테스트로 실력을 평가합니다."
              />
              <FeatureItem
                icon={<Zap className="w-6 h-6 text-amber-500" />}
                title="실시간 채점"
                description="브라우저에서 바로 테스트를 실행하고 결과를 확인할 수 있습니다."
              />
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-10">
              자주 묻는 질문
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              <FAQItem
                question="토큰은 어떻게 사용되나요?"
                answer="AI 코치 대화, 힌트 요청, 피드백 재생성 등 AI 기능을 사용할 때마다 토큰이 차감됩니다. 일일 무료 토큰은 매일 자정에 리셋되며, 월간 토큰은 매월 1일에 충전됩니다."
              />
              <FAQItem
                question="플랜을 변경할 수 있나요?"
                answer="네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 다음 결제일부터 적용됩니다."
              />
              <FAQItem
                question="환불이 가능한가요?"
                answer="결제일로부터 7일 이내에 환불을 요청하시면 전액 환불해 드립니다. 고객센터로 문의해 주세요."
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center p-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg-secondary)] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-[var(--border-primary)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <span className="font-medium text-[var(--text-primary)]">{question}</span>
        <span
          className={`text-[var(--text-secondary)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)]">
          {answer}
        </div>
      )}
    </div>
  );
}
