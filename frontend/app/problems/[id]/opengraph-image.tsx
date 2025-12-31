import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QA Arena Problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 서버 사이드: INTERNAL_API_URL (컨테이너 간 통신), 클라이언트: NEXT_PUBLIC_API_URL
const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

// Google Fonts에서 Noto Sans KR 폰트 로드 (한글 지원)
async function loadGoogleFont(font: string, weight: number) {
  const url = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&display=swap`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/
  );
  if (resource) {
    const fontData = await fetch(resource[1]);
    return fontData.arrayBuffer();
  }
  return null;
}

// 난이도별 채워진 원 개수 (5점 만점)
const difficultyLevels: { [key: string]: number } = {
  "Very Easy": 1,
  Easy: 2,
  Medium: 3,
  Hard: 4,
  "Very Hard": 5,
};

// CSS 기반 난이도 표시 컴포넌트
function DifficultyDots({ level }: { level: number }) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: i <= level ? "#fbbf24" : "#475569",
          }}
        />
      ))}
    </div>
  );
}

const categoryLabels: { [key: string]: string } = {
  common: "공통",
  fintech: "핀테크",
  commerce: "커머스",
  saas: "SaaS",
  platform: "플랫폼",
  content: "콘텐츠",
};

export default async function Image({ params }: { params: { id: string } }) {
  let problem = null;

  // 폰트와 문제 데이터를 병렬로 로드
  const [notoSansKR, problemData] = await Promise.all([
    loadGoogleFont("Noto+Sans+KR", 700),
    fetch(`${API_URL}/v1/problems/${params.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
  ]);

  problem = problemData;

  const title = problem?.title || "QA Challenge";
  const difficulty = problem?.difficulty || "Medium";
  const category = problem?.category || "common";
  const difficultyLevel = difficultyLevels[difficulty] || 3;
  const categoryLabel = categoryLabels[category] || category;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          fontFamily: '"Noto Sans KR", sans-serif',
          padding: "40px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              fontSize: "32px",
              color: "#38bdf8",
              fontWeight: "bold",
            }}
          >
            QA Arena Challenge
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: "bold",
            marginBottom: "40px",
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>

        {/* Difficulty & Category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "40px",
            fontSize: "28px",
            color: "#94a3b8",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>난이도:</span>
            <DifficultyDots level={difficultyLevel} />
          </div>
          <div
            style={{
              width: "2px",
              height: "24px",
              background: "#475569",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "#38bdf8",
                color: "#0f172a",
                padding: "4px 16px",
                borderRadius: "20px",
                fontWeight: "bold",
              }}
            >
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: "50px",
            fontSize: "24px",
            color: "#38bdf8",
          }}
        >
          숨은 버그를 찾아낼 수 있나요?
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "18px",
            color: "#64748b",
          }}
        >
          <span>qa-arena.qalabs.kr</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: notoSansKR
        ? [
            {
              name: "Noto Sans KR",
              data: notoSansKR,
              weight: 700,
              style: "normal" as const,
            },
          ]
        : [],
    }
  );
}
