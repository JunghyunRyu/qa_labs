/** Structured Problem Description Component */

import ReactMarkdown from "react-markdown";
import {
  FileText,
  Code2,
  Lightbulb,
  CheckCircle,
  XCircle,
  Target,
  Info
} from "lucide-react";
import CopyButton from "./CopyButton";

interface ProblemDescriptionProps {
  description_md: string;
}

interface ParsedSection {
  type: 'overview' | 'function' | 'examples' | 'exceptions' | 'hints' | 'task' | 'other';
  title: string;
  content: string;
}

export default function ProblemDescription({ description_md }: ProblemDescriptionProps) {
  // 마크다운을 파싱하여 구조화된 섹션으로 분리
  const parseDescription = (md: string): ParsedSection[] => {
    const sections: ParsedSection[] = [];
    const lines = md.split('\n');
    
    let currentSection: ParsedSection | null = null;
    let currentContent: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 헤더 감지 (## 또는 ###)
      if (line.startsWith('##') && !line.startsWith('###')) {
        // 이전 섹션 저장
        if (currentSection) {
          currentSection.content = currentContent.join('\n').trim();
          sections.push(currentSection);
        }
        
        const title = line.replace(/^#+\s*/, '').trim();
        currentContent = [];
        
        // 섹션 타입 결정
        let type: ParsedSection['type'] = 'other';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('문제 설명') || titleLower.includes('개요')) {
          type = 'overview';
        } else if (titleLower.includes('함수') || titleLower.includes('시그니처')) {
          type = 'function';
        } else if (titleLower.includes('예시') || titleLower.includes('동작 예시') || titleLower.includes('정상')) {
          type = 'examples';
        } else if (titleLower.includes('예외') || titleLower.includes('에러') || titleLower.includes('오류')) {
          type = 'exceptions';
        } else if (titleLower.includes('힌트') || titleLower.includes('고려') || titleLower.includes('아이디어')) {
          type = 'hints';
        } else if (titleLower.includes('과제') || titleLower.includes('해야') || titleLower.includes('수험자')) {
          type = 'task';
        }
        
        currentSection = {
          type,
          title,
          content: '',
        };
      } else {
        // 모든 내용을 현재 섹션에 추가
        currentContent.push(line);
      }
    }
    
    // 마지막 섹션 저장
    if (currentSection) {
      currentSection.content = currentContent.join('\n').trim();
      sections.push(currentSection);
    }
    
    // 첫 번째 섹션이 없으면 전체를 overview로
    if (sections.length === 0) {
      sections.push({
        type: 'overview',
        title: '문제 설명',
        content: md,
      });
    }
    
    return sections;
  };
  
  const sections = parseDescription(description_md);
  
  // 섹션별 아이콘과 스타일
  const getSectionConfig = (type: ParsedSection['type']) => {
    switch (type) {
      case 'overview':
        return {
          icon: Info,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
        };
      case 'function':
        return {
          icon: Code2,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-600',
        };
      case 'examples':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
        };
      case 'exceptions':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
        };
      case 'hints':
        return {
          icon: Lightbulb,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
        };
      case 'task':
        return {
          icon: Target,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          iconColor: 'text-indigo-600',
        };
      default:
        return {
          icon: FileText,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
        };
    }
  };
  
  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const config = getSectionConfig(section.type);
        const Icon = config.icon;
        
        return (
          <div
            key={index}
            className={`${config.bgColor} ${config.borderColor} border rounded-lg p-5 transition-shadow hover:shadow-md`}
          >
            {/* 섹션 헤더 */}
            {section.title && !section.title.includes('문제 설명') && (
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
                <h3 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h3>
              </div>
            )}
            
            {/* 섹션 내용 */}
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown
                components={{
                  h2: () => null, // h2는 이미 섹션 제목으로 표시
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-4 mb-2 text-gray-800">
                      {children}
                    </h3>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 my-3 ml-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 my-3 ml-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-gray-700 leading-relaxed mb-1">{children}</li>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 leading-relaxed text-gray-700">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-gray-900">{children}</strong>
                  ),
                  code: ({ children, className, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    if (className) {
                      // 코드 블록
                      const codeText = String(children).replace(/\n$/, '');
                      return (
                        <div className="my-4 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 group">
                          <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
                            <span className="text-xs text-gray-400 font-mono uppercase">
                              {language || 'code'}
                            </span>
                            <CopyButton
                              text={codeText}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <div className="p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono leading-relaxed">
                              <code {...props} className={className}>
                                {children}
                              </code>
                            </pre>
                          </div>
                        </div>
                      );
                    }
                    // 인라인 코드
                    return (
                      <code className="px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 my-3 italic text-gray-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {section.content}
              </ReactMarkdown>
            </div>
            
          </div>
        );
      })}
    </div>
  );
}

