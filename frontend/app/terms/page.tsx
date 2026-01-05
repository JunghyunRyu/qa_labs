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
            QA Arena 이용약관
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            시행일: 2026년 1월 6일 | 버전: 1.0 (Beta)
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제1조 (목적)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                본 약관은 QA Arena(이하 &quot;서비스&quot;)를 제공하는 운영자
                류정현(개인, 이하 &quot;운영자&quot;)과 서비스를 이용하는
                사용자(이하 &quot;회원&quot;) 간의 권리, 의무 및 책임사항과
                서비스 이용 조건 및 절차를 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제2조 (용어의 정의)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>&quot;서비스&quot;</strong>란 운영자가 제공하는 QA 코딩
                  테스트, 채점, AI 피드백, 학습 콘텐츠 및 이에 부수하는 기능
                  일체를 말합니다.
                </li>
                <li>
                  <strong>&quot;회원&quot;</strong>이란 본 약관에 동의하고 GitHub
                  소셜 로그인(OAuth) 등을 통해 계정을 부여받아 서비스를 이용하는
                  자를 말합니다.
                </li>
                <li>
                  <strong>&quot;제출물&quot;</strong>이란 회원이 서비스에
                  업로드/입력/제출한 테스트 코드, 소스 코드, 질문, 텍스트 및
                  관련 데이터 일체를 말합니다.
                </li>
                <li>
                  <strong>&quot;콘텐츠&quot;</strong>란 운영자가 서비스에서
                  제공하는 문제, 해설, UI/UX, 이미지 등 일체를 말합니다.
                </li>
              </ul>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제3조 (약관의 효력 및 변경)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써
                  효력이 발생합니다. 회원이 서비스에 가입(로그인)하는 경우 본
                  약관에 동의한 것으로 간주합니다.
                </li>
                <li>
                  운영자는 필요한 경우 관련 법령을 위반하지 않는 범위 내에서
                  약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을
                  통해 공지합니다.
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제4조 (회원가입 및 이용제한)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원가입은 <strong>GitHub 계정 기반 소셜 로그인</strong>으로
                  진행됩니다.
                </li>
                <li>
                  <strong>만 14세 미만 아동</strong>은 회원가입 및 서비스 이용이
                  제한됩니다. 운영자는 14세 미만 이용자의 가입 사실이 확인될 경우
                  즉시 계정을 삭제할 수 있습니다.
                </li>
                <li>
                  운영자는 타인의 정보를 도용하거나 비정상적인 방법(매크로, 해킹
                  등)으로 서비스를 이용하는 회원의 자격을 제한하거나 박탈할 수
                  있습니다.
                </li>
              </ol>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제5조 (서비스 이용 및 샌드박스 정책)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원이 제출한 코드는 서버의 격리된 환경(Sandbox)에서 실행되며,
                  보안을 위해 네트워크 접근이나 파일 시스템 이용 등이 제한될 수
                  있습니다.
                </li>
                <li>
                  운영자는 시스템의 안정성을 위해 회원의 코드 실행 시간, 메모리
                  사용량, API 호출 횟수 등을 제한할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제6조 (AI 기능 및 토큰 정책)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                서비스는 OpenAI 등의 외부 AI 모델을 활용하여 코드 분석 및 피드백을
                제공합니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 AI 기능의 무분별한 남용을 막기 위해 회원별 일/월 사용량
                  제한(토큰 시스템)을 둘 수 있습니다.
                </li>
                <li>
                  서비스의 정책 변경이나 외부 API 사정에 따라 토큰 지급량이나
                  사용 조건은 사전 예고 없이 변경될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제7조 - 핵심 법적 방어 조항 */}
            <section className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제7조 (제출물의 저작권 및 이용 라이선스)
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>저작권의 귀속:</strong> 회원이 작성하여 제출한 코드 및
                  콘텐츠의 저작권은 회원 본인에게 있습니다.
                </li>
                <li>
                  <strong>서비스 이용 허락:</strong> 회원은 서비스를 이용함으로써
                  운영자에게 제출물을 다음의 목적으로 사용할 수 있는{" "}
                  <strong>
                    비독점적이고, 전 세계적이며, 로열티가 없는 라이선스
                  </strong>
                  를 부여합니다.
                  <ul className="list-disc list-inside ml-5 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>서비스 제공을 위한 코드 저장, 복제, 실행 및 채점</li>
                    <li>
                      <strong>AI 피드백 생성을 위한 외부 API(OpenAI 등)로의 데이터 전송 및 처리</strong>
                    </li>
                    <li>서비스 품질 개선을 위한 오류 분석 및 통계 작성</li>
                  </ul>
                </li>
                <li>
                  <strong>AI 학습 제한:</strong> 운영자는 회원의 제출물을{" "}
                  <u>
                    AI 모델의 성능 향상을 위한 학습 데이터(Training Data)로
                    영구히 사용하거나 판매하지 않습니다.
                  </u>{" "}
                  단, 회원이 별도로 명시적인 동의(Opt-in)를 한 경우는 예외로
                  합니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제8조 (운영자의 저작권)
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                서비스에서 제공하는 모든 문제, 시나리오, 해설, 디자인 및 로고의
                저작권은 운영자에게 귀속됩니다. 회원은 이를 무단으로 복제, 배포,
                크롤링하거나 상업적으로 이용할 수 없습니다.
              </p>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제9조 (금지행위)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서버에 무리를 주거나 보안 취약점을 악용하는 행위</li>
                <li>타인의 코드를 무단으로 복제하여 제출하는 행위(표절)</li>
                <li>운영자 및 타인의 명예를 훼손하거나 업무를 방해하는 행위</li>
              </ul>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제10조 (서비스의 변경 및 중단)
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 서비스는 <strong>베타(Beta) 버전</strong>으로, 운영자의 사정에
                따라 기능의 일부 또는 전부가 예고 없이 변경되거나 중단될 수
                있으며, 운영자는 이에 대해 별도의 보상을 하지 않습니다.
              </p>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제11조 (면책 조항)
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm space-y-2 text-gray-700 dark:text-gray-300">
                <p>
                  1. 운영자는 천재지변, 디도스(DDoS) 공격, 클라우드 공급자의 장애
                  등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
                </p>
                <p>
                  2.{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    [AI 생성물에 대한 면책]
                  </strong>{" "}
                  서비스가 제공하는 AI 코칭 및 피드백은 인공지능 기술의 특성상
                  부정확한 정보나 환각(Hallucination) 현상이 포함될 수 있습니다.
                  운영자는 피드백의 정확성, 완전성, 무결성을 보장하지 않으며,
                  이를 신뢰하여 발생한 결과에 대해 책임을 지지 않습니다.
                </p>
                <p>
                  3. 운영자는 회원이 작성한 코드나 데이터의 유실에 대해 고의 또는
                  중대한 과실이 없는 한 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            {/* 제12조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제12조 (준거법 및 관할)
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관은 대한민국 법령에 따라 규율되며, 서비스 이용과 관련하여
                분쟁이 발생할 경우 운영자의 주소지를 관할하는 법원을 전속 관할
                법원으로 합니다.
              </p>
            </section>

            {/* 부칙 */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                부칙
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 약관은 2026년 1월 6일부터 시행됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}