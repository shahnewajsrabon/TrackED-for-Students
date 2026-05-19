import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import { Flashcard, Deck } from '@/types';
import { SRSRating } from '@/lib/srs';

interface StudyModeDisplayProps {
  activeDeck: Deck;
  studyCards: Flashcard[];
  studyInd: number;
  showAnswer: boolean;
  setShowAnswer: (v: boolean) => void;
  setStudyMode: (v: boolean) => void;
  setStudyInd: (v: number) => void;
  onRate: (rating: SRSRating) => void;
}

export default function StudyModeDisplay({
  activeDeck,
  studyCards,
  studyInd,
  showAnswer,
  setShowAnswer,
  setStudyMode,
  setStudyInd,
  onRate
}: StudyModeDisplayProps) {
  if (studyCards.length === 0) return null;
  
  const currentCard = studyCards[studyInd];
  const progress = Math.round(((studyInd + 1) / studyCards.length) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto py-12 flex flex-col items-center w-full"
    >
      <div className="w-full mb-10 flex justify-between items-center bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
        <h2 className="text-xl font-bold text-brand-text-primary px-2">{activeDeck.title}</h2>
        <div className="flex items-center gap-4 w-1/2">
          <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/50">
            <motion.div 
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="font-black text-brand-text-secondary text-sm tabular-nums whitespace-nowrap">
            {studyInd + 1} / {studyCards.length}
          </div>
        </div>
      </div>
      
      <div className="w-full perspective-[1200px] aspect-[5/3] cursor-pointer group" onClick={() => setShowAnswer(!showAnswer)}>
        <motion.div
          className="w-full h-full relative"
          style={{ transformStyle: 'preserve-3d' }}
          initial={false}
          animate={{ rotateY: showAnswer ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 bg-brand-surface rounded-2xl border border-brand-border shadow-lg hover:shadow-xl flex flex-col items-center justify-center p-12 backface-hidden transition-all bg-gradient-to-br from-brand-surface to-brand-bg group-hover:-translate-y-1"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <h3 className="text-3xl md:text-5xl font-extrabold text-center text-brand-text-primary z-10 leading-tight">
              {currentCard.q}
            </h3>
            <span className="absolute bottom-8 font-black text-brand-text-secondary uppercase tracking-[0.2em] text-[10px] opacity-60">
              Question
            </span>
          </div>

          {/* Back */}
          <div 
            className="absolute inset-0 bg-primary rounded-2xl border border-primary/50 shadow-xl flex flex-col items-center justify-center p-12 backface-hidden text-white"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <h3 className="text-3xl md:text-5xl font-extrabold text-center z-10 leading-tight drop-shadow-md">
              {currentCard.a}
            </h3>
            <span className="absolute bottom-8 font-black uppercase tracking-[0.2em] text-[10px] text-white/60">
              Answer
            </span>
          </div>
        </motion.div>
      </div>

      <div className="mt-12 flex items-center justify-between w-full max-w-sm">
        <button 
          onClick={() => {
             setStudyMode(false);
             setShowAnswer(false);
             setStudyInd(0);
          }} 
          className="px-6 py-3.5 bg-brand-bg border border-brand-border rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
        >
          End Session
        </button>
        
        <AnimatePresence mode="wait">
          {showAnswer ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-2"
            >
              <button onClick={() => onRate('again')} className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200">Again</button>
              <button onClick={() => onRate('hard')} className="px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-bold hover:bg-orange-200">Hard</button>
              <button onClick={() => onRate('good')} className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-bold hover:bg-green-200">Good</button>
              <button onClick={() => onRate('easy')} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200">Easy</button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-brand-text-secondary font-medium italic text-sm"
            >
              Tap card to flip
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
