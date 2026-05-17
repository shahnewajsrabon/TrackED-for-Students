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
      <main className="flex-1 overflow-y-auto p-4 pt-20 md:pt-8 md:p-8 pb-28 md:pb-8 relative">
        <div className="max-w-7xl mx-auto h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
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
