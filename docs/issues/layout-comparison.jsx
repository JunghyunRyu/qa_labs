import React, { useState } from 'react';

const LayoutComparison = () => {
  const [activeLayout, setActiveLayout] = useState(0);
  
  const layouts = [
    { id: 0, name: '현재 레이아웃', desc: '스크롤 필요' },
    { id: 1, name: '제안 1: 좌우 분할', desc: '가장 추천' },
    { id: 2, name: '제안 2: 3단 분할', desc: 'AI 포함' },
    { id: 3, name: '제안 3: 접이식', desc: '공간 최적화' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold text-center mb-2">QA-Arena UX 개선 제안</h1>
      <p className="text-gray-400 text-center mb-6">코드 작성 중심의 레이아웃 비교</p>
      
      {/* Layout Selector */}
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => setActiveLayout(layout.id)}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeLayout === layout.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="font-medium">{layout.name}</div>
            <div className="text-xs opacity-70">{layout.desc}</div>
          </button>
        ))}
      </div>

      {/* Current Layout */}
      {activeLayout === 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
              <span>❌</span> 현재 레이아웃의 문제점
            </h3>
            <div className="bg-gray-750 rounded-lg overflow-hidden border border-gray-600">
              {/* Header */}
              <div className="bg-gray-700 p-2 text-sm text-gray-400">qa-arena.qalabs.kr</div>
              
              <div className="flex">
                {/* Main Content - Vertical Stack */}
                <div className="flex-1 p-3">
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 mb-2">
                    <div className="text-xs text-blue-400 mb-1">📋 문제 설명</div>
                    <div className="h-20 flex items-center justify-center text-gray-500 text-sm">
                      문제 내용...
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center text-yellow-500 text-2xl my-2">
                    ↕️
                  </div>
                  <div className="text-yellow-500 text-xs text-center mb-2">
                    스크롤 필요!
                  </div>
                  
                  <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
                    <div className="text-xs text-green-400 mb-1">💻 코드 에디터</div>
                    <div className="h-20 flex items-center justify-center text-gray-500 text-sm">
                      코드 작성 영역
                    </div>
                  </div>
                </div>
                
                {/* AI Chat Sidebar */}
                <div className="w-32 bg-purple-900/30 border-l border-purple-500/50 p-2">
                  <div className="text-xs text-purple-400 mb-2">🤖 AI 코치</div>
                  <div className="text-xs text-gray-500">
                    항상 표시되어 공간 차지
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-red-400">• 문제를 보면서 코드를 작성할 수 없음</p>
              <p className="text-red-400">• AI 챗봇이 항상 공간을 차지</p>
              <p className="text-red-400">• 코드 에디터 영역이 좁음</p>
            </div>
          </div>
        </div>
      )}

      {/* Proposed Layout 1: Side by Side */}
      {activeLayout === 1 && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
              <span>✅</span> 제안 1: 좌우 분할 레이아웃 (가장 추천)
            </h3>
            <div className="bg-gray-750 rounded-lg overflow-hidden border border-gray-600">
              {/* Header */}
              <div className="bg-gray-700 p-2 text-sm flex justify-between items-center">
                <span className="text-gray-400">qa-arena.qalabs.kr</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded bg-purple-500" title="AI 버튼"></div>
                </div>
              </div>
              
              <div className="flex h-64">
                {/* Left: Problem */}
                <div className="w-2/5 bg-blue-900/20 border-r border-gray-600 p-3 overflow-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-blue-400 font-medium">📋 문제 설명</div>
                    <div className="text-xs bg-gray-700 px-2 py-0.5 rounded">리사이즈 가능</div>
                  </div>
                  <div className="text-xs text-gray-400 space-y-2">
                    <p>로그 분석 및 알람 판정 함수 테스트</p>
                    <div className="bg-gray-800 p-2 rounded text-xs font-mono">
                      def analyze_logs_and_check_alert(...)
                    </div>
                    <p>운영 환경에서 로그 모니터링은...</p>
                  </div>
                </div>
                
                {/* Right: Code Editor */}
                <div className="flex-1 bg-gray-900 p-3">
                  <div className="text-xs text-green-400 font-medium mb-2">💻 코드 에디터</div>
                  <div className="bg-black rounded p-2 h-44 font-mono text-xs text-gray-300">
                    <div><span className="text-purple-400">import</span> pytest</div>
                    <div><span className="text-purple-400">from</span> target <span className="text-purple-400">import</span> analyze_logs</div>
                    <div className="mt-2"><span className="text-blue-400">def</span> <span className="text-yellow-400">test_basic</span>():</div>
                    <div className="text-gray-500 ml-4"># 코드 작성...</div>
                  </div>
                </div>
              </div>
              
              {/* Floating AI Button */}
              <div className="absolute right-8 bottom-8">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  🤖
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-green-400 text-sm font-medium mb-2">장점</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>✓ 문제를 보면서 코드 작성 가능</li>
                  <li>✓ 드래그로 패널 비율 조절</li>
                  <li>✓ AI는 플로팅 버튼으로 필요시만 열기</li>
                  <li>✓ VSCode/LeetCode와 유사한 익숙한 UX</li>
                </ul>
              </div>
              <div>
                <p className="text-blue-400 text-sm font-medium mb-2">구현 포인트</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• 리사이저블 스플릿 패널</li>
                  <li>• 문제 패널 접기/펴기 버튼</li>
                  <li>• AI 챗봇은 플로팅 또는 드로어</li>
                  <li>• 사용자 설정 저장</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proposed Layout 2: Three Columns */}
      {activeLayout === 2 && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
              <span>✅</span> 제안 2: 3단 분할 (AI 상시 표시)
            </h3>
            <div className="bg-gray-750 rounded-lg overflow-hidden border border-gray-600">
              {/* Header */}
              <div className="bg-gray-700 p-2 text-sm text-gray-400">qa-arena.qalabs.kr</div>
              
              <div className="flex h-64">
                {/* Left: Problem (Collapsible) */}
                <div className="w-1/4 bg-blue-900/20 border-r border-gray-600 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-blue-400">📋 문제</div>
                    <button className="text-xs text-gray-500 hover:text-white">◀</button>
                  </div>
                  <div className="text-xs text-gray-500">
                    접을 수 있음
                  </div>
                </div>
                
                {/* Center: Code Editor (Main) */}
                <div className="flex-1 bg-gray-900 p-3 min-w-0">
                  <div className="text-xs text-green-400 font-medium mb-2">💻 코드 에디터 (메인)</div>
                  <div className="bg-black rounded p-2 h-44 font-mono text-xs">
                    <div className="text-gray-400">// 가장 넓은 영역</div>
                  </div>
                </div>
                
                {/* Right: AI Chat (Collapsible) */}
                <div className="w-1/4 bg-purple-900/20 border-l border-gray-600 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-purple-400">🤖 AI</div>
                    <button className="text-xs text-gray-500 hover:text-white">▶</button>
                  </div>
                  <div className="text-xs text-gray-500">
                    접을 수 있음
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-green-400">• 양쪽 패널 모두 접기 가능 → 코드에 집중 가능</p>
              <p className="text-green-400">• 넓은 모니터에서 효과적</p>
              <p className="text-yellow-400">• 좁은 화면에서는 제안 1이 더 적합</p>
            </div>
          </div>
        </div>
      )}

      {/* Proposed Layout 3: Collapsible/Tabs */}
      {activeLayout === 3 && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
              <span>✅</span> 제안 3: 접이식 + 탭 (공간 최적화)
            </h3>
            <div className="bg-gray-750 rounded-lg overflow-hidden border border-gray-600">
              {/* Header with Tabs */}
              <div className="bg-gray-700 p-2 flex items-center justify-between">
                <div className="flex gap-1">
                  <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded">문제</button>
                  <button className="px-3 py-1 bg-gray-600 text-gray-300 text-xs rounded">AI 힌트</button>
                </div>
                <span className="text-xs text-gray-400">탭으로 전환</span>
              </div>
              
              <div className="flex h-64">
                {/* Left: Collapsible Problem Summary */}
                <div className="w-16 bg-blue-900/30 border-r border-gray-600 p-2 flex flex-col items-center">
                  <div className="text-lg mb-2">📋</div>
                  <div className="text-xs text-gray-500 writing-mode-vertical" style={{writingMode: 'vertical-rl'}}>
                    문제 (클릭하여 펼치기)
                  </div>
                </div>
                
                {/* Main: Full Code Editor */}
                <div className="flex-1 bg-gray-900 p-3">
                  <div className="text-xs text-green-400 font-medium mb-2">💻 코드 에디터 (최대 영역)</div>
                  <div className="bg-black rounded p-2 h-48 font-mono text-xs">
                    <div className="text-gray-300">import pytest</div>
                    <div className="text-gray-300">from target import analyze_logs_and_check_alert</div>
                    <div className="mt-2 text-gray-300">def test_basic():</div>
                    <div className="text-gray-500 ml-4"># 전체 화면 코드 작성</div>
                    <div className="text-gray-500 ml-4"># 문제는 좌측 아이콘 클릭시 슬라이드</div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="relative">
                <div className="absolute right-4 -top-16 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg text-sm">
                  🤖
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              <p className="text-green-400">• 코드 에디터가 최대 공간 확보</p>
              <p className="text-green-400">• 문제는 호버/클릭시 슬라이드 오버레이로 표시</p>
              <p className="text-green-400">• 모바일/태블릿에서도 효과적</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="max-w-4xl mx-auto mt-8 bg-gray-800 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">💡 핵심 개선 포인트</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">1. 좌우 분할 필수</h4>
            <p className="text-sm text-gray-400">문제와 코드를 동시에 볼 수 있어야 함</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">2. 리사이저블 패널</h4>
            <p className="text-sm text-gray-400">사용자가 비율을 자유롭게 조절</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">3. AI 챗봇 온디맨드</h4>
            <p className="text-sm text-gray-400">플로팅 버튼이나 드로어로 필요시만 열기</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-green-400 font-medium mb-2">4. 코드 에디터 우선</h4>
            <p className="text-sm text-gray-400">핵심 기능에 최대 공간 할당</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
          <h4 className="text-blue-400 font-medium mb-2">🎯 추천 구현 순서</h4>
          <ol className="text-sm text-gray-300 space-y-1">
            <li>1. 좌우 분할 레이아웃 적용 (가장 큰 개선 효과)</li>
            <li>2. 드래그로 패널 크기 조절 기능</li>
            <li>3. AI 챗봇을 플로팅 버튼 + 드로어 방식으로 변경</li>
            <li>4. 문제 패널 접기/펼치기 토글</li>
            <li>5. 사용자 레이아웃 설정 저장</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default LayoutComparison;
