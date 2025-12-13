"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  /** @deprecated Use `value` instead */
  text?: string;
  /** 복사할 값 */
  value?: string;
  /** 접근성 레이블 */
  label?: string;
  className?: string;
  size?: "sm" | "md";
  /** 복사 성공 콜백 */
  onCopy?: () => void;
}

export default function CopyButton({
  text,
  value,
  label,
  className = "",
  size = "sm",
  onCopy,
}: CopyButtonProps) {
  // value가 우선, text는 하위 호환성
  const copyValue = value ?? text ?? "";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [copyValue, onCopy]);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const padding = size === "sm" ? "p-1.5" : "p-2";

  return (
    <button
      onClick={handleCopy}
      className={`${padding} rounded-md transition-all duration-200 ${
        copied
          ? "bg-green-500/20 text-green-400"
          : "bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300"
      } ${className}`}
      title={copied ? "복사됨!" : label || "코드 복사"}
      aria-label={copied ? "복사됨" : label || "코드 복사"}
    >
      {copied ? (
        <Check className={iconSize} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}
