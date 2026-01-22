'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ScoreDisplayProps {
  score: number;
  pointsEarned?: number;
  rank: {
    name: string;
    icon: string;
  };
  compact?: boolean;
}

export default function ScoreDisplay({
  score,
  pointsEarned,
  rank,
  compact = false,
}: ScoreDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span>{rank.icon}</span>
        <span className="text-gray-400">{rank.name}</span>
        <span className="text-white font-bold">{score}</span>
        <AnimatePresence>
          {pointsEarned && pointsEarned > 0 && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-green-400"
            >
              +{pointsEarned}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-gray-800 rounded-lg px-4 py-2">
      <span className="text-2xl">{rank.icon}</span>
      <div>
        <p className="text-sm text-gray-400">{rank.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">{score}</span>
          <AnimatePresence>
            {pointsEarned && pointsEarned > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-green-400 text-sm font-medium"
              >
                +{pointsEarned}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
