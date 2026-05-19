import React, { useState, useEffect } from 'react';
import { ShoppingBag, Target, Flame, CheckCircle, Lock, Unlock, Gem, Clock } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function StorePage() {
  const { user } = useAuthContext();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { appTheme, setAppTheme } = useTheme();

  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then((docSnap) => {
         if (docSnap.exists()) {
           setUserData(docSnap.data());
         }
         setLoading(false);
      });
    }
  }, [user]);

  const buyItem = async (item: any) => {
    if (!userData) return;
    if ((userData.coins || 0) < item.price) {
      toast.error("Not enough coins!");
      return;
    }

    try {
      const userRef = doc(db, 'users', user!.uid);
      const updates: any = {
        coins: userData.coins - item.price
      };

      if (item.type === 'streak_freeze') {
        updates.streak_freezes = (userData.streak_freezes || 0) + 1;
      } else if (item.type === 'theme') {
        updates.unlocked_themes = [...(userData.unlocked_themes || []), item.id];
      } else if (item.type === 'sound') {
        updates.unlocked_sounds = [...(userData.unlocked_sounds || []), item.id];
      }

      await updateDoc(userRef, updates);
      setUserData({ ...userData, ...updates });
      toast.success(`${item.name} purchased!`);
    } catch (err) {
      toast.error("Purchase failed.");
    }
  };

  const equipItem = async (item: any) => {
     if (!userData) return;
     try {
       const userRef = doc(db, 'users', user!.uid);
       const updates: any = {};
       if (item.type === 'theme') {
         updates.active_theme = item.relatedId;
         setAppTheme(item.relatedId);
       } else if (item.type === 'sound') {
         updates.active_sound = item.id;
       }
       await updateDoc(userRef, updates);
       setUserData({ ...userData, ...updates });
       toast.success(`${item.name} equipped!`);
     } catch(err) {
       toast.error("Failed to equip.");
     }
  };

  if (loading) return <div>Loading...</div>;

  const shopItems = [
    { id: 'freeze_1', name: 'Streak Freeze', description: 'Saves your streak if you miss a day.', price: 50, type: 'streak_freeze', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'theme_ocean', relatedId: 'ocean', name: 'Ocean Theme', description: 'Unlock the calming ocean UI theme.', price: 150, type: 'theme', icon: Gem, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'theme_forest', relatedId: 'forest', name: 'Forest Theme', description: 'Unlock the natural forest UI theme.', price: 150, type: 'theme', icon: Gem, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'theme_sunset', relatedId: 'sunset', name: 'Sunset Theme', description: 'Unlock the warm sunset UI theme.', price: 150, type: 'theme', icon: Gem, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'theme_monochrome', relatedId: 'monochrome', name: 'Monochrome Theme', description: 'Minimalist high-contrast theme.', price: 300, type: 'theme', icon: Gem, color: 'text-gray-500', bg: 'bg-gray-500/10' },
  ];

  const quests = [
    { id: 'q1', title: 'Start a Pomodoro Session', progress: 0, goal: 1, xp_reward: 50, coin_reward: 10, is_completed: false },
    { id: 'q2', title: 'Achieve a 4-day streak', progress: userData?.current_streak || 0, goal: 4, xp_reward: 200, coin_reward: 50, is_completed: (userData?.current_streak || 0) >= 4 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-brand-text-primary">Quests & Store</h1>
          <p className="text-brand-text-secondary mt-1">Complete daily challenges and unlock exclusive items.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
             <Gem className="w-5 h-5 text-yellow-500" />
             <span className="font-bold text-yellow-600 dark:text-yellow-400">{userData?.coins || 0} Coins</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl">
             <Flame className="w-5 h-5 text-orange-500" />
             <span className="font-bold text-orange-600 dark:text-orange-400">{userData?.streak_freezes || 0} Freezes</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quests Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <Target className="w-6 h-6 text-primary" />
             <h2 className="text-2xl font-bold text-brand-text-primary">Daily Quests</h2>
          </div>
          <div className="space-y-4">
            {quests.map(quest => (
              <div key={quest.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-brand-text-primary">{quest.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-sm font-bold text-brand-text-secondary">
                        <span className="text-primary">+{quest.xp_reward} XP</span>
                        <span className="text-yellow-500">+{quest.coin_reward} Coins</span>
                      </div>
                    </div>
                    {quest.is_completed ? (
                      <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                    )}
                 </div>
                 
                 <div className="w-full bg-brand-bg rounded-full h-3 border border-brand-border overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all" 
                      style={{ width: `${Math.min(100, (quest.progress / quest.goal) * 100)}%` }}
                    />
                 </div>
                 <div className="text-right mt-1 text-xs font-bold text-brand-text-secondary">
                    {Math.min(quest.progress, quest.goal)} / {quest.goal}
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* Store Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <ShoppingBag className="w-6 h-6 text-primary" />
             <h2 className="text-2xl font-bold text-brand-text-primary">Virtual Shop</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.map(item => {
              const IconPattern = item.icon;
              
              let isOwned = false;
              if (item.type === 'theme') isOwned = userData?.unlocked_themes?.includes(item.id);
              if (item.type === 'sound') isOwned = userData?.unlocked_sounds?.includes(item.id);
              
              let isEquipped = false;
              if (item.type === 'theme') isEquipped = userData?.active_theme === item.relatedId;
              if (item.type === 'sound') isEquipped = userData?.active_sound === item.id;
              
              const isConsumable = item.type === 'streak_freeze';

              return (
                <div key={item.id} className="bg-brand-surface border border-brand-border rounded-2xl p-5 shadow-sm flex flex-col">
                  <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${item.bg}`}>
                    <IconPattern className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-lg text-brand-text-primary mb-1">{item.name}</h3>
                  <p className="text-sm text-brand-text-secondary mb-4 flex-1">{item.description}</p>
                  
                  {isConsumable ? (
                    <button 
                      onClick={() => buyItem(item)}
                      className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-colors py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      Buy for {item.price} <Gem className="w-4 h-4" />
                    </button>
                  ) : isOwned ? (
                    <button 
                      onClick={() => equipItem(item)}
                      disabled={isEquipped}
                      className={`w-full bg-brand-bg border border-brand-border py-2 rounded-xl font-bold transition-colors ${isEquipped ? 'text-success border-success/30' : 'text-brand-text-primary hover:bg-gray-50'}`}
                    >
                      {isEquipped ? 'Equipped' : 'Equip'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => buyItem(item)}
                      className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 transition-colors py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      Unlock for {item.price} <Gem className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
