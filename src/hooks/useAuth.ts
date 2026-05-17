import { useAuthContext } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';

export function useAuth() {
  const { user, loading } = useAuthContext();

  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/calendar.events');
      const result = await signInWithPopup(auth, provider);
      // Store OAuth access token in session storage to use later during this session
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        sessionStorage.setItem('google_access_token', credential.accessToken);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error signing in with Google');
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const msg = err.message || 'Error signing in';
      toast.error(msg);
      throw err;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success('Registration successful. You can now log in.');
    } catch (err: any) {
      toast.error(err.message || 'Error signing up');
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      toast.error(err.message || 'Error signing out');
    }
  }, []);

  return { user, loading, signInWithGoogle, signInWithEmail, signUp, signOut };
}
