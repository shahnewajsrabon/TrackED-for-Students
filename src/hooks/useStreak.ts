import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { differenceInDays, startOfDay } from 'date-fns';

export function useStreak() {
  const { user } = useAuthContext();

  const calculateStreak = useCallback((lastStudiedAt: string | null, currentStreak: number) => {
    if (!lastStudiedAt) return 1;

    const today = startOfDay(new Date());
    const lastStudied = startOfDay(new Date(lastStudiedAt));
    const diff = differenceInDays(today, lastStudied);

    if (diff === 0) return currentStreak; 
    if (diff === 1) return currentStreak + 1;
    return 1; // Streak broken
  }, []);

  const updateStreakAfterSession = useCallback(async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
        
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      const newStreak = calculateStreak(data.last_studied_at, data.current_streak || 0);
      const newLongest = Math.max(newStreak, data.longest_streak || 0);
      const now = new Date().toISOString();

      await updateDoc(userRef, {
        current_streak: newStreak,
        longest_streak: newLongest,
        last_studied_at: now
      });

    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  }, [user, calculateStreak]);

  return { calculateStreak, updateStreakAfterSession };
}
