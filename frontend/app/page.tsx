export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <main className="flex flex-col items-center gap-8 p-8">
        <h1 className="text-4xl font-bold text-gray-900">QA-Arena</h1>
        <p className="text-lg text-gray-600 text-center max-w-md">
          AI-Assisted QA Coding Test Platform
        </p>
        <div className="mt-4">
          <a
            href="/problems"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            문제 목록 보기
          </a>
        </div>
      </main>
    </div>
  );
}
