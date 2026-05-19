import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Timer, BarChart3, Users, Trophy, UserCircle, Flame, Moon, Sun, ListChecks, Calendar, BrainCircuit, FileText, Wrench, Languages, FileQuestion, ShoppingBag } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import clsx from 'clsx';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

// Base config - we'll translate the labels dynamically
const navSectionsConfig = [
  {
    titleKey: 'Study Area',
    items: [
      { path: '/dashboard', labelKey: 'dashboard', icon: BookOpen },
      { path: '/planner', labelKey: 'planner', icon: Calendar },
      { path: '/timer', labelKey: 'Timer', icon: Timer },
    ]
  },
  {
    titleKey: 'Learning Tools',
    items: [
      { path: '/syllabus', labelKey: 'Syllabus', icon: ListChecks },
      { path: '/flashcards', labelKey: 'flashcards', icon: BrainCircuit },
      { path: '/notes', labelKey: 'notes', icon: FileText },
      { path: '/tools', labelKey: 'tools', icon: Wrench },
    ]
  },
  {
    titleKey: 'Community & Stats',
    items: [
      { path: '/exams', labelKey: 'Exams', icon: FileQuestion },
      { path: '/analytics', labelKey: 'Analytics', icon: BarChart3 },
      { path: '/groups', labelKey: 'Groups', icon: Users },
      { path: '/leaderboard', labelKey: 'Leaderboard', icon: Trophy },
      { path: '/store', labelKey: 'Store & Quests', icon: ShoppingBag },
    ]
  }
];

export default function Navbar() {
  const { user } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const [userData, setUserData] = React.useState<any>(null);
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(nextLang);
  };
  
  React.useEffect(() => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then((docSnap) => {
         if (docSnap.exists()) {
           setUserData(docSnap.data());
         }
      });
    }
  }, [user]);

  return (
    <>
      {/* Desktop Sidebar Nav */}
      <aside className="hidden md:flex flex-col w-64 h-full border-r border-brand-border bg-brand-surface shrink-0">
        <div className="flex items-center gap-3 p-6 border-b border-brand-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
            <Timer className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-brand-text-primary">TrackED</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {navSectionsConfig.map((section) => (
            <div key={section.titleKey} className="space-y-1">
              <div className="px-4 text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-2">
                {section.titleKey}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const label = t(`nav.${item.labelKey}`, item.labelKey); // fallback to key itself if not found
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => clsx(
                      "flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200",
                      isActive ? "bg-primary-light text-primary shadow-sm" : "text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-brand-border hover:text-brand-text-primary"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-brand-border mt-auto flex flex-col gap-3">
          {userData && (
            <NavLink to="/profile" className={({ isActive }) => clsx(
              "flex items-center gap-3 p-2 rounded-2xl border border-transparent transition-colors",
              isActive ? "bg-primary-light border-primary/20 text-primary" : "hover:bg-brand-bg hover:border-brand-border text-brand-text-primary"
            )}>
               <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold shrink-0">
                 {userData.avatar_url ? (
                   <img src={userData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   userData.display_name?.charAt(0).toUpperCase()
                 )}
               </div>
               <div className="flex flex-col items-start min-w-[0px]">
                 <div className="text-sm font-bold truncate w-full">{userData.display_name}</div>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="text-[10px] uppercase tracking-wider font-bold text-brand-text-secondary">LVL {userData.level}</div>
                   <div className="w-1 h-1 bg-brand-border rounded-full" />
                   <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                     <Flame className="w-3 h-3" strokeWidth={3} />
                     {userData.current_streak || 0}
                   </div>
                 </div>
               </div>
            </NavLink>
          )}

          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="flex flex-1 items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-brand-border hover:text-brand-text-primary transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            </button>
            <button onClick={toggleLanguage} className="flex flex-1 items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-brand-text-secondary hover:bg-gray-100 dark:hover:bg-brand-border hover:text-brand-text-primary transition-colors">
              <Languages className="w-5 h-5 shrink-0" />
              {i18n.language === 'en' ? 'EN' : 'বাংলা'}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-brand-border bg-brand-surface flex items-center overflow-x-auto z-50 px-2 pb-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] no-scrollbar">
        {navSectionsConfig.flatMap(section => section.items).map((item) => {
          const Icon = item.icon;
          const label = t(`nav.${item.labelKey}`, item.labelKey);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex flex-col items-center gap-1 p-3 min-w-[72px] shrink-0 transition-colors",
                isActive ? "text-primary font-bold" : "text-brand-text-secondary font-medium"
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={clsx("p-1.5 rounded-2xl transition-all", isActive ? "bg-primary-light" : "")}>
                     <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] mt-0.5">{label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 border-b border-brand-border bg-brand-surface/80 backdrop-blur-md z-40 px-5 py-2.5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg border border-primary flex items-center justify-center text-white shrink-0 shadow-sm">
              <Timer className="w-4 h-4" />
            </div>
            <span className="font-extrabold tracking-tight text-brand-text-primary text-lg">TrackED</span>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-brand-bg text-brand-text-secondary transition-colors font-bold text-xs uppercase">
              {i18n.language === 'en' ? 'EN' : 'বাং'}
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-brand-bg text-brand-text-secondary transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NavLink to="/profile">
              <div className="w-8 h-8 rounded-full border border-brand-border bg-brand-bg flex items-center justify-center overflow-hidden">
                {userData?.avatar_url ? (
                   <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <UserCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </NavLink>
         </div>
      </div>
    </>
  );
}
