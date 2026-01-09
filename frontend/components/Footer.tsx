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
    <footer className="bg-[#010409] text-[#8b949e] border-t border-[#30363d]">
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
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
                <h3 className="text-xl font-bold text-[#c9d1d9]">
                  <span className="text-[#58a6ff]">QA</span> Arena
                </h3>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                코드 속 버그를 찾아내는 테스트 작성 능력을 키우세요.
                <br />
                실전 문제와 AI 코칭으로 QA 역량을 성장시키는
                <br />
                오픈 트레이닝 플랫폼입니다.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-[#c9d1d9] mb-4">플랫폼</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/problems"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    문제 목록
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    학습 현황
                  </Link>
                </li>
                <li>
                  <Link
                    href="/submissions"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    내 제출 기록
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-[#c9d1d9] mb-4">법적 고지</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link
                    href="/oss"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    오픈소스 라이선스
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold text-[#c9d1d9] mb-4">리소스</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  {/* TODO: 본인의 GitHub Repo 링크로 수정 권장 */}
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#58a6ff] transition-colors inline-flex items-center gap-1"
                  >
                    GitHub 저장소
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
                  <Link
                    href="https://velog.io/@ai_qa_patrick/series"
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    개발자 블로그
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-[#c9d1d9] mb-4">문의하기</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://forms.gle/mk5zYKMTMq4PGRQz7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#58a6ff] transition-colors inline-flex items-center gap-1"
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
                    className="hover:text-[#58a6ff] transition-colors"
                  >
                    support@qalabs.kr
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section: Copyright & Disclaimer */}
          <div className="border-t border-[#30363d] pt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-[#6e7681]">
              <div className="space-y-1">
                <p>
                  <span className="font-bold text-[#c9d1d9]">QA Arena</span> |
                  운영자: 류정현
                </p>
                <p>
                  본 서비스는 개인 개발자의 포트폴리오 프로젝트이며, 별도의 사업자
                  등록이 되어 있지 않습니다.
                </p>
                <p>
                  제공되는 문제는 AI 기술을 활용하여 생성되었으며, 일부 부정확한
                  정보가 포함될 수 있습니다.
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="mb-1">
                  Made with <span className="text-red-500">❤️</span> for QA
                  Engineers
                </p>
                <p>
                  &copy; {new Date().getFullYear()} QA Arena. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}