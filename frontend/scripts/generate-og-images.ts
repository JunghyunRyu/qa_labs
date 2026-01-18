/**
 * OG 이미지 정적 생성 스크립트
 *
 * 사용법: npx tsx scripts/generate-og-images.ts
 *
 * 모든 문제에 대해 OG 이미지를 미리 생성하여 public/og/ 폴더에 저장합니다.
 */

import satori from "satori";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";

const API_URL = process.env.API_URL || "https://qa-arena.qalabs.kr/api";

// 난이도별 색상 및 레벨
const difficultyConfig: Record<string, { level: number; color: string; glow: string }> = {
  "Very Easy": { level: 1, color: "#22c55e", glow: "rgba(34, 197, 94, 0.3)" },
  Easy: { level: 2, color: "#84cc16", glow: "rgba(132, 204, 22, 0.3)" },
  Medium: { level: 3, color: "#eab308", glow: "rgba(234, 179, 8, 0.3)" },
  Hard: { level: 4, color: "#f97316", glow: "rgba(249, 115, 22, 0.3)" },
  "Very Hard": { level: 5, color: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" },
};

const domainLabels: Record<string, string> = {
  common: "공통",
  fintech: "핀테크",
  commerce: "커머스",
  saas: "SaaS",
  platform: "플랫폼",
  content: "콘텐츠",
};

interface Problem {
  id: number;
  slug: string;
  title: string;
  difficulty: string;
  domain: string;
  skills: string[];
  bugs_count: number;  // API returns this directly
  buggy_implementations?: { id: number }[];  // Optional, only in detail endpoint
}

async function loadFont(): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), "public", "fonts", "NotoSansKR-Bold.ttf");
  const fontBuffer = await readFile(fontPath);
  return fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );
}

function createOgImageJsx(problem: Problem) {
  const config = difficultyConfig[problem.difficulty] || difficultyConfig["Medium"];
  const domainLabel = domainLabels[problem.domain] || problem.domain;
  const bugsCount = problem.bugs_count || problem.buggy_implementations?.length || 0;
  const skills = problem.skills?.slice(0, 3) || [];

  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0a0f1a",
        fontFamily: '"Noto Sans KR"',
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // 배경 그라디언트
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(ellipse at 30% 20%, ${config.glow} 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(56, 189, 248, 0.15) 0%, transparent 50%)`,
            },
          },
        },
        // 왼쪽 영역 - 버그 카운트
        {
          type: "div",
          props: {
            style: {
              width: "320px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderRight: "1px solid rgba(255,255,255,0.1)",
              position: "relative",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "24px",
                    color: "#64748b",
                    marginBottom: "16px",
                    letterSpacing: "4px",
                  },
                  children: "TARGET",
                },
              },
              {
                type: "div",
                props: {
                  style: {
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
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", fontSize: "20px", color: "#94a3b8" },
                        children: "BUGS",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: "72px",
                          fontWeight: "bold",
                          color: config.color,
                          lineHeight: 1,
                        },
                        children: String(bugsCount),
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    marginTop: "24px",
                    fontSize: "18px",
                    color: config.color,
                    fontWeight: "bold",
                  },
                  children: problem.difficulty,
                },
              },
            ],
          },
        },
        // 오른쪽 영역 - 문제 정보
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "60px",
              position: "relative",
            },
            children: [
              // 헤더
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "32px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: "20px",
                          color: "#38bdf8",
                          fontWeight: "bold",
                          letterSpacing: "2px",
                        },
                        children: "QA ARENA",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          background: "#38bdf8",
                          color: "#0a0f1a",
                          padding: "6px 16px",
                          borderRadius: "20px",
                          fontSize: "16px",
                          fontWeight: "bold",
                        },
                        children: domainLabel,
                      },
                    },
                  ],
                },
              },
              // 제목
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "52px",
                    fontWeight: "bold",
                    color: "white",
                    lineHeight: 1.2,
                    marginBottom: "32px",
                    maxWidth: "700px",
                  },
                  children: problem.title,
                },
              },
              // 난이도 바
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" },
                  children: [1, 2, 3, 4, 5].map((i) => ({
                    type: "div",
                    props: {
                      style: {
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: config.level >= i ? config.color : "#334155",
                      },
                    },
                  })),
                },
              },
              // 스킬 태그
              skills.length > 0
                ? {
                    type: "div",
                    props: {
                      style: { display: "flex", gap: "12px" },
                      children: skills.map((skill) => ({
                        type: "span",
                        props: {
                          style: {
                            display: "flex",
                            fontSize: "18px",
                            color: "#94a3b8",
                            background: "rgba(255,255,255,0.1)",
                            padding: "8px 16px",
                            borderRadius: "8px",
                          },
                          children: `#${skill}`,
                        },
                      })),
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // 푸터
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "absolute",
              bottom: "24px",
              right: "40px",
              fontSize: "16px",
              color: "#475569",
            },
            children: "qa-arena.qalabs.kr",
          },
        },
      ],
    },
  };
}

async function generateOgImage(problem: Problem, font: ArrayBuffer): Promise<Buffer> {
  const jsx = createOgImageJsx(problem);

  const svg = await satori(jsx as any, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Noto Sans KR",
        data: font,
        weight: 700,
        style: "normal",
      },
    ],
  });

  // SVG를 PNG로 변환
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}

async function main() {
  console.log("🖼️  OG 이미지 생성 시작...\n");

  // 폰트 로드
  console.log("📝 폰트 로딩...");
  const font = await loadFont();
  console.log("✅ 폰트 로드 완료\n");

  // 출력 디렉토리 생성
  const outputDir = join(process.cwd(), "public", "og");
  await mkdir(outputDir, { recursive: true });

  // 문제 목록 가져오기 (페이지네이션 처리)
  console.log("📋 문제 목록 가져오는 중...");
  const problems: Problem[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await fetch(`${API_URL}/v1/problems?page=${page}&page_size=50`);
    const data = await response.json();
    problems.push(...(data.problems || []));
    totalPages = data.total_pages || 1;
    console.log(`  페이지 ${page}/${totalPages} 로드 (${data.problems?.length || 0}개)`);
    page++;
  } while (page <= totalPages);

  console.log(`✅ 총 ${problems.length}개 문제 발견\n`);

  // 각 문제에 대해 OG 이미지 생성
  let success = 0;
  let failed = 0;

  for (const problem of problems) {
    try {
      process.stdout.write(`  생성 중: ${problem.slug}...`);
      const png = await generateOgImage(problem, font);

      // ID 기반과 slug 기반 모두 저장
      await writeFile(join(outputDir, `${problem.id}.png`), png);
      await writeFile(join(outputDir, `${problem.slug}.png`), png);

      console.log(" ✅");
      success++;
    } catch (error) {
      console.log(` ❌ ${error}`);
      failed++;
    }
  }

  console.log(`\n🎉 완료! 성공: ${success}, 실패: ${failed}`);
  console.log(`📁 저장 위치: ${outputDir}`);
}

main().catch(console.error);
