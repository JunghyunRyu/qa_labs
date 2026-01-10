"use client";

import { useEffect, useState, useRef } from "react";

interface TutorialOverlayProps {
  isActive: boolean;
  targetSelector: string;
  children?: React.ReactNode;
}

/**
 * TutorialOverlay - 화면 딤 처리 + Spotlight 효과
 *
 * 특정 요소를 강조하고 나머지 영역을 어둡게 처리합니다.
 */
export default function TutorialOverlay({
  isActive,
  targetSelector,
  children,
}: TutorialOverlayProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateTargetRect = () => {
      const element = document.querySelector(targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    // Initial update
    updateTargetRect();

    // Update on scroll/resize
    window.addEventListener("scroll", updateTargetRect, true);
    window.addEventListener("resize", updateTargetRect);

    return () => {
      window.removeEventListener("scroll", updateTargetRect, true);
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [isActive, targetSelector]);

  if (!isActive || !targetRect) {
    return null;
  }

  // Calculate spotlight area with padding
  const padding = 8;
  const spotlightStyle = {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    >
      {/* Dim overlay with spotlight cutout using CSS mask */}
      <div
        className="absolute inset-0 bg-black/60 transition-all duration-300"
        style={{
          maskImage: `
            linear-gradient(#000 0 0),
            linear-gradient(#000 0 0)
          `,
          maskPosition: `0 0, ${spotlightStyle.left}px ${spotlightStyle.top}px`,
          maskSize: `100% 100%, ${spotlightStyle.width}px ${spotlightStyle.height}px`,
          maskRepeat: "no-repeat",
          maskComposite: "exclude",
          WebkitMaskImage: `
            linear-gradient(#000 0 0),
            linear-gradient(#000 0 0)
          `,
          WebkitMaskPosition: `0 0, ${spotlightStyle.left}px ${spotlightStyle.top}px`,
          WebkitMaskSize: `100% 100%, ${spotlightStyle.width}px ${spotlightStyle.height}px`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskComposite: "xor",
        }}
      />

      {/* Spotlight border/glow effect */}
      <div
        className="absolute border-2 border-blue-400 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300"
        style={{
          top: spotlightStyle.top,
          left: spotlightStyle.left,
          width: spotlightStyle.width,
          height: spotlightStyle.height,
        }}
      />

      {/* Children (e.g., GuideBubble) */}
      {children}
    </div>
  );
}
