import { useCallback, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Subject } from '@/types';
import toast from 'react-hot-toast';
import { useStore } from '@/store';

export function useSubjects() {
  const { user } = useAuthContext();
  const { subjects, subjectsLoading: loading, addSubject: storeAddSubject, updateSubject: storeUpdateSubject, removeSubject: storeRemoveSubject, initSubjects, unsubscribeSubjects } = useStore();

  useEffect(() => {
    if (user?.uid) {
      initSubjects(user.uid);
    } else {
      unsubscribeSubjects();
    }
  }, [user?.uid, initSubjects, unsubscribeSubjects]);

  const getSubjects = useCallback(async () => {
    // Already handled by Zustand real-time listener
  }, []);

  const addSubject = useCallback(async (newSubject: Subject) => {
    if (!user) return false;
    try {
      await storeAddSubject(user.uid, newSubject);
      toast.success('Subject added');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to add subject');
      return false;
    }
  }, [user, storeAddSubject]);

  const removeSubject = useCallback(async (subjectId: string) => {
    if (!user) return false;
    try {
      await storeRemoveSubject(user.uid, subjectId);
      toast.success('Subject removed');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove subject');
      return false;
    }
  }, [user, storeRemoveSubject]);
  
  const updateSubject = useCallback(async (subjectId: string, updates: Partial<Subject>) => {
    if (!user) return false;
    try {
      await storeUpdateSubject(user.uid, subjectId, updates);
      toast.success('Subject updated');
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Failed to update subject');
      return false;
    }
  }, [user, storeUpdateSubject]);

  return { subjects, loading, getSubjects, addSubject, removeSubject, updateSubject };
}
