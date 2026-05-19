import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import Navbar from './Navbar';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import ChatBotWidget from './ChatBotWidget';

export default function ProtectedRoute() {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then((docSnap) => {
        setHasProfile(docSnap.exists());
      });
    }
  }, [user]);

  if (loading || (user && hasProfile === null)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (user && hasProfile === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (location.pathname === '/onboarding') {
    return (
      <div className="min-h-screen bg-brand-bg flex text-brand-text-primary">
         <Outlet />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-brand-bg text-brand-text-primary overflow-hidden selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:pt-8 md:p-8 pb-28 md:pb-8 relative bg-brand-bg">
        {/* Dynamic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-success/20 blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] mix-blend-multiply" />
        </div>
        
        <div className="max-w-7xl mx-auto h-full relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <ChatBotWidget />
    </div>
  );
}
