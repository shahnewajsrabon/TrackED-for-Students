import { create } from 'zustand';
import { Subject, User } from '@/types';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';

interface GlobalState {
  subjects: Subject[];
  subjectsLoading: boolean;
  currentUser: User | null;
  onlineUsers: Record<string, boolean>;
  initSubjects: (uid: string) => void;
  addSubject: (uid: string, subject: Subject) => Promise<void>;
  updateSubject: (uid: string, subjectId: string, updates: Partial<Subject>) => Promise<void>;
  removeSubject: (uid: string, subjectId: string) => Promise<void>;
  unsubscribeSubjects: () => void;
}

let subjectsUnsubscribe: (() => void) | null = null;

export const useStore = create<GlobalState>((set, get) => ({
  subjects: [],
  subjectsLoading: true,
  currentUser: null,
  onlineUsers: {},

  initSubjects: (uid: string) => {
    if (subjectsUnsubscribe) {
      subjectsUnsubscribe();
    }
    set({ subjectsLoading: true });
    
    // Listen to user doc for subjects
    const userRef = doc(db, 'users', uid);
    subjectsUnsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        set({
          subjects: (data.subjects as Subject[]) || [],
          subjectsLoading: false,
          currentUser: { id: docSnap.id, ...data } as User
        });
      } else {
        set({ subjects: [], subjectsLoading: false });
      }
    });

    // Also track online users roughly (if we had an online field)
    // We could listen to users collection changes if necessary
  },

  unsubscribeSubjects: () => {
    if (subjectsUnsubscribe) {
      subjectsUnsubscribe();
      subjectsUnsubscribe = null;
    }
    set({ subjects: [], currentUser: null });
  },

  addSubject: async (uid: string, subject: Subject) => {
    const state = get();
    const updated = [...state.subjects, subject];
    await updateDoc(doc(db, 'users', uid), { subjects: updated });
  },

  updateSubject: async (uid: string, subjectId: string, updates: Partial<Subject>) => {
    const state = get();
    const updated = state.subjects.map((s) => (s.id === subjectId ? { ...s, ...updates } : s));
    await updateDoc(doc(db, 'users', uid), { subjects: updated });
  },

  removeSubject: async (uid: string, subjectId: string) => {
    const state = get();
    const updated = state.subjects.filter((s) => s.id !== subjectId);
    await updateDoc(doc(db, 'users', uid), { subjects: updated });
  }
}));

// Also track simple presence if we need:
// export const setOnlineStatus = async (uid: string, isOnline: boolean) => {
//   await updateDoc(doc(db, 'users', uid), { isOnline, lastSeen: Date.now() });
// };
