import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { differenceInDays, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';

export function useStreak() {
  const { user } = useAuthContext();

  const calculateStreak = useCallback((lastStudiedAt: string | null, currentStreak: number, streakFreezes: number = 0) => {
    if (!lastStudiedAt) return { streak: 1, freezesUsed: 0 };

    const today = startOfDay(new Date());
    const lastStudied = startOfDay(new Date(lastStudiedAt));
    const diff = differenceInDays(today, lastStudied);

    if (diff === 0) return { streak: currentStreak, freezesUsed: 0 }; 
    if (diff === 1) return { streak: currentStreak + 1, freezesUsed: 0 };
    
    const missedDays = diff - 1;
    if (streakFreezes >= missedDays && currentStreak > 0) {
      return { streak: currentStreak + 1, freezesUsed: missedDays };
    }

    return { streak: 1, freezesUsed: 0 }; // Streak broken
  }, []);

  const updateStreakAfterSession = useCallback(async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
        
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      const { streak: newStreak, freezesUsed } = calculateStreak(
        data.last_studied_at, 
        data.current_streak || 0,
        data.streak_freezes || 0
      );
      
      const newLongest = Math.max(newStreak, data.longest_streak || 0);
      const now = new Date().toISOString();

      const updates: any = {
        current_streak: newStreak,
        longest_streak: newLongest,
        last_studied_at: now
      };

      if (freezesUsed > 0) {
        updates.streak_freezes = (data.streak_freezes || 0) - freezesUsed;
        toast.success(`Streak saved using ${freezesUsed} Streak Freeze${freezesUsed > 1 ? 's' : ''}! 🧊`);
      }

      await updateDoc(userRef, updates);

    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  }, [user, calculateStreak]);

  return { calculateStreak, updateStreakAfterSession };
}
