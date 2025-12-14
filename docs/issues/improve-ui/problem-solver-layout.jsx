import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * QA-Arena 문제 풀이 페이지 - 개선된 레이아웃
 * 
 * 핵심 기능:
 * 1. 좌우 리사이저블 스플릿 패널 (문제 | 코드 에디터)
 * 2. 플로팅 AI 챗봇 (드로어 방식)
 * 3. 문제 패널 접기/펴기
 * 4. 레이아웃 설정 로컬 저장
 */

// ============================================
// 1. 리사이저블 스플릿 패널 컴포넌트
// ============================================
const ResizableSplitPanel = ({ 
  leftPanel, 
  rightPanel, 
  defaultLeftWidth = 35,  // 기본 왼쪽 패널 너비 %
  minLeftWidth = 20,      // 최소 너비 %
  maxLeftWidth = 60,      // 최대 너비 %
  storageKey = 'qa-arena-panel-width'
}) => {
  const [leftWidth, setLeftWidth] = useState(() => {
    // 저장된 설정 불러오기
    const saved = localStorage.getItem(storageKey);
    return saved ? parseFloat(saved) : defaultLeftWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  // 리사이즈 핸들러
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // 최소/최대 범위 제한
    const clampedWidth = Math.min(Math.max(newWidth, minLeftWidth), maxLeftWidth);
    setLeftWidth(clampedWidth);
  }, [isResizing, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      // 설정 저장
      localStorage.setItem(storageKey, leftWidth.toString());
    }
  }, [isResizing, leftWidth, storageKey]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full"
      style={{ cursor: isResizing ? 'col-resize' : 'default' }}
    >
      {/* 왼쪽 패널 (문제) */}
      <div 
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>
      
      {/* 리사이즈 핸들 */}
      <div
        className={`w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors flex-shrink-0
          ${isResizing ? 'bg-blue-500' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-500 rounded" />
        </div>
      </div>
      
      {/* 오른쪽 패널 (코드 에디터) */}
      <div 
        className="h-full overflow-hidden flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  );
};


// ============================================
// 2. 문제 패널 컴포넌트 (접기 기능 포함)
// ============================================
const ProblemPanel = ({ problem, isCollapsed, onToggleCollapse }) => {
  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-800 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
          title="문제 펼치기"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div 
          className="mt-4 text-gray-500 text-xs"
          style={{ writingMode: 'vertical-rl' }}
        >
          문제 설명
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-blue-400">📋</span>
          <h2 className="font-medium text-white">문제 설명</h2>
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors"
          title="문제 접기"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      {/* 문제 내용 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* 문제 제목 & 메타 */}
          <div>
            <h1 className="text-lg font-bold text-white mb-2">{problem.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">
                {problem.difficulty}
              </span>
              {problem.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-blue-900/50 text-blue-300 text-xs rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* 함수 시그니처 */}
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-2">함수 시그니처</div>
            <pre className="text-sm text-green-400 font-mono overflow-x-auto">
              {problem.signature}
            </pre>
          </div>
          
          {/* 설명 */}
          <div className="text-gray-300 text-sm leading-relaxed">
            {problem.description}
          </div>
          
          {/* 예시 */}
          {problem.examples && (
            <div className="space-y-3">
              <h3 className="text-white font-medium">예시</h3>
              {problem.examples.map((ex, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-3 text-sm">
                  <div className="text-gray-400">Input:</div>
                  <pre className="text-blue-300 font-mono ml-2">{ex.input}</pre>
                  <div className="text-gray-400 mt-2">Output:</div>
                  <pre className="text-green-300 font-mono ml-2">{ex.output}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ============================================
// 3. 코드 에디터 패널 컴포넌트
// ============================================
const CodeEditorPanel = ({ initialCode, onCodeChange }) => {
  const [code, setCode] = useState(initialCode);

  const handleChange = (e) => {
    setCode(e.target.value);
    onCodeChange?.(e.target.value);
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-green-400">💻</span>
          <h2 className="font-medium text-white">테스트 코드 작성</h2>
        </div>
        <div className="flex gap-2">
          <select className="bg-gray-700 text-gray-300 text-sm px-2 py-1 rounded border-none">
            <option>Python</option>
          </select>
        </div>
      </div>
      
      {/* 에디터 영역 */}
      <div className="flex-1 overflow-hidden">
        <textarea
          value={code}
          onChange={handleChange}
          className="w-full h-full bg-black text-gray-300 font-mono text-sm p-4 resize-none focus:outline-none"
          spellCheck={false}
          placeholder="테스트 코드를 작성하세요..."
        />
      </div>
      
      {/* 하단 액션 바 */}
      <div className="p-3 border-t border-gray-700 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Ctrl+Enter로 실행
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
          채점하기
        </button>
      </div>
    </div>
  );
};


// ============================================
// 4. 플로팅 AI 챗봇 컴포넌트
// ============================================
const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '안녕하세요! 테스트 케이스 작성, 경계값 분석, 버그 찾기 등에 대해 힌트를 드릴게요.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    // 실제로는 여기서 AI API 호출
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '좋은 질문이에요! 경계값 테스트를 위해서는...' 
      }]);
    }, 500);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 
          rounded-full shadow-lg flex items-center justify-center transition-all z-40
          ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <span className="text-2xl">🤖</span>
      </button>

      {/* 드로어 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* AI 챗봇 드로어 */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-gray-800 shadow-2xl z-50 
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="font-medium text-white">AI 코치</h2>
            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded">ON</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-200'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* 입력 영역 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="AI 코치에게 질문하세요..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};


// ============================================
// 5. 메인 레이아웃 컴포넌트
// ============================================
const ProblemSolverLayout = () => {
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false);

  // 샘플 문제 데이터
  const problem = {
    id: 33,
    title: '로그 분석 및 알람 판정 함수 테스트',
    difficulty: '보통',
    tags: ['단위 테스트', '경계값', '로그 분석', '모니터링'],
    signature: `def analyze_logs_and_check_alert(
    logs: list[str],
    alert_rules: dict,
    time_window_seconds: int = 60
) -> dict:`,
    description: `운영 환경에서 로그 모니터링은 시스템 건강 상태를 파악하고 문제를 조기에 감지하는 핵심 활동입니다. 
    
이 문제에서는 로그를 분석하고 정의된 알람 규칙에 따라 알람을 트리거해야 하는지 판정하는 analyze_logs_and_check_alert 함수를 테스트합니다.`,
    examples: [
      {
        input: `logs = ["2024-01-01 10:00:00 ERROR DB connection failed"]
alert_rules = {"ERROR": 1}`,
        output: `{"should_alert": True, "triggered_rules": ["ERROR"]}`
      }
    ]
  };

  const initialCode = `import pytest
from target import analyze_logs_and_check_alert


def test_basic():
    """기본 테스트 케이스"""
    # 정상 입력에 대한 테스트
    # result = analyze_logs_and_check_alert(...)  # TODO: 인자 입력
    # assert result == ...  # TODO: 예상 결과
    pass


def test_edge_case():
    """경계값/예외 테스트"""
    # 경계값 테스트 예시
    # assert analyze_logs_and_check_alert([]) == 0
    
    # 예외 테스트 예시
    # with pytest.raises(ValueError):
    #     analyze_logs_and_check_alert(None)
    pass
`;

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-bold">QA-Arena</h1>
          <span className="text-gray-500">|</span>
          <span className="text-gray-400 text-sm">문제 #{problem.id}</span>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {isProblemCollapsed ? (
          // 문제 접힌 상태
          <div className="flex h-full">
            <ProblemPanel 
              problem={problem}
              isCollapsed={true}
              onToggleCollapse={() => setIsProblemCollapsed(false)}
            />
            <div className="flex-1">
              <CodeEditorPanel 
                initialCode={initialCode}
                onCodeChange={(code) => console.log('Code changed:', code)}
              />
            </div>
          </div>
        ) : (
          // 리사이저블 스플릿 레이아웃
          <ResizableSplitPanel
            leftPanel={
              <ProblemPanel 
                problem={problem}
                isCollapsed={false}
                onToggleCollapse={() => setIsProblemCollapsed(true)}
              />
            }
            rightPanel={
              <CodeEditorPanel 
                initialCode={initialCode}
                onCodeChange={(code) => console.log('Code changed:', code)}
              />
            }
            defaultLeftWidth={40}
            minLeftWidth={25}
            maxLeftWidth={55}
          />
        )}
      </main>

      {/* 플로팅 AI 챗봇 */}
      <FloatingAIChat />
    </div>
  );
};

export default ProblemSolverLayout;
