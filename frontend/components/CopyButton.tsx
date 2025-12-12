"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
}

export default function CopyButton({
  text,
  className = "",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [text]);

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
      title={copied ? "복사됨!" : "코드 복사"}
      aria-label={copied ? "복사됨" : "코드 복사"}
    >
      {copied ? (
        <Check className={iconSize} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}
