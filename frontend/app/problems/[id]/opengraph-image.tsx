import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "QA Arena - 버그 찾기 챌린지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_URL =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000/api";

// Google Fonts 로드
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

// 난이도별 설정 (색상, 라벨, 글로우)
const difficultyConfig: {
  [key: string]: { label: string; color: string; glow: string; level: number };
} = {
  "Very Easy": { label: "입문", color: "#06b6d4", glow: "rgba(6,182,212,0.4)", level: 1 },
  Easy: { label: "EASY", color: "#10b981", glow: "rgba(16,185,129,0.4)", level: 2 },
  Medium: { label: "MEDIUM", color: "#f59e0b", glow: "rgba(245,158,11,0.4)", level: 3 },
  Hard: { label: "HARD", color: "#ef4444", glow: "rgba(239,68,68,0.5)", level: 4 },
  "Very Hard": { label: "EXTREME", color: "#dc2626", glow: "rgba(220,38,38,0.5)", level: 5 },
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

  const [notoSansKR, problemData] = await Promise.all([
    loadGoogleFont("Noto+Sans+KR", 700),
    fetch(`${API_URL}/v1/problems/${id}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
  ]);

  const problem = problemData;
  const title = problem?.title || "QA Challenge";
  const difficulty = problem?.difficulty || "Medium";
  const domain = problem?.domain || "common";
  const config = difficultyConfig[difficulty] || difficultyConfig["Medium"];
  const domainLabel = domainLabels[domain] || domain;
  const bugsCount = problem?.buggy_implementations?.length || 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0f",
          fontFamily: '"Noto Sans KR", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 배경: 코드 패턴 (희미하게) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.06,
            fontSize: "14px",
            color: "#ffffff",
            lineHeight: 1.8,
            padding: "20px",
            fontFamily: "monospace",
          }}
        >
          {`def test_bug_detection():\n    assert find_bugs(code) > 0\n    for bug in hidden_bugs:\n        assert detector.catch(bug)\n\nclass BugHunter:\n    def __init__(self):\n        self.score = 0\n    \n    def hunt(self, target):\n        if self.detect(target):\n            self.score += 100\n            return True\n        return False\n\n@pytest.fixture\ndef setup_test_env():\n    return TestEnvironment()\n\ndef test_boundary_values():\n    # Edge case testing\n    assert validate(0) == True\n    assert validate(-1) == False`}
        </div>

        {/* 글로우 효과들 */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-100px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* 좌측: 텍스트 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px",
            paddingRight: "40px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* 상단: 난이도 뱃지 + 도메인 */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                background: config.color,
                color: "#000",
                padding: "8px 20px",
                borderRadius: "6px",
                fontSize: "22px",
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              {config.label}
            </div>
            <div
              style={{
                color: "#64748b",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span style={{ color: "#475569" }}>#</span>
              {domainLabel}
            </div>
          </div>

          {/* 메인 제목 */}
          <div
            style={{
              fontSize: title.length > 25 ? "44px" : "52px",
              fontWeight: "bold",
              color: "#ffffff",
              lineHeight: 1.3,
              marginBottom: "28px",
              maxWidth: "650px",
            }}
          >
            {title}
          </div>

          {/* 도발 문구 */}
          <div
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              marginBottom: "32px",
            }}
          >
            이 코드에 숨겨진 버그를 찾을 수 있나요?
          </div>

          {/* CTA 버튼 스타일 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              padding: "14px 28px",
              borderRadius: "12px",
              fontSize: "22px",
              fontWeight: "bold",
              color: "#fff",
              width: "fit-content",
            }}
          >
            <span>🎯</span>
            <span>지금 도전하기</span>
            <span style={{ marginLeft: "4px" }}>→</span>
          </div>

          {/* 푸터 */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "60px",
              fontSize: "18px",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "20px" }}>🎮</span>
            <span>qa-arena.qalabs.kr</span>
          </div>
        </div>

        {/* 우측: 버그 카운트 비주얼 */}
        <div
          style={{
            width: "380px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* 버그 타겟 원 */}
          <div
            style={{
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              border: `4px solid ${config.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              background: "rgba(0,0,0,0.5)",
              boxShadow: `0 0 60px ${config.glow}, inset 0 0 60px rgba(0,0,0,0.5)`,
            }}
          >
            {/* 타겟 링 */}
            <div
              style={{
                position: "absolute",
                width: "240px",
                height: "240px",
                borderRadius: "50%",
                border: `2px solid ${config.color}40`,
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                border: `2px solid ${config.color}30`,
              }}
            />

            {/* 경고 아이콘 */}
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚠️</div>

            {/* BUG 텍스트 */}
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: config.color,
                letterSpacing: "4px",
              }}
            >
              BUG
            </div>

            {/* 숫자 */}
            <div
              style={{
                fontSize: "80px",
                fontWeight: "bold",
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              {bugsCount || "?"}
            </div>

            {/* 발견 텍스트 */}
            <div
              style={{
                fontSize: "18px",
                color: "#94a3b8",
                marginTop: "4px",
              }}
            >
              개를 찾아보세요
            </div>
          </div>

          {/* 난이도 인디케이터 */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "24px",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: i <= config.level ? config.color : "#334155",
                  boxShadow: i <= config.level ? `0 0 10px ${config.color}` : "none",
                }}
              />
            ))}
          </div>
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
