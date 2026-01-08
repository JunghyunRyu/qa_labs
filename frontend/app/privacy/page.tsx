import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | QA Arena",
  description: "QA Arena 개인정보처리방침 (2025.4 개정 지침 반영)",
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
            시행일: 2026년 1월 9일 | 버전: 1.3 (Google OAuth 추가)
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
                  ※ 본 서비스는 GitHub 또는 Google 소셜 로그인을 통해 제공되며, 로그인(가입)
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
                        <strong>회원 가입(로그인) 시:</strong> GitHub ID 또는 Google ID(고유
                        식별자), 사용자명(username/이름), 이메일, 프로필 이미지 URL
                        <br />
                        <span className="text-sm text-gray-500 ml-5">
                          (소셜 로그인 제공자(GitHub/Google)로부터 제공받은 정보)
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
                      <strong>소셜 로그인(OAuth) 연동:</strong> 이용자가 GitHub 또는
                      Google 로그인을 진행하는 과정에서 해당 서비스로부터 제공받아 수집
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

            {/* 제4조 (보강됨: 파기절차 및 방법 추가) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제4조 (개인정보의 보유기간 및 파기)
              </h2>
              
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">1. 보유 및 이용 기간</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                이용자의 개인정보는 원칙적으로 회원 탈퇴 시 지체 없이 파기합니다.
                단, 다음의 정보는 명시한 기간 동안 보존합니다.
              </p>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-1">
                    <span>부정 이용 방지를 위한 기록(ID 등)</span>
                    <span className="font-medium text-red-500">1년</span>
                  </li>
                  <li className="flex justify-between border-b border-gray-200 dark:border-gray-600 py-1">
                    <span>제출 코드, 채점 결과, AI 피드백 내역</span>
                    <span className="font-medium">회원 탈퇴 시까지</span>
                  </li>
                  <li className="flex justify-between pt-1">
                    <span>웹사이트 방문(로그인) 기록 (통신비밀보호법)</span>
                    <span className="font-medium">3개월</span>
                  </li>
                </ul>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">2. 파기 절차 및 방법</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>파기 절차:</strong> 파기 사유가 발생한 개인정보는 운영자의 책임 하에 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 혹은 즉시 파기됩니다.
                </li>
                <li>
                  <strong>파기 방법:</strong> 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 로우 레벨 포맷(Low Level Format) 등의 기술적 방법을 이용하여 파기하며, 종이 문서의 경우 분쇄하거나 소각하여 파기합니다.
                </li>
              </ul>
            </section>

            {/* 제5조 (처리위탁 및 국외이전) */}
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

            {/* 제6조 (이용자의 권리 - 자동화된 결정권 추가) */}
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
                  <strong>자동화된 결정에 대한 권리:</strong> 이용자는 AI 기반 채점 및 피드백 등 자동화된 시스템에 의한 결정이 자신의 권리나 의무에 중대한 영향을 미치는 경우, 해당 결정에 대해 거부하거나 설명을 요구할 수 있습니다. 다만, 본 서비스의 AI 피드백은 학습 보조 도구로서 법적 효력을 갖지 않습니다.
                </li>
              </ul>
            </section>

            {/* 신설: 제7조 (행태정보 수집 및 거부 설정) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제7조 (자동 수집 장치의 설치·운영 및 거부)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                서비스는 이용자에게 개별적인 맞춤 서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 &#39;쿠키(cookie)&#39;를 사용합니다. 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mt-2">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">웹 브라우저에서 쿠키 차단 방법</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                  <li>
                    <strong>Chrome:</strong> 설정 &gt; 개인정보 및 보안 &gt; 서드 파티 쿠키 &gt; 서드 파티 쿠키 차단 선택
                  </li>
                  <li>
                    <strong>Edge:</strong> 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 및 사이트 데이터 관리 및 삭제 &gt; 타사 쿠키 차단 선택
                  </li>
                  <li>
                    <strong>Whale:</strong> 설정 &gt; 개인정보 보호 &gt; 쿠키 및 기타 사이트 데이터 &gt; 타사 쿠키 차단 선택
                  </li>
                </ul>
              </div>
            </section>

            {/* 제8조 (안전성 확보조치) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제8조 (개인정보의 안전성 확보 조치)
              </h2>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>관리적 조치:</strong> 내부관리계획 수립 및 시행, 개인정보 취급자 교육
                </li>
                <li>
                  <strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화 (SSL/TLS), 보안프로그램 설치 (Cloudflare)
                </li>
              </ul>
            </section>

            {/* 제9조 (가명정보) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제9조 (가명정보의 처리)
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                운영자는 서비스 개선 및 기술 연구를 위하여 수집한 데이터를 특정
                개인을 알아볼 수 없도록 가명 처리하여 활용할 수 있습니다. 가명정보는 재식별이 불가능하도록 별도의 안전조치를 취하여 관리합니다.
              </p>
            </section>

            {/* 제10조 (권익침해 구제방법) */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-l-4 border-blue-500 pl-3">
                제10조 (권익침해 구제방법)
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
                본 개인정보처리방침은 2026년 1월 9일부터 적용됩니다.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}