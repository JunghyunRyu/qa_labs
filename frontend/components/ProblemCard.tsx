/** Problem card component */

import Link from "next/link";
import type { ProblemListItem } from "@/types/problem";

interface ProblemCardProps {
  problem: ProblemListItem;
}

const difficultyColors = {
  Easy: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  Hard: "bg-red-100 text-red-800",
};

export default function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link href={`/problems/${problem.id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900">
            {problem.title}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              difficultyColors[problem.difficulty]
            }`}
          >
            {problem.difficulty}
          </span>
        </div>
        
        {problem.skills && problem.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {problem.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

