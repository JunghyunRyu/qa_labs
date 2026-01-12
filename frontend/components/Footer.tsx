"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // 문제 상세 페이지에서는 Footer를 숨김 (전체 화면 레이아웃 사용)
  const isProblemDetailPage = pathname?.match(/^\/problems\/[^/]+$/);
  if (isProblemDetailPage) {
    return null;
  }

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* Top Section: Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/icon.svg"
                alt="QA Arena Logo"
                width={28}
                height={28}
                className="rounded-md"
              />
              <h3 className="text-xl font-bold text-white">
                <span className="text-blue-400">QA</span> Arena
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                Beta
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              코드 품질을 높이는 가장 확실한 방법.
              <br />
              실전과 같은 환경에서 테스트 코드를 작성하고,
              <br />
              AI Copilot과 함께 성장하세요.
            </p>
            <p className="text-sm text-slate-500">
              Created by <strong className="text-slate-300">Junghyun Ryu</strong>
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">플랫폼</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  href="/problems"
                  className="hover:text-blue-400 transition-colors"
                >
                  문제 목록
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-blue-400 transition-colors"
                >
                  학습 현황
                </Link>
              </li>
              <li>
                <Link
                  href="/submissions"
                  className="hover:text-blue-400 transition-colors"
                >
                  내 제출 기록
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">법적 고지</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-blue-400 transition-colors"
                >
                  이용약관
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-blue-400 transition-colors"
                >
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link
                  href="/oss"
                  className="hover:text-blue-400 transition-colors"
                >
                  오픈소스 라이선스
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">문의하기</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://forms.gle/mk5zYKMTMq4PGRQz7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors inline-flex items-center gap-1"
                >
                  버그 제보 / 건의
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@qalabs.kr"
                  className="hover:text-blue-400 transition-colors"
                >
                  support@qalabs.kr
                </a>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-3 mt-4">
              <a
                href="https://github.com/JunghyunRyu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://velog.io/@ai_qa_patrick/series"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Blog"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </a>
              <a
                href="mailto:support@qalabs.kr"
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Email"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        {/* Copyright & Footer Note */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} QA Arena by QaLabs. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            Made with <span className="text-red-500 animate-pulse">❤️</span> for QA Engineers
          </p>
        </div>

      </div>
    </footer>
  );
}
