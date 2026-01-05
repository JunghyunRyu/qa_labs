import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | QA Arena",
  description: "QA Arena 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            개인정보처리방침
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            시행일: 2026년 1월 6일 | 버전: 1.1
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-10">
            {/* 개요 */}
            <section>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>QA Arena</strong>(이하 &quot;서비스&quot;)는 이용자의
                개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을
                준수합니다.
                <br />
                <br />본 개인정보처리방침은 1인 운영자(류정현)가 운영하는
                서비스가 이용자의 개인정보를 어떤 목적과 방식으로 이용하며,
                개인정보 보호를 위해 어떠한 조치를 취하고 있는지 알려드립니다.
                <br />
                <br />
                <span className="font-semibold text-red-500">
                  ※ 본 서비스는 GitHub 소셜 로그인을 통해 제공되며, 로그인(가입)
                  시 본 개인정보처리방침 및 이용약관에 동의한 것으로 간주합니다.
                </span>
              </p>
            </section>

            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제1조 (개인정보처리자 및 책임자)
              </h2>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-5 border border-gray-100 dark:border-gray-700">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <span className="font-semibold w-32 inline-block">
                      운영자/책임자
                    </span>
                    : 류정현
                  </li>
                  <li>
                    <span className="font-semibold w-32 inline-block">
                      이메일
                    </span>
                    :{" "}
                    <a
                      href="mailto:support@qalabs.kr"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      support@qalabs.kr
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제2조 (수집하는 개인정보 항목 및 방법)
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    1. 수집 항목
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                      <li>
                        <strong>회원 가입(로그인) 시:</strong> GitHub ID(고유
                        식별자), GitHub 사용자명(username), 프로필 이미지 URL
                        <br />
                        <span className="text-sm text-gray-500 ml-5">
                          (이메일은 GitHub 계정 설정에 따라 제공된 경우에 한해
                          수집)
                        </span>
                      </li>
                      <li>
                        <strong>서비스 이용 시 (자동 수집):</strong> IP 주소,
                        쿠키(Cookie), 접속 로그, 서비스 이용 기록(문제 풀이 코드,
                        채점 결과, 토큰 사용량 등), 기기정보(User-Agent)
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    2. 수집 방법
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>
                      <strong>GitHub OAuth 연동:</strong> 이용자가 GitHub
                      로그인을 진행하는 과정에서 GitHub로부터 제공받아 수집
                    </li>
                    <li>
                      <strong>자동 수집:</strong> 서비스 이용 과정에서 생성된
                      로그 및 데이터를 시스템이 자동으로 수집
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제3조 (개인정보의 이용 목적)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>회원 식별 및 관리:</strong> 소셜 로그인을 통한 이용자
                  식별, 서비스 이용 이력 관리
                </li>
                <li>
                  <strong>AI 기반 서비스 제공:</strong> 이용자가 제출한 코드를
                  분석하여 AI(OpenAI 등)를 통한 피드백 및 채점 결과 제공
                </li>
                <li>
                  <strong>서비스 운영 및 개선:</strong> 접속 빈도 파악, 기능
                  개선, 보안 강화, 버그 수정
                </li>
              </ul>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제4조 (개인정보의 보유 및 이용 기간)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                이용자의 개인정보는 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다.
                단, 다음의 정보는 명시한 기간 동안 보존합니다.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-1">
                    <span>부정 이용 방지를 위한 기록(ID 등)</span>
                    <span className="font-medium text-red-500">1년</span>
                  </li>
                  <li className="flex justify-between pt-1">
                    <span>제출 코드, 채점 결과, AI 피드백 내역</span>
                    <span className="font-medium">회원 탈퇴 시까지</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                  관련 법령에 의한 정보 보유 (통신비밀보호법 등)
                </h3>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li className="flex justify-between">
                    <span>웹사이트 방문(로그인) 기록</span>
                    <span className="font-medium">3개월</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* 제5조 (처리위탁 및 국외이전) - OpenAI 반영 */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제5조 (개인정보 처리 위탁 및 국외 이전)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                서비스는 원활한 기능 제공을 위해 해외 클라우드 및 AI 서비스를
                이용하고 있으며, 이에 따라 개인정보(데이터)가 국외로 이전될 수
                있습니다.
              </p>

              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-sm text-left text-gray-700 dark:text-gray-300">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">업체명</th>
                      <th className="px-6 py-3">목적 및 항목</th>
                      <th className="px-6 py-3">이전 국가</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="px-6 py-4 font-medium">OpenAI, LLC</td>
                      <td className="px-6 py-4">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          [AI 기능] 제출 코드 분석, 피드백/힌트 생성
                        </span>
                        <br />
                        <span className="text-xs text-gray-500">
                          (이용자 식별 정보는 제외하고 코드 내용만 전송)
                        </span>
                      </td>
                      <td className="px-6 py-4">미국</td>
                    </tr>
                    <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="px-6 py-4 font-medium">AWS</td>
                      <td className="px-6 py-4">
                        서버 운영 및 데이터베이스 저장
                      </td>
                      <td className="px-6 py-4">미국, 한국</td>
                    </tr>
                    <tr className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="px-6 py-4 font-medium">
                        Cloudflare, Inc.
                      </td>
                      <td className="px-6 py-4">보안(DDoS 방어) 및 CDN</td>
                      <td className="px-6 py-4">미국 및 글로벌</td>
                    </tr>
                    <tr className="bg-white dark:bg-gray-800">
                      <td className="px-6 py-4 font-medium">Google LLC</td>
                      <td className="px-6 py-4">GA4를 이용한 통계 분석</td>
                      <td className="px-6 py-4">미국</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제6조 (이용자의 권리) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제6조 (정보주체의 권리 및 거부권)
              </h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  이용자는 GitHub 연동 해제 또는 회원 탈퇴를 통해 개인정보
                  수집·이용에 대한 동의를 철회할 수 있습니다.
                </li>
                <li>
                  서비스 내 탈퇴 기능을 이용하거나 운영자 이메일로 요청 시 지체
                  없이 조치합니다.
                </li>
                <li>
                  단, 국외 이전(OpenAI 등)을 거부할 경우 AI 피드백 등 서비스의
                  핵심 기능 이용이 불가능할 수 있습니다.
                </li>
              </ul>
            </section>

            {/* 제7조 (안전성 확보조치) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제7조 (개인정보의 안전성 확보 조치)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>전송 구간 암호화 (SSL/TLS)</li>
                <li>외부 공격 차단을 위한 보안 서비스 이용 (Cloudflare)</li>
                <li>개인정보 취급자의 최소화 및 관리</li>
              </ul>
            </section>

            {/* 제8조 (가명정보) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제8조 (가명정보의 처리)
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                운영자는 서비스 개선 및 기술 연구를 위하여 수집한 데이터를 특정
                개인을 알아볼 수 없도록 가명 처리하여 활용할 수 있습니다.
              </p>
            </section>

            {/* 제9조 (권익침해 구제방법) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제9조 (권익침해 구제방법)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                개인정보 침해에 대한 신고나 상담이 필요한 경우:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
                <li>경찰청 사이버수사국 (ecrm.cyber.go.kr / 182)</li>
              </ul>
            </section>

            {/* 부칙 */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                부칙
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                본 개인정보처리방침은 2026년 1월 6일부터 적용됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}