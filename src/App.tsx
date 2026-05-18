import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import LoadingSpinner from './components/LoadingSpinner';
import { AnimatePresence } from 'framer-motion';

import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import TimerPage from './pages/TimerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import GroupsPage from './pages/GroupsPage';
import GroupChatPage from './pages/GroupChatPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import SyllabusPage from './pages/SyllabusPage';
import PlannerPage from './pages/PlannerPage';
import FlashcardsPage from './pages/FlashcardsPage';
import NotesPage from './pages/NotesPage';
import ToolsPage from './pages/ToolsPage';
import ExamsPage from './pages/ExamsPage';

function App() {
  return (
    <HashRouter>
       <ThemeProvider>
        <AuthProvider>
           <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/u/:id" element={<PublicProfilePage />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/timer" element={<TimerPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/syllabus" element={<SyllabusPage />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/flashcards" element={<FlashcardsPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/exams" element={<ExamsPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupChatPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          <Toaster position="top-center" toastOptions={{
             style: {
               borderRadius: '12px',
               background: '#333',
               color: '#fff',
               fontSize: '14px',
             }
          }}/>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
