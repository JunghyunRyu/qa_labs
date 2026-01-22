'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface RankUpModalProps {
  rank: {
    name: string;
    icon: string;
  } | null;
  onClose: () => void;
}

export default function RankUpModal({ rank, onClose }: RankUpModalProps) {
  useEffect(() => {
    if (rank) {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });

      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [rank, onClose]);

  return (
    <AnimatePresence>
      {rank && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-8 rounded-2xl shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-6xl mb-4"
            >
              {rank.icon}
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Rank Up!</h2>
            <p className="text-xl opacity-90">You are now a</p>
            <p className="text-3xl font-bold text-yellow-300 mt-2">
              {rank.name}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
