import { Metadata } from "next";
import {
  ossCategories,
  licenseTexts,
  getUniqueLicenses,
  getLibrariesByLicense,
  OSSLibrary,
} from "@/lib/oss-licenses";

export const metadata: Metadata = {
  title: "오픈소스 라이선스 | QA Arena",
  description: "QA Arena에서 사용하는 오픈소스 소프트웨어 라이선스 고지",
};

function LicenseBadge({ license }: { license: string }) {
  const colors: Record<string, string> = {
    MIT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    "Apache-2.0": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    "BSD-3-Clause": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "BSD-2-Clause": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ISC: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    "LGPL-3.0": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "PostgreSQL License": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
        colors[license] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      }`}
    >
      {license}
    </span>
  );
}

function LibraryCard({ library }: { library: OSSLibrary }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">
            {library.name}
            {library.version && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                v{library.version}
              </span>
            )}
          </h4>
        </div>
        <LicenseBadge license={library.license} />
      </div>
      {library.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {library.description}
        </p>
      )}
      <div className="flex gap-3 text-xs">
        {library.repository && (
          <a
            href={library.repository}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            Repository
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        {library.licenseUrl && (
          <a
            href={library.licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            License
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

export default function OSSPage() {
  const uniqueLicenses = getUniqueLicenses();
  const librariesByLicense = getLibrariesByLicense();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            오픈소스 라이선스 고지
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Open Source Software Notice
          </p>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            QA Arena는 다양한 오픈소스 소프트웨어를 사용하여 개발되었습니다.
            아래는 본 서비스에서 사용하는 오픈소스 라이브러리와 해당 라이선스 정보입니다.
            각 라이브러리의 저작권자와 기여자에게 감사드립니다.
          </p>

          {/* License Summary */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              라이선스 요약
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uniqueLicenses.map(license => (
                  <div key={license} className="text-center">
                    <LicenseBadge license={license} />
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {librariesByLicense[license]?.length || 0}개 라이브러리
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Libraries by Category */}
          {ossCategories.map(category => (
            <section key={category.category} className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                {category.category}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({category.libraries.length}개)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.libraries.map(library => (
                  <LibraryCard key={library.name} library={library} />
                ))}
              </div>
            </section>
          ))}

          {/* License Texts */}
          <section className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              라이선스 전문
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              아래는 사용된 주요 라이선스의 전문입니다. 각 라이브러리의 정확한 라이선스 텍스트는
              해당 저장소에서 확인하시기 바랍니다.
            </p>
            <div className="space-y-8">
              {Object.entries(licenseTexts).map(([name, text]) => (
                <div key={name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {librariesByLicense[name]?.length || 0}개 라이브러리 사용
                    </span>
                  </div>
                  <pre className="p-4 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto whitespace-pre-wrap font-mono">
                    {text}
                  </pre>
                </div>
              ))}
            </div>
          </section>

          {/* LGPL Note */}
          <section className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              LGPL 라이선스 관련 안내
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              본 서비스는 LGPL-3.0 라이선스의 psycopg2 라이브러리를 사용합니다.
              psycopg2는 동적 링크 방식으로 사용되며, 이에 따라 LGPL 라이선스의 요구사항을 준수합니다.
              해당 라이브러리의 소스 코드는{" "}
              <a
                href="https://github.com/psycopg/psycopg2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                GitHub 저장소
              </a>
              에서 확인하실 수 있습니다.
            </p>
          </section>

          {/* Note */}
          <section className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              참고 사항
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li>
                - 본 목록은 주요 오픈소스 라이브러리를 포함하며, 전이적 의존성(transitive dependencies)은
                일부 생략되었을 수 있습니다.
              </li>
              <li>
                - 라이브러리 버전은 업데이트될 수 있으며, 최신 정보는 각 패키지 매니저(npm, pip)를 통해 확인하시기 바랍니다.
              </li>
              <li>
                - 라이선스 관련 문의사항이 있으시면{" "}
                <a
                  href="mailto:oss@qalabs.kr"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  oss@qalabs.kr
                </a>
                로 연락 주시기 바랍니다.
              </li>
            </ul>
          </section>

          {/* Last Updated */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            마지막 업데이트: 2025년 1월
          </div>
        </div>
      </div>
    </div>
  );
}
