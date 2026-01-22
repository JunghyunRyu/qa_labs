/**
 * useAIChat Hook
 *
 * AI Verifier Track용 AI 채팅 훅입니다.
 * - SSE 스트리밍 응답 처리
 * - chunk 경계 버퍼링
 * - [DONE] 시그널 처리
 */

import { useState, useCallback, useRef } from 'react';

const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || '').trim() || '/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isPrescripted?: boolean;
}

interface UseAIChatOptions {
  challengeId: string;
  challengeLevel: number;
}

export type StreamingState = 'idle' | 'connecting' | 'streaming' | 'done' | 'error';

export function useAIChat({ challengeId, challengeLevel }: UseAIChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingState, setStreamingState] = useState<StreamingState>('idle');
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * SSE 스트림 파서
   * - chunk 경계 처리: 불완전한 라인은 버퍼에 유지
   * - data: 접두사 처리
   * - [DONE] 시그널 감지
   */
  const parseSSEStream = useCallback(async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (content: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ) => {
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 디코딩 후 버퍼에 추가
        buffer += decoder.decode(value, { stream: true });

        // 라인 단위로 분리
        const lines = buffer.split('\n');

        // 마지막 불완전한 라인은 버퍼에 유지
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();

          // 빈 라인 무시
          if (!trimmedLine) continue;

          // data: 접두사 확인
          if (!trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6); // 'data: ' 제거

          // [DONE] 시그널
          if (data === '[DONE]') {
            onDone();
            return;
          }

          // JSON 파싱
          try {
            const parsed = JSON.parse(data);

            if (parsed.error) {
              onError(parsed.error);
              return;
            }

            if (parsed.content) {
              onChunk(parsed.content);
            }
          } catch (e) {
            // 파싱 실패 시 무시 (불완전한 JSON일 수 있음)
            console.warn('SSE parse error:', e, data);
          }
        }
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Stream error');
    }
  }, []);

  /**
   * 메시지 전송
   */
  const sendMessage = useCallback(async (content: string) => {
    // 이전 요청 취소
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setError(null);
    setStreamingState('connecting');
    setStreamingContent('');

    // 유저 메시지 추가
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/ai-verifier/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_id: challengeId,
          challenge_level: challengeLevel,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';

      // 프리스크립트 응답 (JSON)
      if (contentType.includes('application/json')) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          isPrescripted: data.is_prescripted,
        };
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingState('done');
        return;
      }

      // SSE 스트리밍 응답
      if (contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        let fullContent = '';
        setStreamingState('streaming');

        await parseSSEStream(
          reader,
          // onChunk
          (chunk) => {
            fullContent += chunk;
            setStreamingContent(fullContent);
          },
          // onDone
          () => {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: fullContent,
              isPrescripted: false,
            };
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingContent('');
            setStreamingState('done');
          },
          // onError
          (error) => {
            setError(error);
            setStreamingState('error');
          }
        );
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // 사용자가 취소한 경우
        setStreamingState('idle');
        return;
      }
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStreamingState('error');
    }
  }, [challengeId, challengeLevel, messages, parseSSEStream]);

  /**
   * 스트리밍 취소
   */
  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStreamingState('idle');
  }, []);

  /**
   * 대화 초기화
   */
  const reset = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setStreamingState('idle');
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    cancel,
    reset,
    streamingState,
    streamingContent,
    error,
    isLoading: streamingState === 'connecting' || streamingState === 'streaming',
  };
}

export default useAIChat;
