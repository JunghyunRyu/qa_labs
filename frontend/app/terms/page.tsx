import { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | QA Arena",
  description: "QA Arena 서비스 이용약관 (AI 및 보안 정책 강화)",
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
            시행일: 2026년 1월 7일 | 버전: 1.1 (AI 안전 정책 강화)
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
                  <strong>&quot;회원&quot;</strong>이란 본 약관에 동의하고 GitHub 또는 Google
                  소셜 로그인(OAuth) 등을 통해 계정을 부여받아 서비스를 이용하는
                  자를 말합니다.
                </li>
                <li>
                  <strong>&quot;제출물&quot;</strong>이란 회원이 서비스에
                  업로드/입력/제출한 테스트 코드, 소스 코드, 질문, 텍스트 및
                  관련 데이터 일체를 말합니다.
                </li>
                <li>
                  <strong>&quot;AI 생성물&quot;</strong>이란 회원의 입력값을 바탕으로
                  서비스 내 AI 모델이 생성한 피드백, 힌트, 코드 리뷰 결과 등을 말합니다.
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
                제4조 (회원가입 및 계정 관리)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원가입은 <strong>GitHub 또는 Google 계정 기반 소셜 로그인</strong>으로
                  진행됩니다.
                </li>
                <li>
                  <strong>만 14세 미만 아동</strong>은 회원가입 및 서비스 이용이
                  제한됩니다.
                </li>
                <li>
                  회원은 자신의 계정(GitHub/Google)에 대한 관리 책임이 있으며, 계정 도용이나
                  관리 소홀로 인해 발생하는 손해에 대해 운영자는 책임을 지지 않습니다.
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
                  네트워크 접근, 파일 시스템 조작, 시스템 명령 실행 등은 엄격히 제한됩니다.
                </li>
                <li>
                  운영자는 시스템의 안정성을 위해 회원의 코드 실행 시간, 메모리
                  사용량, API 호출 횟수 등을 제한할 수 있으며, 이를 초과하거나
                  우회하려는 시도가 감지될 경우 즉시 이용을 정지할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제6조 - AI 관련 조항 강화 */}
            <section className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제6조 (AI 기능 및 결과물에 대한 정책)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                서비스는 OpenAI 등의 외부 LLM(Large Language Model)을 활용하여 서비스를 제공합니다.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>토큰 제한:</strong> 운영자는 AI 기능의 남용 방지를 위해 회원별 일/월 사용량(토큰) 제한을 둘 수 있습니다.
                </li>
                <li>
                  <strong>유사성:</strong> AI 기술의 특성상, 서로 다른 회원에게 유사하거나 동일한 피드백(AI 생성물)이 제공될 수 있으며, 회원은 이에 대해 독점적 권리를 주장할 수 없습니다.
                </li>
                <li>
                  <strong>학습 데이터 활용 불가:</strong> 운영자는 회원의 제출물을 AI 모델 학습용으로 판매하거나 제공하지 않습니다. (단, OpenAI의 기본 API 정책에 따라 전송된 데이터가 일시적으로 처리될 수 있습니다.)
                </li>
              </ol>
            </section>

            {/* 제7조 */}
            <section>
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
                      <strong>AI 피드백 생성을 위한 외부 API로의 데이터 전송</strong>
                    </li>
                    <li>서비스 품질 개선을 위한 오류 분석 및 통계 작성 (익명화 처리 후)</li>
                  </ul>
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

            {/* 제9조 - 금지행위 강화 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제9조 (금지행위)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                회원은 서비스 이용 시 다음 각 호의 행위를 해서는 안 됩니다.
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서버에 무리를 주거나(DDoS) 보안 취약점을 탐색/악용하는 행위</li>
                <li>
                  <strong>프롬프트 인젝션(Prompt Injection):</strong> AI에게 의도되지 않은 명령을 수행하게 하거나, 시스템 프롬프트를 탈취하려는 시도
                </li>
                <li>자동화된 도구(매크로, 스크립트)를 이용하여 비정상적으로 서비스를 이용하는 행위</li>
                <li>가상화폐 채굴 등 컴퓨팅 자원을 본래 목적 외로 유용하는 행위</li>
                <li>타인의 코드를 무단으로 복제하여 제출하는 행위(표절)</li>
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

            {/* 제11조 - 면책조항 강화 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제11조 (면책 조항)
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm space-y-2 text-gray-700 dark:text-gray-300">
                <p>
                  1. 운영자는 천재지변, 클라우드 공급자의 장애, 외부 API의 중단
                  등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.
                </p>
                <p>
                  2.{" "}
                  <strong className="text-red-600 dark:text-red-400">
                    [AI 생성물에 대한 면책]
                  </strong>{" "}
                  서비스가 제공하는 AI 피드백은 참고용일 뿐이며, 인공지능 기술의 특성상
                  부정확한 정보나 환각(Hallucination) 현상이 포함될 수 있습니다.
                  이를 신뢰하여 발생한 결과에 대해 운영자는 책임을 지지 않습니다.
                </p>
                <p>
                  3.{" "}
                  <strong>[데이터 백업 의무]</strong> 베타 서비스 기간 중 회원 데이터의 영구적
                  보존은 보장되지 않으며, 중요 데이터의 백업 책임은 회원 본인에게 있습니다.
                  데이터 유실로 인한 손해에 대해 운영자는 책임을 지지 않습니다.
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
                본 약관은 2026년 1월 7일부터 시행됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}