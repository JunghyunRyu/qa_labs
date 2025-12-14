/**
 * QA-Arena 구현 팁 & 라이브러리 사용 예시
 * 
 * 이 파일은 실제 프로젝트에 바로 적용할 수 있는 코드 스니펫을 제공합니다.
 */

// =============================================
// 💡 팁 1: react-resizable-panels 사용하기 (추천)
// =============================================

// 설치: npm install react-resizable-panels

import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function SplitLayoutWithLibrary() {
  return (
    <PanelGroup direction="horizontal" autoSaveId="qa-arena-layout">
      {/* 문제 패널 */}
      <Panel 
        defaultSize={35} 
        minSize={20} 
        maxSize={60}
        collapsible={true}
        collapsedSize={5}
      >
        <ProblemPanel />
      </Panel>
      
      {/* 리사이즈 핸들 */}
      <PanelResizeHandle className="w-1 bg-gray-700 hover:bg-blue-500 transition-colors" />
      
      {/* 코드 에디터 패널 */}
      <Panel minSize={30}>
        <CodeEditorPanel />
      </Panel>
    </PanelGroup>
  );
}


// =============================================
// 💡 팁 2: Monaco Editor 설정
// =============================================

// 설치: npm install @monaco-editor/react

import Editor from '@monaco-editor/react';

function MonacoCodeEditor({ value, onChange }) {
  return (
    <Editor
      height="100%"
      language="python"
      theme="vs-dark"
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,  // 리사이즈 시 자동 조정
        tabSize: 4,
        wordWrap: 'on',
        padding: { top: 16 },
      }}
    />
  );
}


// =============================================
// 💡 팁 3: CodeMirror 6 사용하기 (경량 대안)
// =============================================

// 설치: npm install @uiw/react-codemirror @codemirror/lang-python

import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

function CodeMirrorEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={vscodeDark}
      extensions={[python()]}
      onChange={(value) => onChange(value)}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        foldGutter: true,
      }}
    />
  );
}


// =============================================
// 💡 팁 4: 드로어 애니메이션 (Framer Motion)
// =============================================

// 설치: npm install framer-motion

import { motion, AnimatePresence } from 'framer-motion';

function AnimatedDrawer({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />
          
          {/* 드로어 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-96 bg-gray-800 z-50 shadow-2xl"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


// =============================================
// 💡 팁 5: 키보드 단축키 훅
// =============================================

import { useEffect, useCallback } from 'react';

function useKeyboardShortcuts({ 
  onToggleProblem,  // Ctrl+B
  onToggleAI,       // Ctrl+/
  onSubmit,         // Ctrl+Enter
}) {
  const handleKeyDown = useCallback((e) => {
    // Ctrl+B: 문제 패널 토글
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      onToggleProblem?.();
    }
    
    // Ctrl+/: AI 챗봇 토글
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault();
      onToggleAI?.();
    }
    
    // Ctrl+Enter: 제출
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  }, [onToggleProblem, onToggleAI, onSubmit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// 사용 예시
function App() {
  const [isProblemOpen, setIsProblemOpen] = useState(true);
  const [isAIOpen, setIsAIOpen] = useState(false);
  
  useKeyboardShortcuts({
    onToggleProblem: () => setIsProblemOpen(prev => !prev),
    onToggleAI: () => setIsAIOpen(prev => !prev),
    onSubmit: () => handleSubmit(),
  });
  
  // ...
}


// =============================================
// 💡 팁 6: 설정 저장 훅 (with Zustand)
// =============================================

// 설치: npm install zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLayoutStore = create(
  persist(
    (set) => ({
      panelWidth: 35,
      isProblemCollapsed: false,
      isAIChatOpen: false,
      editorFontSize: 14,
      
      setPanelWidth: (width) => set({ panelWidth: width }),
      toggleProblem: () => set((state) => ({ 
        isProblemCollapsed: !state.isProblemCollapsed 
      })),
      toggleAIChat: () => set((state) => ({ 
        isAIChatOpen: !state.isAIChatOpen 
      })),
      setEditorFontSize: (size) => set({ editorFontSize: size }),
    }),
    {
      name: 'qa-arena-layout-settings',
    }
  )
);

// 사용 예시
function Component() {
  const { panelWidth, setPanelWidth, toggleProblem } = useLayoutStore();
  // ...
}


// =============================================
// 💡 팁 7: 반응형 레이아웃 훅
// =============================================

import { useState, useEffect } from 'react';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// 사용 예시
function ResponsiveLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  if (isMobile) {
    return <MobileTabLayout />;
  }
  
  return <DesktopSplitLayout defaultWidth={isTablet ? 30 : 35} />;
}


// =============================================
// 💡 팁 8: 모바일용 탭 레이아웃
// =============================================

function MobileTabLayout() {
  const [activeTab, setActiveTab] = useState('code'); // 'problem' | 'code' | 'ai'
  
  return (
    <div className="h-screen flex flex-col">
      {/* 탭 헤더 */}
      <div className="flex border-b border-gray-700 bg-gray-800">
        {['problem', 'code', 'ai'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors
              ${activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400'
              }`}
          >
            {tab === 'problem' && '📋 문제'}
            {tab === 'code' && '💻 코드'}
            {tab === 'ai' && '🤖 AI'}
          </button>
        ))}
      </div>
      
      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'problem' && <ProblemPanel />}
        {activeTab === 'code' && <CodeEditorPanel />}
        {activeTab === 'ai' && <AIChatPanel />}
      </div>
    </div>
  );
}


// =============================================
// 💡 팁 9: 접근성 고려사항
// =============================================

// 리사이즈 핸들에 키보드 지원 추가
function AccessibleResizeHandle({ onResize }) {
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onResize(-5); // 5% 감소
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onResize(5);  // 5% 증가
    }
  };
  
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="패널 크기 조절"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-1 bg-gray-700 hover:bg-blue-500 focus:bg-blue-500 
        focus:outline-none cursor-col-resize"
    />
  );
}


// =============================================
// 💡 팁 10: 성능 최적화
// =============================================

import { memo, useMemo } from 'react';

// 1. 메모이제이션으로 불필요한 리렌더링 방지
const ProblemPanel = memo(function ProblemPanel({ problem }) {
  return (
    <div>
      {/* ... */}
    </div>
  );
});

// 2. 에디터는 리사이즈 중 디바운스
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// 3. 코드 에디터 lazy loading
const LazyMonacoEditor = React.lazy(() => import('@monaco-editor/react'));

function CodeEditorWithSuspense(props) {
  return (
    <Suspense fallback={<div className="p-4 text-gray-500">에디터 로딩 중...</div>}>
      <LazyMonacoEditor {...props} />
    </Suspense>
  );
}


// =============================================
// 📦 패키지 설치 명령어 모음
// =============================================

/*
# 필수
npm install react-resizable-panels

# 에디터 (택 1)
npm install @monaco-editor/react
# 또는
npm install @uiw/react-codemirror @codemirror/lang-python @uiw/codemirror-theme-vscode

# 선택 (UX 향상)
npm install framer-motion   # 애니메이션
npm install zustand         # 상태관리
npm install lucide-react    # 아이콘
*/

export {
  SplitLayoutWithLibrary,
  MonacoCodeEditor,
  CodeMirrorEditor,
  AnimatedDrawer,
  useKeyboardShortcuts,
  useLayoutStore,
  useMediaQuery,
  MobileTabLayout,
};
