import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QA Arena Problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Edge Runtime은 Docker 내부 네트워크에 접근 불가 - 공개 URL 사용 필수
// OG_API_URL > 공개 도메인 > localhost 순으로 fallback
const API_URL =
  process.env.OG_API_URL ||
  "https://qa-arena.qalabs.kr/api";

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

// 난이도별 색상 및 레벨
const difficultyConfig: { [key: string]: { level: number; color: string; glow: string } } = {
  "Very Easy": { level: 1, color: "#22c55e", glow: "rgba(34, 197, 94, 0.3)" },
  Easy: { level: 2, color: "#84cc16", glow: "rgba(132, 204, 22, 0.3)" },
  Medium: { level: 3, color: "#eab308", glow: "rgba(234, 179, 8, 0.3)" },
  Hard: { level: 4, color: "#f97316", glow: "rgba(249, 115, 22, 0.3)" },
  "Very Hard": { level: 5, color: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" },
};

const domainLabels: { [key: string]: string } = {
  common: "공통",
  fintech: "핀테크",
  commerce: "커머스",
  saas: "SaaS",
  platform: "플랫폼",
  content: "콘텐츠",
};

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let problem = null;

  // 폰트와 문제 데이터를 병렬로 로드
  const [notoSansKR, problemData] = await Promise.all([
    loadGoogleFont("Noto+Sans+KR", 700),
    fetch(`${API_URL}/v1/problems/${id}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
  ]);

  problem = problemData;

  const title = problem?.title || "QA Challenge";
  const difficulty = problem?.difficulty || "Medium";
  const domain = problem?.domain || "common";
  const config = difficultyConfig[difficulty] || difficultyConfig["Medium"];
  const domainLabel = domainLabels[domain] || domain;
  const bugsCount = problem?.buggy_implementations?.length || 0;
  const skills: string[] = problem?.skills?.slice(0, 3) || [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0f1a",
          fontFamily: '"Noto Sans KR", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경 그라디언트 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 30% 20%, ${config.glow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(56, 189, 248, 0.15) 0%, transparent 50%)`,
          }}
        />

        {/* 왼쪽 영역 - 버그 카운트 */}
        <div
          style={{
            width: "320px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRight: "1px solid rgba(255,255,255,0.1)",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              color: "#64748b",
              marginBottom: "16px",
              letterSpacing: "4px",
            }}
          >
            TARGET
          </div>
          <div
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${config.color}22, ${config.color}44)`,
              border: `4px solid ${config.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 60px ${config.glow}`,
            }}
          >
            <div style={{ fontSize: "20px", color: "#94a3b8" }}>🐛 BUGS</div>
            <div
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: config.color,
                lineHeight: 1,
              }}
            >
              {bugsCount}
            </div>
          </div>
          <div
            style={{
              marginTop: "24px",
              fontSize: "18px",
              color: config.color,
              fontWeight: "bold",
            }}
          >
            {difficulty}
          </div>
        </div>

        {/* 오른쪽 영역 - 문제 정보 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            position: "relative",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                color: "#38bdf8",
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              QA ARENA
            </div>
            <div
              style={{
                background: "#38bdf8",
                color: "#0a0f1a",
                padding: "6px 16px",
                borderRadius: "20px",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              {domainLabel}
            </div>
          </div>

          {/* 제목 */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: "bold",
              color: "white",
              lineHeight: 1.2,
              marginBottom: "32px",
              maxWidth: "700px",
            }}
          >
            {title}
          </div>

          {/* 난이도 바 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: config.level >= 1 ? config.color : "#334155",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: config.level >= 2 ? config.color : "#334155",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: config.level >= 3 ? config.color : "#334155",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: config.level >= 4 ? config.color : "#334155",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: config.level >= 5 ? config.color : "#334155",
              }}
            />
          </div>

          {/* 스킬 태그 */}
          {skills.length > 0 && (
            <div style={{ display: "flex", gap: "12px" }}>
              <span
                style={{
                  fontSize: "18px",
                  color: "#94a3b8",
                  background: "rgba(255,255,255,0.1)",
                  padding: "8px 16px",
                  borderRadius: "8px",
                }}
              >
                #{skills[0] || ""}
              </span>
              {skills[1] && (
                <span
                  style={{
                    fontSize: "18px",
                    color: "#94a3b8",
                    background: "rgba(255,255,255,0.1)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                  }}
                >
                  #{skills[1]}
                </span>
              )}
              {skills[2] && (
                <span
                  style={{
                    fontSize: "18px",
                    color: "#94a3b8",
                    background: "rgba(255,255,255,0.1)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                  }}
                >
                  #{skills[2]}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "40px",
            fontSize: "16px",
            color: "#475569",
          }}
        >
          qa-arena.qalabs.kr
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
