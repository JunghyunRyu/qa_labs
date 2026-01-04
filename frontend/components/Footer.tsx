"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // 문제 상세 페이지에서는 Footer를 숨김 (전체 화면 레이아웃 사용)
  // /problems/[id] 패턴 매칭: /problems/ 다음에 숫자나 슬러그가 오는 경우
  const isProblemDetailPage = pathname?.match(/^\/problems\/[^/]+$/);
  if (isProblemDetailPage) {
    return null;
  }

  return (
    <footer className="bg-[#010409] text-[#8b949e]">
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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-8">
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
              <h3 className="text-xl font-bold text-[#c9d1d9]">
                <span className="text-[#58a6ff]">QA</span> Arena
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
            <h4 className="font-semibold text-[#c9d1d9] mb-3">플랫폼</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/problems" className="hover:text-[#c9d1d9] transition-colors">
                  문제 목록
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-[#c9d1d9] transition-colors">
                  학습 현황
                </Link>
              </li>
              <li>
                <Link href="/submissions" className="hover:text-[#c9d1d9] transition-colors">
                  내 제출 기록
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[#c9d1d9] mb-3">법적 고지</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-[#c9d1d9] transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#c9d1d9] transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/oss" className="hover:text-[#c9d1d9] transition-colors">
                  오픈소스 라이선스
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-[#c9d1d9] mb-3">리소스</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#c9d1d9] transition-colors inline-flex items-center gap-1"
                >
                  GitHub
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact / Inquiry */}
          <div>
            <h4 className="font-semibold text-[#c9d1d9] mb-3">문의하기</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://forms.gle/mk5zYKMTMq4PGRQz7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#c9d1d9] transition-colors inline-flex items-center gap-1"
                >
                  버그 제보 / 건의
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@qalabs.kr"
                  className="hover:text-[#c9d1d9] transition-colors"
                >
                  support@qalabs.kr
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-[#30363d] pt-8 text-sm text-center space-y-2">
          <p className="text-[#8b949e]">
            <span className="font-medium text-[#c9d1d9]"><span className="text-[#58a6ff]">QA</span> Arena</span> — 더 나은 테스트를 위한 오픈 학습 플랫폼
          </p>
          <p className="text-[#6e7681]">
            &copy; {new Date().getFullYear()} QA Arena. Made with ❤️ for QA Engineers.
          </p>
        </div>
      </div>
      </div>
    </footer>
  );
}
