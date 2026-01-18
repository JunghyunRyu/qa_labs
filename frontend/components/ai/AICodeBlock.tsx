/**
 * AICodeBlock - AI 응답용 코드 블록 컴포넌트
 *
 * 기능:
 * - Python 구문 강조
 * - 복사 버튼
 * - "에디터에 삽입" 버튼
 */

"use client";

import { useState, useCallback } from "react";
import { Clipboard, Check, Code2 } from "lucide-react";
import { highlightPythonSyntax, preprocessCodeForPython } from "@/lib/syntaxHighlight";

interface AICodeBlockProps {
  code: string;
  language?: string;
  onInsertToEditor?: (code: string) => void;
}

export default function AICodeBlock({
  code,
  language = "python",
  onInsertToEditor,
}: AICodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      const processedCode = preprocessCodeForPython(code);
      await navigator.clipboard.writeText(processedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  }, [code]);

  const handleInsert = useCallback(() => {
    if (!onInsertToEditor) return;
    const processedCode = preprocessCodeForPython(code);
    onInsertToEditor(processedCode);
    setInserted(true);
    setTimeout(() => setInserted(false), 2000);
  }, [code, onInsertToEditor]);

  const isPython = language === "python" || language === "py";

  return (
    <div className="relative group my-2">
      {/* 코드 컨테이너 */}
      <div className="p-3 bg-slate-950 rounded-lg border border-slate-700 font-mono text-xs overflow-x-auto">
        {isPython ? (
          highlightPythonSyntax(code)
        ) : (
          <pre className="text-slate-300 whitespace-pre-wrap">{code}</pre>
        )}
      </div>

      {/* 버튼 바 (호버 시 등장) */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 에디터에 삽입 버튼 */}
        {onInsertToEditor && (
          <button
            onClick={handleInsert}
            className={`p-1.5 rounded-md transition-all border
                       ${inserted
                         ? "bg-green-600 border-green-500 text-white"
                         : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
                       }`}
            title={inserted ? "삽입됨!" : "에디터에 삽입"}
          >
            {inserted ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Code2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* 복사 버튼 */}
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-all border
                     ${copied
                       ? "bg-green-600 border-green-500 text-white"
                       : "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-700"
                     }`}
          title={copied ? "복사됨!" : "코드 복사"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Clipboard className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 복사/삽입 완료 툴팁 */}
      {(copied || inserted) && (
        <span className="absolute top-2 right-16 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg">
          {copied ? "복사됨!" : "삽입됨!"}
        </span>
      )}
    </div>
  );
}
