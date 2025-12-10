/** Problem card component */

import Link from "next/link";
import type { ProblemListItem } from "@/types/problem";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ProblemCardProps {
  problem: ProblemListItem;
}

const difficultyConfig = {
  "Very Easy": {
    colors: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "아주쉬움",
    gradient: "from-blue-50 to-cyan-50",
  },
  Easy: {
    colors: "bg-green-100 text-green-800 border-green-300",
    icon: <TrendingDown className="w-3 h-3" />,
    label: "쉬움",
    gradient: "from-green-50 to-emerald-50",
  },
  Medium: {
    colors: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Minus className="w-3 h-3" />,
    label: "보통",
    gradient: "from-yellow-50 to-amber-50",
  },
  Hard: {
    colors: "bg-red-100 text-red-800 border-red-300",
    icon: <TrendingUp className="w-3 h-3" />,
    label: "어려움",
    gradient: "from-red-50 to-rose-50",
  },
};

export default function ProblemCard({ problem }: ProblemCardProps) {
  // 제목이 없을 때 fallback 처리
  const displayTitle = problem.title || `문제 #${problem.id}`;

  // description_md에서 첫 문장 추출 (마크다운 제거)
  const extractPreview = (description_md?: string): string => {
    if (!description_md) return "";
    
    // 마크다운 헤더 제거
    let text = description_md.replace(/^#+\s+/gm, "");
    // 마크다운 강조 제거
    text = text.replace(/\*\*/g, "").replace(/\*/g, "");
    // 코드 블록 제거
    text = text.replace(/```[\s\S]*?```/g, "");
    // 인라인 코드 제거
    text = text.replace(/`[^`]+`/g, "");
    // 링크 제거
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // 줄바꿈을 공백으로
    text = text.replace(/\n+/g, " ").trim();
    
    // 첫 문장 추출 (마침표, 느낌표, 물음표 기준)
    const sentences = text.match(/[^.!?]+[.!?]+/g);
    if (sentences && sentences.length > 0) {
      return sentences[0].trim();
    }
    
    // 문장이 없으면 첫 150자
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  const preview = extractPreview(problem.description_md);

  const difficulty = difficultyConfig[problem.difficulty];

  return (
    <Link 
      href={`/problems/${problem.id}`}
      className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      aria-label={`${displayTitle} 문제 보기`}
      tabIndex={0}
    >
      <div className={`bg-gradient-to-br ${difficulty.gradient} rounded-lg shadow-md p-4 sm:p-5 md:p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer h-full flex flex-col border-2 ${difficulty.colors.split(' ')[2]} min-h-[200px] sm:min-h-[220px] md:min-h-[240px]`}>
        {/* 제목과 난이도 배지 */}
        <div className="flex items-start justify-between mb-3 gap-2">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 flex-1 pr-2 line-clamp-2 leading-snug">
            {displayTitle}
          </h3>
          <span
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border-2 shrink-0 whitespace-nowrap flex items-center gap-1.5 ${difficulty.colors} shadow-sm`}
            aria-label={`난이도: ${difficulty.label}`}
          >
            {difficulty.icon}
            <span>{difficulty.label}</span>
          </span>
        </div>
        
        {/* 문제 설명 미리보기 */}
        {preview && (
          <div className="mb-3 sm:mb-4 flex-1 min-h-[50px] sm:min-h-[60px]">
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {preview}
            </p>
          </div>
        )}
        
        {/* 태그 */}
        {problem.skills && problem.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-auto pt-2 sm:pt-3 border-t border-gray-100" role="list" aria-label="문제 태그">
            {problem.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="px-1.5 sm:px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md text-xs border border-gray-200 whitespace-nowrap"
                role="listitem"
              >
                {skill}
              </span>
            ))}
            {problem.skills.length > 4 && (
              <span className="px-1.5 sm:px-2 py-0.5 text-gray-500 text-xs" aria-label={`추가 태그 ${problem.skills.length - 4}개`}>
                +{problem.skills.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

