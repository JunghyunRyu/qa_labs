import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "QA Arena Problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // 정적 OG 이미지 경로 (ID 또는 slug로 찾기)
    const ogDir = join(process.cwd(), "public", "og");

    // ID로 먼저 시도
    let imagePath = join(ogDir, `${id}.png`);
    let imageBuffer: Buffer;

    try {
      imageBuffer = await readFile(imagePath);
    } catch {
      // slug로 시도 (problem- 접두사 추가)
      imagePath = join(ogDir, `problem-${id.toLowerCase()}.png`);
      try {
        imageBuffer = await readFile(imagePath);
      } catch {
        // 정적 이미지 없음 - 기본 이미지 반환
        return generateFallbackImage();
      }
    }

    // 정적 이미지 반환
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("OG image error:", error);
    return generateFallbackImage();
  }
}

// 정적 이미지가 없을 때 사용할 기본 이미지
function generateFallbackImage() {
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
        }}
      >
        <div style={{ display: "flex", fontSize: "64px", fontWeight: "bold", marginBottom: "20px" }}>
          QA Arena
        </div>
        <div style={{ display: "flex", fontSize: "32px", color: "#94a3b8" }}>
          QA Challenge
        </div>
      </div>
    ),
    { ...size }
  );
}
