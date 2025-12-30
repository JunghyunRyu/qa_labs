import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Divider Pattern */}
      <div className="w-full h-16 relative overflow-hidden">
        <Image
          src="/images/footer-divider-pattern.png"
          alt=""
          fill
          className="object-cover"
          aria-hidden="true"
        />
      </div>

      <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/icon.svg"
                alt="QA Arena Logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <h3 className="text-xl font-bold text-white">
                <span className="text-sky-500">QA</span> Arena
              </h3>
            </div>
            <p className="text-sm">
              코드 속 버그를 찾아내는 테스트 작성 능력을 키우세요.
              <br />
              실전 문제와 AI 피드백으로 QA 역량을 성장시키는 트레이닝 플랫폼.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">플랫폼</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/problems" className="hover:text-white transition-colors">
                  문제 목록
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  학습 현황
                </Link>
              </li>
              <li>
                <Link href="/submissions" className="hover:text-white transition-colors">
                  내 제출 기록
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-3">법적 고지</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-3">리소스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Non-profit Disclaimer */}
        <div className="border-t border-gray-800 pt-8 text-sm text-center space-y-2">
          <p className="text-gray-500">
            <span className="font-medium text-gray-400"><span className="text-sky-500">QA</span> Arena</span> | 개인 개발자의 비영리 기술 연구 프로젝트
          </p>
          <p className="text-xs text-gray-500">
            본 서비스는 수익을 창출하지 않으며, QA 엔지니어의 역량 강화를 위한 학습 목적으로 운영됩니다.
          </p>
          <p className="mt-4">&copy; {new Date().getFullYear()} QA Arena. All rights reserved.</p>
        </div>
      </div>
      </div>
    </footer>
  );
}
