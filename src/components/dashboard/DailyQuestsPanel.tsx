import React, { useState } from 'react';
import { Target, CheckCircle, Gem, Clock } from 'lucide-react';
import { User } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface DailyQuestsPanelProps {
  user: any;
  userData: User;
  todaySessionsCount: number;
  todayHours: number;
  setUserData: (data: User) => void;
}

export default function DailyQuestsPanel({ user, userData, todaySessionsCount, todayHours, setUserData }: DailyQuestsPanelProps) {
  const [claiming, setClaiming] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const quests = [
    { 
      id: 'daily_session_1', 
      title: 'Get Started', 
      description: 'Log at least 1 focus session today', 
      progress: todaySessionsCount, 
      goal: 1, 
      xp_reward: 50, 
      coin_reward: 10, 
    },
    { 
      id: 'daily_hours_2', 
      title: 'Deep Focus', 
      description: 'Log 2 hours of focus time today', 
      progress: todayHours, 
      goal: 2, 
      xp_reward: 100, 
      coin_reward: 25, 
    },
    { 
      id: 'daily_streak_4', 
      title: 'Consistency', 
      description: 'Maintain a 4-day streak', 
      progress: userData.current_streak, 
      goal: 4, 
      xp_reward: 200, 
      coin_reward: 50, 
    }
  ];

  const handleClaim = async (questId: string, xpReward: number, coinReward: number) => {
    if (!user) return;
    setClaiming(questId);
    try {
      const userRef = doc(db, 'users', user.uid);
      const newClaimed = { ...(userData.claimed_quests || {}) };
      newClaimed[questId] = todayStr; // record the claim date

      const newXp = (userData.xp || 0) + xpReward;
      const newCoins = (userData.coins || 0) + coinReward;

      const updates = {
         claimed_quests: newClaimed,
         xp: newXp,
         coins: newCoins
      };

      await updateDoc(userRef, updates);
      setUserData({ ...userData, ...updates });
      toast.success(`Claimed +${xpReward} XP, +${coinReward} Coins!`);
    } catch {
      toast.error('Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="bg-brand-surface shadow hover:shadow-md transition-all duration-300 p-6 md:p-8 rounded-2xl border border-brand-border">
      <div className="flex items-center gap-3 mb-6">
         <div className="p-2.5 bg-yellow-500/10 rounded-2xl text-yellow-500">
            <Target className="w-6 h-6" />
         </div>
         <h2 className="text-xl md:text-2xl font-bold text-brand-text-primary">Daily Quests</h2>
      </div>

      <div className="space-y-4">
         {quests.map(quest => {
            const isCompleted = quest.progress >= quest.goal;
            const progressValue = Math.min(quest.progress, quest.goal);
            const isClaimed = userData.claimed_quests?.[quest.id] === todayStr;

            return (
              <div key={quest.id} className="bg-brand-bg rounded-2xl p-4 border border-brand-border relative overflow-hidden">
                 {isClaimed && (
                   <div className="absolute inset-0 bg-brand-surface/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-success font-bold bg-success/10 px-4 py-2 rounded-full border border-success/20 shadow-sm">
                         <CheckCircle className="w-5 h-5" />
                         <span>Claimed</span>
                      </div>
                   </div>
                 )}
                 <div className="flex justify-between items-start mb-3 relative z-0">
                    <div>
                      <h3 className="font-bold text-brand-text-primary text-base">{quest.title}</h3>
                      <p className="text-xs text-brand-text-secondary mt-0.5">{quest.description}</p>
                    </div>
                    {isCompleted && !isClaimed ? (
                      <button 
                        onClick={() => handleClaim(quest.id, quest.xp_reward, quest.coin_reward)}
                        disabled={claiming === quest.id}
                        className="bg-yellow-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-600 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {claiming === quest.id ? '...' : 'Claim 🎁'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md">+{quest.xp_reward} XP</span>
                        <span className="text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><Gem className="w-3 h-3"/> +{quest.coin_reward}</span>
                       </div>
                    )}
                 </div>
                 
                 <div className="w-full bg-brand-surface rounded-full h-2 border border-brand-border overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all" 
                      style={{ width: `${(progressValue / quest.goal) * 100}%` }}
                    />
                 </div>
                 <div className="text-right mt-1 text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">
                    {typeof progressValue === 'number' && Number.isInteger(progressValue) ? progressValue : progressValue.toFixed(1)} / {quest.goal}
                 </div>
              </div>
            );
         })}
      </div>
    </div>
  );
}
