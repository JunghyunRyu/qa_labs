import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | QA Arena",
  description: "QA Arena 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            이용약관
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            시행일: 2025년 1월 1일
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제1조 (목적)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                본 약관은 QA Arena(이하 &quot;서비스&quot;)를 제공하는 운영자(이하
                &quot;회사&quot;)와 이를 이용하는 사용자(이하 &quot;회원&quot;) 간의
                권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제2조 (서비스의 정의)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                QA Arena는 AI 기반 QA 코딩 테스트 플랫폼으로, 사용자가 pytest를
                활용하여 테스트 코드를 작성하고 버그 탐지 능력을 향상시킬 수 있는
                학습 환경을 제공합니다.
              </p>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제3조 (회원가입 및 계정)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원가입은 GitHub 계정을 통한 소셜 로그인으로 진행됩니다.
                </li>
                <li>
                  회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.
                </li>
                <li>
                  비회원(게스트)도 일부 기능을 제한적으로 이용할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제4조 (서비스 이용)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원은 서비스에서 제공하는 문제에 대해 테스트 코드를 작성하고
                  제출할 수 있습니다.
                </li>
                <li>
                  제출된 코드는 서버에서 실행되며, 보안을 위해 샌드박스 환경에서
                  격리 실행됩니다.
                </li>
                <li>
                  AI 코칭 기능은 월별 사용 횟수가 제한될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제5조 - 중요 */}
            <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제5조 (사용자 제출 코드의 이용)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원이 서비스에 제출한 코드는 채점 및 피드백 제공 목적으로
                  사용됩니다.
                </li>
                <li>
                  <strong>
                    회원은 제출한 코드가 서비스 품질 개선, AI 모델 학습, 통계
                    분석 등에 익명화된 형태로 활용될 수 있음에 동의합니다.
                  </strong>
                </li>
                <li>
                  회사는 개인을 식별할 수 있는 정보와 코드를 연결하여 외부에
                  공개하지 않습니다.
                </li>
                <li>
                  회원은 타인의 저작권을 침해하는 코드를 제출해서는 안 됩니다.
                </li>
              </ol>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제6조 (금지사항)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                회원은 다음 행위를 해서는 안 됩니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>악성 코드 또는 시스템을 손상시키는 코드 제출</li>
                <li>다른 사용자의 계정을 무단으로 사용하는 행위</li>
                <li>서비스 취약점을 악용하거나 무단으로 접근하는 행위</li>
                <li>자동화된 방법으로 대량의 요청을 보내는 행위</li>
              </ul>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제7조 (서비스 변경 및 중단)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회사는 서비스 개선을 위해 사전 고지 후 서비스 내용을 변경할 수
                  있습니다.
                </li>
                <li>
                  시스템 점검, 장비 교체 등 불가피한 사유로 서비스가 일시
                  중단될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제8조 (면책조항)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에
                  대해 책임을 지지 않습니다.
                </li>
                <li>
                  회원이 작성한 코드로 인해 발생한 문제에 대해 회사는 책임을
                  지지 않습니다.
                </li>
                <li>
                  AI 피드백은 참고용이며, 그 정확성을 보장하지 않습니다.
                </li>
              </ol>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제9조 (회원 탈퇴)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원은 언제든지 서비스 내에서 탈퇴를 요청할 수 있습니다.
                </li>
                <li>
                  탈퇴 시 회원의 개인정보는 개인정보처리방침에 따라 처리됩니다.
                </li>
              </ol>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제10조 (약관의 변경)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회사는 필요 시 관련 법령을 위반하지 않는 범위 내에서 본 약관을
                  변경할 수 있습니다.
                </li>
                <li>
                  약관 변경 시 시행일 7일 전부터 서비스 내 공지를 통해
                  안내합니다.
                </li>
              </ol>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제11조 (분쟁 해결)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                본 약관과 관련하여 분쟁이 발생한 경우, 회사와 회원은 성실히
                협의하여 해결하도록 합니다. 협의가 이루어지지 않을 경우 관련
                법령에 따른 관할 법원에서 해결합니다.
              </p>
            </section>

            {/* 부칙 */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                부칙
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관은 2025년 1월 1일부터 시행됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
