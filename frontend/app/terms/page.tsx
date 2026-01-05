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
            시행일: 2026년 1월 6일
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
                  테스트, 채점, 피드백, 학습 콘텐츠 및 이에 부수하는 기능
                  일체를 말합니다.
                </li>
                <li>
                  <strong>&quot;회원&quot;</strong>이란 본 약관에 동의하고 GitHub
                  소셜 로그인(OAuth) 등을 통해 계정을 부여받아 서비스를 이용하는
                  자를 말합니다.
                </li>
                <li>
                  <strong>&quot;게스트(비회원)&quot;</strong>란 회원가입 없이
                  제한적으로 서비스를 이용하는 자를 말합니다.
                </li>
                <li>
                  <strong>&quot;제출물&quot;</strong>이란 회원이 서비스에
                  업로드/입력/제출한 테스트 코드, 텍스트, 결과물 및 관련 데이터
                  일체를 말합니다.
                </li>
                <li>
                  <strong>&quot;콘텐츠&quot;</strong>란 운영자가 서비스에서 제공하는
                  문제, 설명, 데이터, UI/UX, 문서, 이미지, 로고 등 일체를
                  말합니다.
                </li>
                <li>
                  <strong>&quot;운영정책&quot;</strong>이란 토큰 정책, 실행 정책,
                  제재 기준 등 서비스 운영을 위해 운영자가 별도로 정해 공지하는
                  기준을 말합니다.
                </li>
              </ul>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제3조 (약관의 게시 및 변경)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  본 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써
                  효력이 발생합니다.
                </li>
                <li>
                  운영자는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수
                  있으며, 변경 시 시행일 7일 전부터 서비스 내 공지를 통해
                  안내합니다.
                </li>
                <li>
                  회원이 변경 약관 시행일 이후에도 서비스를 계속 이용하는 경우,
                  변경 약관에 동의한 것으로 봅니다. 다만, 회원에게 불리하거나
                  중요한 변경의 경우 운영자는 합리적인 방법으로 추가 고지할 수
                  있습니다.
                </li>
              </ol>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제4조 (회원가입 및 계정)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원가입은{" "}
                  <strong>GitHub 계정 기반 소셜 로그인(OAuth)</strong>으로
                  진행됩니다.
                </li>
                <li>
                  회원은 계정 정보를 안전하게 관리할 책임이 있으며, 계정
                  공유/양도/대여는 금지됩니다.
                </li>
                <li>
                  만 14세 미만 아동은 원칙적으로 회원가입 및 서비스 이용이
                  불가합니다.
                </li>
                <li>
                  운영자는 다음 각 호에 해당하는 경우 가입을 제한하거나 사후에
                  회원자격을 제한/해지할 수 있습니다.
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>타인의 정보 도용 등 부정한 방법으로 가입한 경우</li>
                    <li>
                      본 약관 또는 운영정책, 관련 법령을 위반한 경우
                    </li>
                  </ul>
                </li>
                <li>
                  게스트는 일부 기능을 제한적으로 이용할 수 있으며, 운영자는 게스트
                  이용 범위/제한을 변경할 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제5조 (서비스 이용 및 제출 코드 실행)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원은 서비스에서 제공하는 문제에 대해 테스트 코드를 작성하고
                  제출할 수 있습니다.
                </li>
                <li>
                  제출물은 서비스의 채점 방식에 따라 브라우저(클라이언트) 환경
                  또는 서버의 격리된 샌드박스 환경에서 실행될 수 있습니다.
                </li>
                <li>
                  운영자는 보안 및 안정성을 위해 실행 시간/메모리/네트워크/파일
                  접근/프로세스 등 실행 정책을 제한할 수 있으며, 특정
                  라이브러리/기능 사용을 제한할 수 있습니다.
                </li>
                <li>
                  운영자는 서비스 운영, 보안 대응, 품질 개선을 위해 실행
                  결과/오류/메타데이터(예: 시간, 실패 유형 등)를 수집할 수
                  있으며, 개인정보 처리는 개인정보처리방침에 따릅니다.
                </li>
              </ol>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제6조 (토큰/사용량 제한 및 AI 기능)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 서비스 일부 기능(예: AI 코칭, 힌트, 심화 분석, 피드백
                  재생성 등)에 대해 일/월 사용량 제한(토큰), 쿨다운, 호출 제한
                  등 합리적인 범위의 제한을 적용할 수 있습니다.
                </li>
                <li>
                  사용량 제한의 상세 기준(차감, 리셋, 예외, 캐시 등)은 서비스 내
                  운영정책(예: &quot;토큰 정책&quot;)에 따릅니다.
                </li>
                <li>
                  운영자는 남용 방지 및 운영 안정화를 위해 운영정책을 변경할 수
                  있으며, 중요한 변경은 사전 공지합니다.
                </li>
              </ol>
            </section>

            {/* 제7조 - 중요 */}
            <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제7조 (제출물의 이용 및 권리)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원이 서비스에 제출한 제출물은 채점, 결과 제공, 피드백 제공,
                  서비스 운영 및 품질 개선(통계/오류 분석/기능 개선) 목적 범위
                  내에서 이용됩니다.
                </li>
                <li>
                  운영자는 전항의 목적을 위해 필요한 범위에서 제출물을
                  저장/복제/가공할 수 있으며, 회원은 이에 대해 비독점적·무상 이용
                  허락을 부여합니다(단, 목적 범위 제한).
                </li>
                <li>
                  <strong>
                    AI 모델 학습(파인튜닝 등) 목적의 제출물 활용은 원칙적으로
                    하지 않습니다. 운영자가 이를 수행하려는 경우에는 별도의 명시적
                    동의(옵트인)를 받습니다.
                  </strong>
                </li>
                <li>
                  회원은 제출물에 (i) 타인의 저작권을 침해하는 내용, (ii)
                  영업비밀, (iii) 개인정보(본인 또는 제3자), (iv) 운영자/조직의
                  비공개 소스코드 등 권리 침해 또는 민감 정보를 포함하여서는 안
                  됩니다.
                </li>
                <li>
                  운영자는 개인을 식별할 수 있는 정보와 제출물을 결합하여 외부에
                  공개하지 않습니다. 다만, 법령에 따른 요청이 있는 경우 예외로
                  합니다.
                </li>
              </ol>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제8조 (콘텐츠의 권리)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  서비스 내 콘텐츠에 대한 저작권 및 지식재산권은 운영자 또는 정당한
                  권리자에게 귀속됩니다.
                </li>
                <li>
                  회원은 서비스를 이용하는 범위 내에서만 콘텐츠를 열람/사용할 수
                  있으며, 운영자의 사전 동의 없이 콘텐츠를
                  복제/배포/전송/2차적 저작물 작성 등 상업적으로 이용할 수
                  없습니다.
                </li>
              </ol>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제9조 (금지사항)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                회원은 다음 행위를 해서는 안 됩니다:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                <li>서비스의 정상적인 운영을 방해하는 행위</li>
                <li>
                  악성 코드 제출 또는 시스템을 손상/침해할 수 있는 행위(취약점
                  악용 포함)
                </li>
                <li>다른 사용자의 계정을 무단으로 사용하는 행위</li>
                <li>무단 접근, 권한 상승 시도, 인증/인가 우회 시도</li>
                <li>
                  자동화된 방법으로 대량 요청을 보내는 행위(스크래핑, 부하 유발
                  포함)
                </li>
                <li>본 약관, 운영정책 또는 관련 법령을 위반하는 행위</li>
              </ul>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제10조 (이용제한, 제재 및 이의제기)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 회원이 제9조를 위반하거나 서비스의 안정성/보안에 위해를
                  끼치는 경우, 다음 조치를 할 수 있습니다.
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>
                      경고, 기능 제한, 일시 정지, 영구 이용정지, 계정 해지,
                      IP/디바이스 차단 등
                    </li>
                  </ul>
                </li>
                <li>
                  운영자는 제재의 사유, 범위, 기간을 합리적으로 정하며, 가능한
                  범위에서 회원에게 통지합니다(긴급한 보안 사유는 사후 통지
                  가능).
                </li>
                <li>
                  회원은 제재에 대해 문의 채널을 통해 이의제기할 수 있으며,
                  운영자는 합리적인 기간 내에 검토 결과를 안내합니다.
                </li>
              </ol>
            </section>

            {/* 제11조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제11조 (서비스 변경 및 중단)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 서비스 개선을 위해 서비스 내용을 변경할 수 있으며,
                  중요한 변경은 사전 공지합니다.
                </li>
                <li>
                  시스템 점검, 장애, 장비 교체, 트래픽 폭주, 보안 이슈 등
                  불가피한 사유로 서비스가 일시 중단될 수 있습니다.
                </li>
                <li>
                  운영자는 무료 제공 기능의 전부 또는 일부를 변경/중단할 수 있으며,
                  필요한 경우 사전 고지합니다.
                </li>
              </ol>
            </section>

            {/* 제12조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제12조 (면책 및 책임의 제한)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 천재지변, 정전, 통신 장애, 외부 공격 등 불가항력으로
                  인한 서비스 제공의 중단/지연에 대하여 고의 또는 중대한 과실이
                  없는 한 책임을 부담하지 않습니다.
                </li>
                <li>
                  회원의 귀책사유(계정 관리 소홀, 규정 위반, 제출물의 위법성
                  등)로 발생한 손해에 대하여 운영자는 책임을 부담하지 않습니다.
                </li>
                <li>
                  AI 피드백/코칭 결과는 참고용이며, 운영자는 그
                  정확성/완전성/특정 목적 적합성을 보장하지 않습니다.
                </li>
                <li>
                  운영자가 손해배상 책임을 부담하는 경우에도, 관련 법령이 허용하는
                  범위 내에서 운영자의 책임은 통상손해로 한정될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제13조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제13조 (회원 탈퇴 및 데이터 처리)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  회원은 언제든지 서비스 내 절차에 따라 탈퇴를 요청할 수
                  있습니다.
                </li>
                <li>
                  탈퇴 시 개인정보 및 제출물의 처리(보관/파기)는
                  개인정보처리방침 및 관련 법령에 따릅니다.
                </li>
                <li>
                  보안/분쟁 대응/법령 준수 목적상 필요한 정보는 관련 법령이
                  허용하는 범위에서 일정 기간 보관될 수 있습니다.
                </li>
              </ol>
            </section>

            {/* 제14조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제14조 (통지)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  운영자는 서비스 내 공지, 이메일(수집·동의한 경우), 기타 합리적인
                  방법으로 회원에게 통지할 수 있습니다.
                </li>
                <li>
                  회원은 계정 정보(이메일 등)가 변경된 경우 이를 최신으로
                  유지해야 하며, 미갱신으로 인한 불이익은 회원에게 책임이
                  있습니다.
                </li>
              </ol>
            </section>

            {/* 제15조 */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                제15조 (준거법 및 분쟁 해결)
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>본 약관은 대한민국 법령에 따라 해석 및 적용됩니다.</li>
                <li>
                  본 약관과 관련하여 분쟁이 발생한 경우 운영자와 회원은 성실히
                  협의하여 해결하도록 합니다.
                </li>
                <li>
                  협의가 이루어지지 않을 경우, 민사소송법 등 관련 법령에 따른
                  관할 법원에서 해결합니다.
                </li>
              </ol>
            </section>

            {/* 운영자 정보 */}
            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                운영자 정보
              </h2>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>운영자:</strong> 류정현
                </li>
                <li>
                  <strong>문의 이메일:</strong> support@qalabs.kr
                </li>
              </ul>
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
