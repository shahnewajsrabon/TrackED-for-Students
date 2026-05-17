import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  xp: number;
  currentLevelMin: number;
  nextLevelMin: number;
  size?: number;
  strokeWidth?: number;
}

export default function XPProgressRing({ xp, currentLevelMin, nextLevelMin, size = 120, strokeWidth = 8 }: Props) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const total = nextLevelMin === Infinity ? 1 : nextLevelMin - currentLevelMin;
    const current = Math.max(0, xp - currentLevelMin);
    const p = Math.min(100, (current / total) * 100);
    // Timeout for animation to trigger after mount
    const timer = setTimeout(() => setProgress(p), 100);
    return () => clearTimeout(timer);
  }, [xp, currentLevelMin, nextLevelMin]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center font-bold" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90 origin-center">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8E6E0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#534AB7"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      {/* Label inside */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
         <span className="text-xl text-brand-text-primary">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}
