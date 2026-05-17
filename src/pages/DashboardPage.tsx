import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useSession } from '@/hooks/useSession';
import { useSubjects } from '@/hooks/useSubjects';
import { User, Session, Exam, SyllabusTopic } from '@/types';
import StatCard from '@/components/StatCard';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdBanner from '@/components/AdBanner';
import { motion } from 'framer-motion';
import { Flame, Clock, Zap, Target, Play, ChevronRight, Calendar as CalendarIcon, ListChecks, ArrowRight, BookOpen, Plus, BrainCircuit, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SubjectBadge from '@/components/SubjectBadge';
import { differenceInDays, startOfDay, isFuture, formatDistanceToNow } from 'date-fns';
import ToolsSection from '@/components/ToolsSection';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const { getTodaySessions, getSessionsByDateRange } = useSession();
  const { subjects, loading: subjectsLoading } = useSubjects();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<User | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateSyllabusProgress = (syllabus?: SyllabusTopic[]) => {
    if (!syllabus || syllabus.length === 0) return 0;
    const completed = syllabus.filter(t => t.status === 'completed').length;
    const inProgress = syllabus.filter(t => t.status === 'in_progress').length;
    const score = completed + (inProgress * 0.5);
    return Math.round((score / syllabus.length) * 100);
  };

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setUserData(docSnap.data() as User);
      
      const tSessions = await getTodaySessions();
      setTodaySessions(tSessions);
      
      // Load last 365 days for heatmap
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 365);
      const yearSessions = await getSessionsByDateRange(start.toISOString(), end.toISOString());
      setAllSessions(yearSessions);
      
      setLoading(false);
    }
    loadData();
  }, [user, getTodaySessions, getSessionsByDateRange]);

  if (loading || subjectsLoading || !userData) {
    return <LoadingSpinner />;
  }

  const todayHours = todaySessions.reduce((acc, s) => acc + s.duration_mins, 0) / 60;
  const todayXp = todaySessions.reduce((acc, s) => acc + s.xp_earned, 0);

  // Subject Progress (This week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weekSessions = allSessions.filter(s => new Date(s.started_at) >= oneWeekAgo);

  const getSubjectProgress = (subjectName: string, weeklyGoal: number) => {
    const mins = weekSessions.filter(s => s.subject_name === subjectName).reduce((a, b) => a + b.duration_mins, 0);
    const hrs = mins / 60;
    const percentage = weeklyGoal > 0 ? (hrs / weeklyGoal) * 100 : 0;
    let color = 'bg-danger';
    if (percentage >= 80) color = 'bg-success';
    else if (percentage >= 40) color = 'bg-warning';
    
    return { hrs, percentage: Math.min(percentage, 100), color };
  };

  const getUpcomingExams = () => {
    const exams: (Exam & { subjectName: string, subjectColor: string })[] = [];
    subjects.forEach(s => {
      if (s.examName && s.examDate && isFuture(new Date(s.examDate))) {
        exams.push({ examName: s.examName, examDate: s.examDate, subjectName: s.name, subjectColor: s.color });
      }
    });
    return exams.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  };

  const getUpcomingReminders = () => {
    const reminders: (Exam & { subjectName: string, subjectColor: string })[] = [];
    subjects.forEach(s => {
      if (s.examReminderDate && isFuture(new Date(s.examReminderDate))) {
        reminders.push({ examName: (s.examName ? `${s.examName} Reminder` : `${s.name} Reminder`), examDate: s.examReminderDate, subjectName: s.name, subjectColor: s.color });
      }
    });
    return reminders.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
  };

  const upcomingExams = getUpcomingExams();
  const upcomingReminders = getUpcomingReminders();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-10"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-2">
        <div className="w-full sm:w-auto">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-4xl font-black tracking-tight text-brand-text-primary drop-shadow-sm mb-1"
          >
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {userData.display_name.split(' ')[0]}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-brand-text-secondary text-lg font-medium"
          >
            Ready for another focused session?
          </motion.p>
          
          {userData.daily_goal_hrs && userData.daily_goal_hrs > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 w-full max-w-sm"
            >
              <div className="flex justify-between items-end mb-2">
                <span className="font-bold text-sm text-brand-text-primary uppercase tracking-wider">Today's Goal</span>
                <span className="text-sm font-bold text-brand-text-secondary">
                  {todayHours.toFixed(1)} / {userData.daily_goal_hrs} hrs
                </span>
              </div>
              <div className="w-full bg-brand-surface rounded-full h-2.5 overflow-hidden border border-brand-border shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todayHours / userData.daily_goal_hrs) * 100, 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>
          )}
        </div>
        <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
          <Link 
            to="/timer"
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20"
          >
            <Play className="w-5 h-5 fill-current" />
            <span className="text-lg">Start Studying</span>
          </Link>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button onClick={() => navigate('/planner')} className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-2xl hover:border-primary hover:shadow-md transition-all text-left group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-brand-text-primary">New Task</div>
            <div className="text-xs font-medium text-brand-text-secondary">Plan your activities</div>
          </div>
        </button>
        <button onClick={() => navigate('/notes')} className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-2xl hover:border-info hover:shadow-md transition-all text-left group">
          <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center text-info group-hover:bg-info group-hover:text-white transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-brand-text-primary">Take Note</div>
            <div className="text-xs font-medium text-brand-text-secondary">Write down ideas</div>
          </div>
        </button>
        <button onClick={() => navigate('/flashcards')} className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-2xl hover:border-warning hover:shadow-md transition-all text-left group">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning-foreground group-hover:bg-warning group-hover:text-white transition-colors">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-brand-text-primary">Study Cards</div>
            <div className="text-xs font-medium text-brand-text-secondary">Review flashcards</div>
          </div>
        </button>
        <button onClick={() => navigate('/syllabus')} className="flex items-center gap-3 p-4 bg-brand-surface border border-brand-border rounded-2xl hover:border-success hover:shadow-md transition-all text-left group">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:bg-success group-hover:text-white transition-colors">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-brand-text-primary">Syllabus</div>
            <div className="text-xs font-medium text-brand-text-secondary">Update progress</div>
          </div>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
      >
        <StatCard label="Today's Hours" value={todayHours.toFixed(1)} icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Current Streak" value={userData.current_streak} icon={<Flame className="w-5 h-5" />} subtitle={todaySessions.length === 0 ? "Study today to keep it!" : "Kept alive today 🔥"} />
        <StatCard label="XP Earned Today" value={`+${todayXp}`} icon={<Zap className="w-5 h-5" />} />
        <StatCard label="Sessions Today" value={todaySessions.length} icon={<Target className="w-5 h-5" />} />
      </motion.div>

      {/* Your Subjects Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-brand-surface shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] border border-brand-border"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-brand-text-primary mb-0 tracking-tight">Your Subjects</h2>
            <div className="bg-brand-bg border border-brand-border px-3 py-1 rounded-full text-sm font-bold text-brand-text-secondary shadow-inner flex items-center justify-center shadow-sm">
              {subjects.length}
            </div>
          </div>
          <Link to="/syllabus" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center bg-primary/5 px-4 py-2 rounded-xl shadow-sm border border-primary/10">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subjects.map((subject, idx) => {
            const prog = calculateSyllabusProgress(subject.syllabus);
            return (
              <Link 
                key={subject.id}
                to="/syllabus"
                className="block outline-none"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + (idx * 0.1) }}
                  className="p-6 rounded-[2rem] border border-brand-border bg-brand-bg flex flex-col h-full group hover:border-brand-border hover:bg-brand-surface hover:shadow-lg transition-all relative overflow-hidden"
                >
                  {/* Top section: Icon and badges */}
                  <div className="flex justify-between items-start mb-6">
                    <div 
                      className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform" 
                      style={{ backgroundColor: subject.color }}
                    >
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <span className="font-extrabold text-xs bg-brand-surface border border-brand-border px-3 py-1.5 rounded-full text-brand-text-primary shadow-sm">
                        {prog}%
                      </span>
                      {(subject.examDate || subject.examName) && (
                        <span className="font-bold text-xs bg-danger/10 text-danger border border-danger/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                          <CalendarIcon className="w-3.5 h-3.5" /> 
                          {subject.examDate ? (isFuture(new Date(subject.examDate)) ? formatDistanceToNow(new Date(subject.examDate)).replace('about ', '') + ' left' : 'Past') : 'Exam'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title and stats */}
                  <h3 className="font-extrabold text-2xl text-brand-text-primary mb-3 line-clamp-2 leading-tight">
                    {subject.name}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 bg-brand-surface border border-brand-border shadow-sm px-3 py-1.5 rounded-xl w-fit mb-8 opacity-80">
                    <BookOpen className="w-4 h-4 text-brand-text-secondary" />
                    <span className="text-sm font-bold text-brand-text-secondary">{subject.syllabus?.length || 0}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-auto space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm font-bold text-brand-text-secondary">
                      <span>Progress</span>
                      <span>{prog}%</span>
                    </div>
                    <div className="w-full bg-brand-surface rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${prog}%`, backgroundColor: subject.color || '#534AB7' }}
                      />
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-full h-px bg-brand-border/60 mb-5 line-clamp-2"></div>
                  
                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">Details</span>
                    <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center group-hover:bg-brand-border transition-all text-brand-text-secondary shadow-sm">
                      <ArrowRight className="w-[18px] h-[18px]" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
          {subjects.length === 0 && (
            <div className="text-center py-10 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-3xl font-medium">
              No subjects added yet. Go to Profile to set them up.
            </div>
          )}
        </div>
      </motion.section>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-brand-surface shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] border border-brand-border"
          >
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-brand-text-primary group">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary transition-transform group-hover:scale-110">
                <CalendarIcon className="w-6 h-6" />
              </div>
              Year in Pixels
            </h2>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              <HeatmapCalendar sessions={allSessions} />
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-brand-surface shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] border border-brand-border"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-brand-text-primary">Subject Progress</h2>
              <Link to="/profile" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center bg-primary/5 px-4 py-2 rounded-xl">
                Manage Goals <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="space-y-8">
              {subjects.map((subject, idx) => {
                const prog = getSubjectProgress(subject.name, subject.weeklyGoalHrs);
                return (
                  <motion.div 
                    key={subject.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                    className="group"
                  >
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-sm ring-4 ring-gray-100 dark:ring-gray-800 transition-transform group-hover:scale-125" style={{ backgroundColor: subject.color }} />
                        <span className="font-bold text-lg text-brand-text-primary">{subject.name}</span>
                      </div>
                      <div className="text-base">
                        <span className="font-extrabold text-brand-text-primary">{prog.hrs.toFixed(1)}</span>
                        <span className="text-brand-text-secondary font-medium tracking-wide"> / {subject.weeklyGoalHrs} hrs</span>
                      </div>
                    </div>
                    <div className="w-full bg-brand-bg rounded-full h-3 overflow-hidden shadow-inner flex border border-brand-border/50">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${prog.percentage}%` }}
                        transition={{ duration: 1.2, type: 'spring', bounce: 0.2 }}
                        className={`h-full rounded-full ${prog.color}`}
                      />
                    </div>
                  </motion.div>
                );
              })}
              {subjects.length === 0 && (
                <div className="text-center py-6 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-xl">
                  No subjects added yet. Go to Profile to set them up.
                </div>
              )}
            </div>
          </motion.section>
        </div>

        <div className="space-y-8">
          <motion.section 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="bg-primary shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-8 opacity-[0.08] transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
               <Flame className="w-40 h-40 text-black dark:text-white" />
             </div>
             <div className="relative z-10">
               <h3 className="text-white/80 font-bold text-xs mb-2 tracking-widest uppercase">Your Streak</h3>
               <div className="text-[5rem] font-light tracking-tighter text-white leading-none mb-6 drop-shadow-md font-display">
                 {userData.current_streak} <span className="text-xl font-bold pb-2 opacity-80 uppercase tracking-widest ml-1 font-sans">days</span>
               </div>
               <p className="text-sm font-medium text-white/90 leading-relaxed max-w-[220px]">
                 {todaySessions.length > 0 
                    ? "Awesome work today! Come back tomorrow to keep the flame alive."
                    : "Start a focus session today to maintain your streak!"}
               </p>
             </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-brand-surface shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] border border-brand-border"
          >
            <h2 className="text-2xl font-bold mb-6 text-brand-text-primary">Upcoming Exams</h2>
            {upcomingExams.length > 0 ? (
              <div className="space-y-4">
                {upcomingExams.map((exam, i) => {
                  const daysLeft = differenceInDays(startOfDay(new Date(exam.examDate)), startOfDay(new Date()));
                  let urgencyColor = 'text-success bg-success/10 border-success/20';
                  if (daysLeft < 3) urgencyColor = 'text-danger bg-danger/10 border-danger/20';
                  else if (daysLeft <= 7) urgencyColor = 'text-warning bg-warning/10 border-warning/20';

                  return (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-5 rounded-2xl border border-brand-border transition-all bg-brand-bg shadow-sm"
                    >
                      <div>
                        <div className="font-extrabold text-base mb-1.5 text-brand-text-primary">{exam.examName}</div>
                        <SubjectBadge name={exam.subjectName} color={exam.subjectColor} />
                      </div>
                      <div className={`px-4 py-2.5 rounded-xl border flex flex-col items-center justify-center min-w-[70px] ${urgencyColor}`}>
                        <div className="text-xl font-black leading-none mb-0.5">{daysLeft}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">Days</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
               <div className="text-center py-8 text-brand-text-secondary text-sm">
                 No upcoming exams scheduled.<br/>Add them in your Profile.
               </div>
            )}
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-brand-surface shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-[2.5rem] border border-brand-border"
          >
            <h2 className="text-2xl font-bold mb-6 text-brand-text-primary">Upcoming Reminders</h2>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-4">
                {upcomingReminders.map((reminder, i) => {
                  const daysLeft = differenceInDays(startOfDay(new Date(reminder.examDate)), startOfDay(new Date()));
                  let urgencyColor = 'text-success bg-success/10 border-success/20';
                  if (daysLeft < 3) urgencyColor = 'text-danger bg-danger/10 border-danger/20';
                  else if (daysLeft <= 7) urgencyColor = 'text-warning bg-warning/10 border-warning/20';

                  return (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-5 rounded-2xl border border-brand-border transition-all bg-brand-bg shadow-sm"
                    >
                      <div>
                        <div className="font-extrabold text-base mb-1.5 text-brand-text-primary">{reminder.examName}</div>
                        <SubjectBadge name={reminder.subjectName} color={reminder.subjectColor} />
                      </div>
                      <div className={`px-4 py-2.5 rounded-xl border flex flex-col items-center justify-center min-w-[70px] ${urgencyColor}`}>
                        <div className="text-xl font-black leading-none mb-0.5">{daysLeft}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">Days</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
               <div className="text-center py-8 text-brand-text-secondary text-sm">
                 No custom reminders set.<br/>Add them in your Profile.
               </div>
            )}
          </motion.section>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <AdBanner />
          </motion.div>
        </div>
      </div>

      <ToolsSection />
    </motion.div>
  );
}
