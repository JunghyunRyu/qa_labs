/**
 * useEditorAction Hook
 *
 * Monaco Editor에 코드를 적용할 때 Undo 스택을 보존하는 훅입니다.
 * setValue() 대신 executeEdits() + pushUndoStop() 패턴을 사용합니다.
 *
 * @see https://github.com/microsoft/monaco-editor/issues/299
 */

import { useCallback, useRef, useState } from 'react';
import type { editor } from 'monaco-editor';
import { toast } from 'sonner';

interface ApplyHistory {
  beforeCode: string;
  afterCode: string;
  timestamp: number;
}

interface UseEditorActionReturn {
  /** AI 코드를 에디터에 적용 (Undo 스택 보존) */
  applyCode: (newCode: string) => boolean;
  /** 마지막 Apply 되돌리기 */
  undoLastApply: () => void;
  /** 에디터 내용 초기화 */
  clearCode: () => void;
  /** 현재 코드 가져오기 */
  getCurrentCode: () => string;
  /** 마지막 Apply 정보 */
  lastApply: ApplyHistory | null;
  /** Apply 이력 */
  applyHistory: ApplyHistory[];
}

/**
 * Monaco Editor에 코드를 적용하는 훅
 *
 * @param editorRef - Monaco Editor 인스턴스 ref
 * @returns 에디터 액션 함수들
 *
 * @example
 * ```tsx
 * const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
 * const { applyCode, undoLastApply } = useEditorAction(editorRef);
 *
 * // AI 코드 적용
 * applyCode(aiGeneratedCode);
 *
 * // 되돌리기
 * undoLastApply();
 * ```
 */
export function useEditorAction(
  editorRef: React.RefObject<editor.IStandaloneCodeEditor | null>
): UseEditorActionReturn {
  const [lastApply, setLastApply] = useState<ApplyHistory | null>(null);
  const historyRef = useRef<ApplyHistory[]>([]);

  /**
   * AI 코드를 에디터에 적용
   * - executeEdits() 사용으로 Undo 스택 보존
   * - pushUndoStop()으로 Undo 경계 설정
   */
  const applyCode = useCallback((newCode: string): boolean => {
    const editor = editorRef.current;
    if (!editor) {
      console.warn('[useEditorAction] Editor not ready');
      return false;
    }

    const model = editor.getModel();
    if (!model) {
      console.warn('[useEditorAction] Editor model not available');
      return false;
    }

    // 현재 코드 저장 (이력용)
    const beforeCode = model.getValue();

    // 동일한 코드면 무시
    if (beforeCode === newCode) {
      toast.info('이미 같은 코드입니다.');
      return false;
    }

    // 1. 전체 텍스트 범위 계산
    const fullRange = model.getFullModelRange();

    // 2. executeEdits로 변경 사항 적용 (단일 트랜잭션)
    // 'ai-apply' 소스 식별자는 나중에 이벤트 추적에 활용 가능
    editor.executeEdits('ai-apply', [
      {
        range: fullRange,
        text: newCode,
        forceMoveMarkers: true,
      },
    ]);

    // 3. Undo 스택에 경계점 추가 (Ctrl+Z로 복원 가능)
    editor.pushUndoStop();

    // 4. 이력 저장
    const history: ApplyHistory = {
      beforeCode,
      afterCode: newCode,
      timestamp: Date.now(),
    };
    historyRef.current.push(history);
    setLastApply(history);

    // 5. 포커스 이동
    editor.focus();

    // 6. 토스트 알림
    toast.success('코드가 적용되었습니다. Ctrl+Z로 되돌릴 수 있습니다.', {
      duration: 3000,
      action: {
        label: '되돌리기',
        onClick: () => {
          editor.trigger('ai-verifier', 'undo', null);
        },
      },
    });

    return true;
  }, [editorRef]);

  /**
   * 마지막 Apply 되돌리기
   */
  const undoLastApply = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Monaco 내장 Undo 호출
    editor.trigger('ai-verifier', 'undo', null);
    toast.info('되돌렸습니다.');
  }, [editorRef]);

  /**
   * 에디터 초기화
   */
  const clearCode = useCallback(() => {
    applyCode('');
  }, [applyCode]);

  /**
   * 현재 코드 가져오기
   */
  const getCurrentCode = useCallback((): string => {
    const editor = editorRef.current;
    if (!editor) return '';
    return editor.getModel()?.getValue() || '';
  }, [editorRef]);

  return {
    applyCode,
    undoLastApply,
    clearCode,
    getCurrentCode,
    lastApply,
    applyHistory: historyRef.current,
  };
}

export default useEditorAction;
