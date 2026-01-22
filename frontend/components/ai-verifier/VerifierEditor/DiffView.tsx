'use client';

/**
 * DiffView Component
 *
 * Monaco DiffEditor를 사용하여 코드 변경사항을 나란히 표시합니다.
 * AI 코드 적용 전/후 비교에 사용됩니다.
 */

import { DiffEditor } from '@monaco-editor/react';

interface DiffViewProps {
  /** 원본 코드 (Before) */
  original: string;
  /** 수정된 코드 (After) */
  modified: string;
  /** 표시 언어 */
  language?: string;
  /** 높이 */
  height?: string;
}

export default function DiffView({
  original,
  modified,
  language = 'python',
  height = '100%',
}: DiffViewProps) {
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language}
      theme="vs-dark"
      height={height}
      options={{
        readOnly: true,
        renderSideBySide: true, // 나란히 표시 (false: 인라인)
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on',
        // Diff-specific options
        enableSplitViewResizing: true,
        renderOverviewRuler: false,
        diffWordWrap: 'on',
      }}
    />
  );
}
