import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | QA Arena",
  description: "QA Arena 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            개인정보처리방침
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            시행일: 2025년 1월 1일
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            {/* 개요 */}
            <section>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                QA Arena(이하 &quot;서비스&quot;)는 사용자의 개인정보를 중요시하며,
                「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침을 통해
                수집하는 개인정보의 항목, 수집 목적, 보유 기간 등을 안내드립니다.
              </p>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제1조 (수집하는 개인정보 항목)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                서비스는 회원가입 및 서비스 제공을 위해 다음과 같은 개인정보를
                수집합니다:
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    필수 수집 정보
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>소셜 로그인 제공 ID (GitHub 고유 식별자)</li>
                    <li>이메일 주소</li>
                    <li>프로필 이름</li>
                    <li>프로필 이미지 URL</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    자동 수집 정보
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>IP 주소</li>
                    <li>쿠키 및 세션 정보</li>
                    <li>서비스 이용 기록 (문제 풀이 기록, 제출 내역 등)</li>
                    <li>기기 정보 (브라우저 종류, 운영체제)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제2조 (개인정보 수집 방법)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>소셜 로그인(GitHub)을 통한 회원가입 시</li>
                <li>서비스 이용 과정에서 자동 생성 및 수집</li>
                <li>고객 문의 시 이메일 등을 통한 수집</li>
              </ul>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제3조 (개인정보의 이용 목적)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>회원 관리:</strong> 회원 식별, 회원제 서비스 제공
                </li>
                <li>
                  <strong>서비스 제공:</strong> 코드 채점, AI 피드백 제공, 학습
                  기록 저장
                </li>
                <li>
                  <strong>서비스 개선:</strong> 통계 분석, 서비스 품질 향상
                </li>
                <li>
                  <strong>보안:</strong> 부정 이용 방지, 시스템 보안 유지
                </li>
                <li>
                  <strong>고객 지원:</strong> 문의 응대, 공지사항 전달
                </li>
              </ul>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제4조 (개인정보의 보유 및 이용 기간)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                회원의 개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 시
                지체 없이 파기합니다. 단, 다음의 경우 해당 기간 동안 보관합니다:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li className="flex justify-between">
                    <span>계약 또는 청약철회 기록</span>
                    <span className="text-gray-500">5년</span>
                  </li>
                  <li className="flex justify-between">
                    <span>소비자 불만 또는 분쟁처리 기록</span>
                    <span className="text-gray-500">3년</span>
                  </li>
                  <li className="flex justify-between">
                    <span>접속 로그 기록</span>
                    <span className="text-gray-500">3개월</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제5조 (개인정보의 제3자 제공)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                서비스는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다.
                다만, 다음의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 mt-2">
                <li>회원이 사전에 동의한 경우</li>
                <li>법령에 의해 요구되는 경우</li>
              </ul>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제6조 (개인정보 처리 위탁)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를
                위탁하고 있습니다:
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 text-gray-900 dark:text-white">
                        수탁업체
                      </th>
                      <th className="text-left py-2 text-gray-900 dark:text-white">
                        위탁 업무
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 dark:text-gray-300">
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">Amazon Web Services</td>
                      <td className="py-2">클라우드 서버 운영</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">OpenAI</td>
                      <td className="py-2">AI 피드백 서비스</td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">Google</td>
                      <td className="py-2">서비스 이용 통계 분석 (Google Analytics)</td>
                    </tr>
                    <tr>
                      <td className="py-2">Sentry</td>
                      <td className="py-2">오류 추적 및 서비스 안정성 모니터링</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제7조 (회원의 권리)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                회원은 언제든지 다음 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>개인정보 열람 요청</li>
                <li>개인정보 정정 요청</li>
                <li>개인정보 삭제 요청</li>
                <li>개인정보 처리 정지 요청</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-3">
                위 요청은 서비스 내 설정 메뉴 또는 고객 문의를 통해 가능합니다.
              </p>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제8조 (쿠키의 사용)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  서비스는 사용자 인증 및 세션 유지를 위해 쿠키를 사용합니다.
                </li>
                <li>
                  사용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
                  이 경우 서비스 이용에 제한이 있을 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제9조 (개인정보 보호 조치)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                서비스는 개인정보 보호를 위해 다음 조치를 취하고 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>개인정보의 암호화 저장</li>
                <li>SSL/TLS를 통한 데이터 전송 암호화</li>
                <li>접근 권한 관리 및 접근 기록 보관</li>
                <li>보안 프로그램 설치 및 주기적 점검</li>
              </ul>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제10조 (개인정보 보호책임자)
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <span className="text-gray-500">담당:</span> 개인정보
                    보호책임자
                  </li>
                  <li>
                    <span className="text-gray-500">이메일:</span>{" "}
                    <a
                      href="mailto:privacy@qalabs.kr"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      privacy@qalabs.kr
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제11조 (방침의 변경)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될
                  수 있습니다.
                </li>
                <li>
                  변경 시 시행일 7일 전부터 서비스 내 공지를 통해 안내합니다.
                </li>
              </ol>
            </section>

            {/* 부칙 */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                부칙
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
