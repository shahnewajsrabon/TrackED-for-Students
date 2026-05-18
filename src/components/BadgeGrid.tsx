import React from 'react';
import { Badge } from '@/types';
import clsx from 'clsx';
import { Lock } from 'lucide-react';

interface Props {
  badges: string[]; // unlocked badge IDs
}

const ALL_BADGES: Badge[] = [
  { id: 'first_step', name: 'First Step', description: 'Complete first session', isUnlocked: false, icon: '🌱' },
  { id: 'on_fire', name: 'On Fire', description: '7-day streak', isUnlocked: false, icon: '🔥' },
  { id: 'unstoppable', name: 'Unstoppable', description: '30-day streak', isUnlocked: false, icon: '🌋' },
  { id: 'century', name: 'Century', description: '100 total hours', isUnlocked: false, icon: '💯' },
  { id: 'night_owl', name: 'Night Owl', description: '5 sessions after 10pm', isUnlocked: false, icon: '🦉' },
  { id: 'early_bird', name: 'Early Bird', description: '5 sessions before 7am', isUnlocked: false, icon: '🌅' },
  { id: 'focused', name: 'Focused', description: '10 sessions with 5/5 focus rating', isUnlocked: false, icon: '🎯' },
  { id: 'social', name: 'Social', description: 'Join 3 groups', isUnlocked: false, icon: '👋' },
  { id: 'team_player', name: 'Team Player', description: 'Complete 10 group focus rooms', isUnlocked: false, icon: '🤝' },
  { id: 'balanced', name: 'Balanced', description: 'Balance score > 80 for 4 weeks', isUnlocked: false, icon: '⚖️' },
];

export default function BadgeGrid({ badges }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {ALL_BADGES.map(b => {
        const unlocked = badges.includes(b.id);
        return (
          <div 
            key={b.id} 
            className={clsx(
              "flex flex-col items-center text-center p-4 rounded-2xl border transition-all",
              unlocked ? "border-primary bg-primary-light" : "border-brand-border bg-gray-50 opacity-60 grayscale"
            )}
          >
            <div className="text-4xl mb-2 relative">
              {b.icon}
              {!unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 rounded-full">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
            <span className="font-semibold text-sm mb-1">{b.name}</span>
            <span className="text-[10px] text-brand-text-secondary leading-tight">{b.description}</span>
          </div>
        );
      })}
    </div>
  );
}
