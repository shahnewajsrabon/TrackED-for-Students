import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onSave: (rating: number, mood: string, note: string) => void;
}

const MOODS = [
  { emoji: '😊', label: 'Energised' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😵', label: 'Distracted' },
];

export default function FocusRatingModal({ isOpen, onSave }: Props) {
  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState(MOODS[1].label);
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rating || 3, mood, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-brand-surface rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Session Complete!</h2>
        <p className="text-brand-text-secondary text-center mb-8 text-sm">How was your focus?</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                className="focus:outline-none transition-transform hover:scale-110 p-1"
              >
                <Star 
                  className={`w-10 h-10 ${i <= rating ? 'fill-warning text-warning' : 'text-gray-300'}`} 
                />
              </button>
            ))}
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-medium mb-3 text-center">How do you feel?</label>
            <div className="flex justify-between gap-2">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setMood(m.label)}
                  className={`flex flex-col items-center p-3 rounded-xl border flex-1 transition-colors ${mood === m.label ? 'bg-primary-light border-primary' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-gray-50 border border-brand-border rounded-xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-primary focus:outline-none resize-none"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all"
          >
            Save & Continue
          </button>
        </form>
      </motion.div>
    </div>
  );
}
