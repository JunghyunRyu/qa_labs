'use client';

import { ReactNode, useState } from 'react';

type PanelType = 'chat' | 'editor';

interface AIVerifierLayoutProps {
  chatPanel: ReactNode;
  editorPanel: ReactNode;
  testInput: ReactNode;
  header?: ReactNode;
}

/**
 * AI Verifier Track 2-Panel Layout
 *
 * Desktop: Side-by-side (Chat | Editor + Test)
 * Mobile: Tab-based switching with persistent test input
 */
export default function AIVerifierLayout({
  chatPanel,
  editorPanel,
  testInput,
  header,
}: AIVerifierLayoutProps) {
  const [activePanel, setActivePanel] = useState<PanelType>('chat');

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      {header && (
        <header className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
          {header}
        </header>
      )}

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-b border-gray-700 bg-gray-800">
        <button
          onClick={() => setActivePanel('chat')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activePanel === 'chat'
              ? 'bg-gray-900 text-white border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActivePanel('editor')}
          className={`flex-1 py-3 text-center font-medium transition-colors ${
            activePanel === 'editor'
              ? 'bg-gray-900 text-white border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          📝 Code
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout: Side by Side */}
        <div className="hidden md:flex flex-1">
          {/* Chat Panel */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            {chatPanel}
          </div>

          {/* Editor Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="flex-1 overflow-hidden">
              {editorPanel}
            </div>
            {testInput}
          </div>
        </div>

        {/* Mobile Layout: Tab-based */}
        <div className="md:hidden flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {activePanel === 'chat' ? chatPanel : editorPanel}
          </div>
          {testInput}
        </div>
      </div>
    </div>
  );
}
