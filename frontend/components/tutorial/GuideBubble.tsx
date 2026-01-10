"use client";

import { MessageCircle } from "lucide-react";

type BubblePosition = "top" | "bottom" | "left" | "right";

interface GuideBubbleProps {
  title: string;
  content: string | React.ReactNode;
  position: BubblePosition;
  targetRect: DOMRect | null;
  showSkip?: boolean;
  showNext?: boolean;
  showPrev?: boolean;
  nextLabel?: string;
  onNext?: () => void;
  onPrev?: () => void;
  onSkip?: () => void;
}

/**
 * GuideBubble - 안내 말풍선 컴포넌트
 *
 * 튜토리얼 단계별 안내 메시지를 표시합니다.
 */
export default function GuideBubble({
  title,
  content,
  position = "bottom",
  targetRect,
  showSkip = false,
  showNext = false,
  showPrev = false,
  nextLabel = "다음",
  onNext,
  onPrev,
  onSkip,
}: GuideBubbleProps) {
  // If no targetRect, render as inline component
  if (!targetRect) {
    return (
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-400 mb-1">{title}</h4>
            <div className="text-white font-medium">{content}</div>
          </div>
        </div>

        {/* Action buttons */}
        {(showPrev || showNext || showSkip) && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-500/20">
            <div>
              {showSkip && (
                <button
                  onClick={onSkip}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  건너뛰기
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {showPrev && (
                <button
                  onClick={onPrev}
                  className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                >
                  이전
                </button>
              )}
              {showNext && (
                <button
                  onClick={onNext}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  {nextLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calculate position relative to target
  const getBubbleStyle = () => {
    const offset = 16;
    const bubbleWidth = 320;
    const bubbleHeight = 120;

    switch (position) {
      case "top":
        return {
          bottom: window.innerHeight - targetRect.top + offset,
          left: targetRect.left + targetRect.width / 2 - bubbleWidth / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + offset,
          left: targetRect.left + targetRect.width / 2 - bubbleWidth / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
          right: window.innerWidth - targetRect.left + offset,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - bubbleHeight / 2,
          left: targetRect.right + offset,
        };
      default:
        return {};
    }
  };

  const getArrowClass = () => {
    switch (position) {
      case "top":
        return "bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-[#1e3a5f]";
      case "bottom":
        return "top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-[#1e3a5f]";
      case "left":
        return "right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-[#1e3a5f]";
      case "right":
        return "left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-[#1e3a5f]";
      default:
        return "";
    }
  };

  return (
    <div
      className="fixed z-[60] w-80 bg-gradient-to-r from-[#1e3a5f] to-[#2d1b4e] border border-blue-500/30 rounded-xl p-4 shadow-xl pointer-events-auto animate-in fade-in slide-in-from-bottom-2"
      style={getBubbleStyle()}
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-8 ${getArrowClass()}`}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
          <MessageCircle className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-400 mb-1">{title}</h4>
          <div className="text-white font-medium">{content}</div>
        </div>
      </div>

      {/* Action buttons */}
      {(showPrev || showNext || showSkip) && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-500/20">
          <div>
            {showSkip && (
              <button
                onClick={onSkip}
                className="text-sm text-gray-400 hover:text-white"
              >
                건너뛰기
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {showPrev && (
              <button
                onClick={onPrev}
                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
              >
                이전
              </button>
            )}
            {showNext && (
              <button
                onClick={onNext}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
