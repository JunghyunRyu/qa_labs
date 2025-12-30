import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QA Arena Problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DifficultyStars {
  [key: string]: string;
}

const difficultyStars: DifficultyStars = {
  "Very Easy": "★☆☆☆☆",
  Easy: "★★☆☆☆",
  Medium: "★★★☆☆",
  Hard: "★★★★☆",
  "Very Hard": "★★★★★",
};

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

  try {
    const res = await fetch(`${API_URL}/api/v1/problems/${params.id}`);
    if (res.ok) {
      problem = await res.json();
    }
  } catch {
    // 에러 시 기본값 사용
  }

  const title = problem?.title || "QA Challenge";
  const difficulty = problem?.difficulty || "Medium";
  const category = problem?.category || "common";
  const stars = difficultyStars[difficulty] || "★★★☆☆";
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
          fontFamily: "sans-serif",
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
            <span style={{ color: "#fbbf24" }}>{stars}</span>
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
    { ...size }
  );
}
