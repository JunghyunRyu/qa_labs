'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

interface BadgeEarnedProps {
  badge: Badge | null;
  onClose: () => void;
}

export default function BadgeEarned({ badge, onClose }: BadgeEarnedProps) {
  useEffect(() => {
    if (badge) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [badge, onClose]);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-xl shadow-2xl">
            <div className="flex items-center gap-4">
              <motion.span
                className="text-4xl"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {badge.icon}
              </motion.span>
              <div>
                <p className="text-sm opacity-80">New Badge Earned!</p>
                <p className="text-xl font-bold">{badge.name}</p>
                {badge.description && (
                  <p className="text-sm opacity-80">{badge.description}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
