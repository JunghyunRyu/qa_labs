'use client';

/**
 * VerifierEditor Component
 *
 * AI Verifier Track 전용 Monaco Editor 래퍼입니다.
 * - Code 탭: 코드 표시 (기본)
 * - Diff 탭: 이전/현재 코드 비교
 * - 되돌리기 버튼
 */

import { useRef, useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import DiffView from './DiffView';
import type { editor } from 'monaco-editor';

type EditorTab = 'code' | 'diff';

interface VerifierEditorProps {
  /** 현재 코드 */
  code: string;
  /** Diff 비교용 이전 코드 */
  previousCode?: string;
  /** 읽기 전용 모드 (기본: true) */
  readOnly?: boolean;
  /** 에디터 준비 완료 콜백 */
  onEditorReady?: (editor: editor.IStandaloneCodeEditor) => void;
  /** 되돌리기 콜백 */
  onUndo?: () => void;
  /** 높이 */
  height?: string;
}

export default function VerifierEditor({
  code,
  previousCode,
  readOnly = true,
  onEditorReady,
  onUndo,
  height = '100%',
}: VerifierEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>('code');

  const handleEditorReady = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    onEditorReady?.(editor);
  };

  // Diff 탭 표시 조건: 이전 코드가 있고 현재 코드와 다를 때
  const showDiffTab = previousCode !== undefined && previousCode !== code;

  return (
    <div
      className="h-full w-full flex flex-col border border-gray-700 rounded-lg overflow-hidden"
      style={{ height }}
    >
      {/* 탭 헤더 */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'code'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            Code
          </button>
          {showDiffTab && (
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                activeTab === 'diff'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              Diff
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="text-yellow-500 text-xs px-2 py-1 bg-yellow-900/30 rounded">
              Read-only
            </span>
          )}
          {onUndo && (
            <button
              onClick={onUndo}
              className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
              title="Ctrl+Z"
            >
              ↩ 되돌리기
            </button>
          )}
        </div>
      </div>

      {/* 에디터 본문 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' ? (
          <CodeEditor
            value={code}
            readOnly={readOnly}
            onEditorReady={handleEditorReady}
            onChange={() => {}} // Read-only이므로 빈 핸들러
            height="100%"
          />
        ) : (
          <DiffView
            original={previousCode || ''}
            modified={code}
            height="100%"
          />
        )}
      </div>
    </div>
  );
}
