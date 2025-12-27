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
            <h3 className="text-xl font-bold text-white mb-2">QA-Arena</h3>
            <p className="text-sm">
              AI 기반 QA 코딩 테스트 플랫폼.
              <br />
              pytest로 버그를 잡는 실력을 키우세요.
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

        {/* Copyright */}
        <div className="border-t border-gray-800 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} QA-Arena. All rights reserved.</p>
        </div>
      </div>
      </div>
    </footer>
  );
}
