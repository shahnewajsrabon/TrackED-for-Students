import { useCallback, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { Session } from '@/types';
import toast from 'react-hot-toast';
import { useStreak } from './useStreak';
import confetti from 'canvas-confetti';
import { ambientAudio } from '@/lib/audio';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.uid,
      email: auth?.email,
      emailVerified: auth?.emailVerified,
      isAnonymous: auth?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error('Database operation failed.');
  throw new Error(JSON.stringify(errInfo));
}

interface SaveSessionParams {
  subject_name: string;
  subject_color: string;
  duration_mins: number;
  focus_rating: number;
  mood: string;
  note: string;
  started_at: string;
  completed_at: string;
  linked_task_id?: string | null;
}

const LEVEL_THRESHOLDS = [
  { level: 'Novice', min: 0 },
  { level: 'Learner', min: 500 },
  { level: 'Student', min: 1500 },
  { level: 'Scholar', min: 3000 },
  { level: 'Focused', min: 6000 },
  { level: 'Dedicated', min: 10000 },
  { level: 'Expert', min: 16000 },
  { level: 'Master', min: 24000 },
  { level: 'Legend', min: 35000 },
  { level: 'Grandmaster', min: 50000 },
];

export function useSession() {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const { updateStreakAfterSession } = useStreak();

  const getSessionsByDateRange = useCallback(async (start: string, end: string): Promise<Session[]> => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'sessions'),
        where('user_id', '==', user.uid),
        where('started_at', '>=', start),
        where('started_at', '<=', end),
        orderBy('started_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Session));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, 'sessions', user);
      return [];
    }
  }, [user]);

  const getTodaySessions = useCallback(async (): Promise<Session[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return getSessionsByDateRange(today.toISOString(), tomorrow.toISOString());
  }, [getSessionsByDateRange]);

  const saveSession = useCallback(async (sessionData: SaveSessionParams): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const todaySessions = await getTodaySessions();
      const isFirstOfDay = todaySessions.length === 0;

      let base = sessionData.duration_mins * 2;
      if (sessionData.focus_rating === 5) base = base * 1.5;
      if (isFirstOfDay) base = base + 50;
      const xp_earned = Math.round(base);

      await addDoc(collection(db, 'sessions'), {
        ...sessionData,
        user_id: user.uid,
        xp_earned,
      });

      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      let coinsEarned = 0;

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const newXp = (userData.xp || 0) + xp_earned;
        const newLevelObj = LEVEL_THRESHOLDS.slice().reverse().find(t => newXp >= t.min) || LEVEL_THRESHOLDS[0];
        const newLevel = newLevelObj.level;
        
        coinsEarned = Math.floor(xp_earned / 2);
        const newCoins = (userData.coins || 0) + coinsEarned;

        await updateDoc(userRef, {
          xp: newXp,
          level: newLevel,
          coins: newCoins,
        });

        if (newLevel !== userData.level) {
          toast.success(`Level Up! You are now a ${newLevel} 🎉`, { duration: 5000 });
          ambientAudio.playUISound('level-up');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      }

      await updateStreakAfterSession();

      toast.success(`Session saved! +${xp_earned} XP, +${coinsEarned} Coins`);
      ambientAudio.playUISound('success');
      
      if (sessionData.focus_rating === 5) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'sessions', user);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, getTodaySessions, updateStreakAfterSession]);

  return { saveSession, getSessionsByDateRange, getTodaySessions, loading };
}
