import React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Maximize, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { TimerState, Subject } from '@/types';

interface TimerDisplayProps {
  config: TimerState;
  timeLeft: number;
  isActive: boolean;
  mode: 'Focus' | 'Break';
  sessionCount: number;
  subjects: Subject[];
  isFullScreen: boolean;
  toggleFullScreen: () => void;
  togglePiP: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  forceStopStopwatch: () => void;
  formatTime: (seconds: number) => string;
  applyPreset: (work: number, short: number, long: number) => void;
  strokeDashoffset: number;
  circumfer: number;
}

export default function TimerDisplay({
  config,
  timeLeft,
  isActive,
  mode,
  sessionCount,
  subjects,
  isFullScreen,
  toggleFullScreen,
  togglePiP,
  toggleTimer,
  resetTimer,
  forceStopStopwatch,
  formatTime,
  applyPreset,
  strokeDashoffset,
  circumfer
}: TimerDisplayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', bounce: 0.5 }}
      className="bg-brand-surface/80 backdrop-blur-3xl p-8 md:p-14 rounded-3xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-shadow border border-brand-border flex flex-col items-center w-full max-w-xl relative group z-10"
    >
      <button 
        onClick={togglePiP}
        className="absolute top-6 right-16 p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors opacity-0 group-hover:opacity-100 bg-brand-bg rounded-2xl border border-brand-border"
        title="Picture-in-Picture"
      >
        <ExternalLink className="w-5 h-5" />
      </button>
      <button 
        onClick={toggleFullScreen}
        className="absolute top-6 right-6 p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors opacity-0 group-hover:opacity-100 bg-brand-bg rounded-2xl border border-brand-border"
        title="Full Screen"
      >
        <Maximize className="w-5 h-5" />
      </button>

      <div className={clsx("px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 transition-colors border", 
        mode === 'Focus' ? "bg-primary/10 text-primary border-primary/20" : "bg-success/10 text-success border-success/20"
      )}>
        {mode === 'Focus' ? (config.timerType === 'Stopwatch' ? 'Stopwatch Mode' : 'Focus Session') : 'Break Time'}
      </div>

      <div className="relative flex items-center justify-center mb-10">
         <svg width="340" height="340" className="transform -rotate-90 drop-shadow-sm">
           <circle cx="170" cy="170" r={150} stroke="rgba(150, 150, 150, 0.1)" strokeWidth="12" fill="none" />
           <motion.circle 
             cx="170" cy="170" r={150} 
             stroke={mode === 'Focus' ? "#534AB7" : "#1D9E75"} 
             strokeWidth="12" fill="none" strokeLinecap="round"
             animate={{ strokeDashoffset }}
             transition={{ duration: 1, ease: 'linear' }}
             style={{ strokeDasharray: circumfer }}
           />
         </svg>
         <div className="absolute flex flex-col items-center justify-center">
           <div className={clsx("font-black font-mono tracking-tighter text-brand-text-primary leading-none drop-shadow-md", timeLeft >= 3600 ? "text-[4.5rem]" : "text-[5rem]")}>
             {formatTime(timeLeft)}
           </div>
           <div className="mt-4 text-brand-text-secondary font-bold uppercase tracking-widest text-sm px-4 py-1.5 bg-brand-bg rounded-lg border border-brand-border">
             {subjects.find(s => s.id === config.subjectId)?.name || 'No subject'}
           </div>
         </div>
      </div>

      <div className="flex items-center gap-6">
        {isActive ? (
           <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTimer} className="w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-text-primary rounded-full transition-colors shadow-inner">
             <Pause className="w-8 h-8 fill-current" />
           </motion.button>
        ) : (
           <motion.button 
             whileTap={{ scale: 0.9 }}
             onClick={toggleTimer} 
             disabled={mode === 'Focus' && !config.subjectId && subjects.length > 0}
             className="w-24 h-24 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full transition-transform shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
             <Play className="w-10 h-10 fill-current ml-2" />
           </motion.button>
        )}
        
        <motion.button whileTap={{ scale: 0.9 }} onClick={resetTimer} className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-text-primary rounded-full transition-colors border border-brand-border shadow-sm">
          <Square className="w-6 h-6 fill-current" />
        </motion.button>

        {config.timerType === 'Stopwatch' && mode === 'Focus' && (isActive || timeLeft > 0) && (
           <motion.button 
             whileTap={{ scale: 0.9 }} 
             onClick={forceStopStopwatch} 
             className="w-20 h-12 px-4 flex items-center justify-center bg-danger hover:bg-danger/90 text-white rounded-2xl transition-colors shadow-sm font-bold uppercase tracking-wider text-xs ml-2"
           >
             Finish
           </motion.button>
        )}
      </div>
      
      {/* Quick Presets */}
      {!isActive && mode === 'Focus' && config.timerType !== 'Stopwatch' && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => applyPreset(25, 5, 15)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Pomodoro 25/5</button>
          <button onClick={() => applyPreset(50, 10, 20)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Long 50/10</button>
          <button onClick={() => applyPreset(90, 15, 30)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Deep Work 90m</button>
        </div>
      )}
    </motion.div>
  );
}
