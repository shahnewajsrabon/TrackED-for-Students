import { useCallback, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { Subject } from '@/types';
import toast from 'react-hot-toast';

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

export function useSubjects() {
  const { user } = useAuthContext();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const getSubjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
        
      if (docSnap.exists()) {
        setSubjects((docSnap.data().subjects as Subject[]) || []);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, 'users', user);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    getSubjects();
  }, [getSubjects]);

  const addSubject = useCallback(async (newSubject: Subject) => {
    if (!user) return false;
    try {
      const updated = [...subjects, newSubject];
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { subjects: updated });
        
      setSubjects(updated);
      toast.success('Subject added');
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'users', user);
      return false;
    }
  }, [user, subjects]);

  const removeSubject = useCallback(async (subjectId: string) => {
    if (!user) return false;
    try {
      const updated = subjects.filter(s => s.id !== subjectId);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { subjects: updated });
        
      setSubjects(updated);
      toast.success('Subject removed');
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'users', user);
      return false;
    }
  }, [user, subjects]);
  
  const updateSubject = useCallback(async (subjectId: string, updates: Partial<Subject>) => {
    if (!user) return false;
    try {
      const updated = subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s);
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { subjects: updated });
        
      setSubjects(updated);
      toast.success('Subject updated');
      return true;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, 'users', user);
      return false;
    }
  }, [user, subjects]);

  return { subjects, loading, getSubjects, addSubject, removeSubject, updateSubject };
}
