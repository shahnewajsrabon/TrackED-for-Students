import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { useSession } from '@/hooks/useSession';
import { User, Session, Exam } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import XPProgressRing from '@/components/XPProgressRing';
import BadgeGrid from '@/components/BadgeGrid';
import StatCard from '@/components/StatCard';
import SubjectBadge, { getSubjectIcon } from '@/components/SubjectBadge';
import { Clock, LogOut, Settings, Award, Palette, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

import { useTheme } from '@/context/ThemeContext';

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { subjects, addSubject, removeSubject, updateSubject } = useSubjects();
  const { getSessionsByDateRange } = useSession();
  const { appTheme, setAppTheme } = useTheme();

  const [userData, setUserData] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  
  // New Subject State
  const [newSub, setNewSub] = useState({ name: '', color: '#534AB7', weeklyGoalHrs: 5 });
  
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as User;
          setUserData(data);
          setNewName(data.display_name);
        }

        const start = new Date();
        start.setFullYear(start.getFullYear() - 10);
        const end = new Date();

        const sess = await getSessionsByDateRange(start.toISOString(), end.toISOString());
        setSessions(sess);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, getSessionsByDateRange]);

  const updateProfile = async () => {
    if (!user || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { display_name: newName });
      setUserData(prev => prev ? {...prev, display_name: newName} : null);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleAddSubject = async () => {
    if (!newSub.name.trim()) return;
    const ok = await addSubject({
      id: crypto.randomUUID(),
      name: newSub.name,
      color: newSub.color,
      weeklyGoalHrs: newSub.weeklyGoalHrs
    });
    if (ok) setNewSub({ name: '', color: '#534AB7', weeklyGoalHrs: 5 });
  };

  if (loading || !userData) return <LoadingSpinner />;

  const lvlIndex = LEVEL_THRESHOLDS.findIndex(l => l.level === userData.level);
  const curLvl = LEVEL_THRESHOLDS[lvlIndex];
  const nextLvl = LEVEL_THRESHOLDS[lvlIndex + 1] || { min: Infinity };

  const totalHrs = (sessions.reduce((a,b) => a + b.duration_mins, 0) / 60).toFixed(1);
  const totalSess = sessions.length;
  
  const subMins: Record<string, number> = {};
  sessions.forEach(s => subMins[s.subject_name] = (subMins[s.subject_name] || 0) + s.duration_mins);
  const favSub = Object.keys(subMins).sort((a,b) => subMins[b] - subMins[a])[0] || 'None';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header Profile Card */}
      <div className="bg-brand-surface p-8 rounded-3xl border border-brand-border flex flex-col md:flex-row items-center gap-8 shadow-sm">
        <div className="shrink-0 relative">
          <XPProgressRing 
            xp={userData.xp} 
            currentLevelMin={curLvl.min} 
            nextLevelMin={nextLvl.min} 
            size={140} 
            strokeWidth={10} 
          />
          <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-primary text-3xl font-bold overflow-hidden shadow-inner border border-primary/20">
             {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : userData.display_name.charAt(0).toUpperCase()}
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-bold mb-1">{userData.display_name}</h1>
          <p className="text-brand-text-secondary font-medium mb-4">@{userData.username}</p>
          <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-4 py-2 rounded-xl font-bold">
            <Award className="w-5 h-5 -mt-0.5" /> Level: {userData.level}
          </div>
          <p className="text-xs text-brand-text-secondary mt-3">
             {userData.xp} XP total • {nextLvl.min !== Infinity ? `${nextLvl.min - userData.xp} XP to ${nextLvl.level}` : 'Max Level Reach!'}
          </p>
        </div>

        <div className="shrink-0 space-y-3 w-full md:w-auto">
           <button 
             onClick={() => {
               const url = `${window.location.origin}/u/${user?.uid}`;
               navigator.clipboard.writeText(url);
               toast.success('Public profile link copied to clipboard!');
             }} 
             className="w-full flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-6 py-3 rounded-xl font-medium transition-colors border border-indigo-100"
           >
             <Share2 className="w-4 h-4" /> Share Profile
           </button>
           <button onClick={signOut} className="w-full flex justify-center items-center gap-2 bg-brand-bg hover:bg-brand-border border border-brand-border text-brand-text-primary px-6 py-3 rounded-xl font-medium transition-colors">
             <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Hours" value={totalHrs} icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Total Sessions" value={totalSess} />
        <StatCard label="Favorite Subject" value={favSub} />
        <StatCard label="Best Streak" value={`${userData.longest_streak} days`} />
      </div>

      {/* Badges */}
      <div className="bg-brand-surface p-8 rounded-3xl border border-brand-border">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Badges</h2>
         <BadgeGrid badges={userData.badges || []} />
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-brand-surface p-8 rounded-3xl border border-brand-border h-fit space-y-8">
           <div>
             <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Settings className="w-5 h-5 text-primary" /> Edit Profile & Goals</h2>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium mb-2 text-brand-text-primary">Display Name</label>
                 <div className="flex gap-2">
                   <input 
                     type="text" 
                     value={newName} 
                     onChange={e => setNewName(e.target.value)} 
                     className="flex-1 px-4 py-2 bg-brand-bg border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                   />
                   <button onClick={updateProfile} className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90">Save</button>
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-medium mb-2 text-brand-text-primary">Daily Study Goal (Hours)</label>
                 <input 
                   type="number" 
                   value={userData.daily_goal_hrs || ''}
                   onChange={async e => {
                     const val = parseInt(e.target.value);
                     const newVal = isNaN(val) ? 0 : val;
                     setUserData({...userData, daily_goal_hrs: newVal});
                     if (user) await updateDoc(doc(db, 'users', user.uid), { daily_goal_hrs: newVal });
                     toast.success('Daily goal updated', {id: 'daily-goal'});
                   }} 
                   className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                 />
               </div>
             </div>
           </div>

           <div className="border-t border-brand-border pt-6">
             <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Palette className="w-5 h-5 text-primary" /> App Interface</h2>
             <div className="grid grid-cols-2 gap-3">
               {[
                 { id: 'classic', label: 'Classic' },
                 { id: 'ocean', label: 'Ocean' },
                 { id: 'forest', label: 'Forest' },
                 { id: 'sunset', label: 'Sunset' },
                 { id: 'monochrome', label: 'Monochrome' }
               ].map(theme => (
                 <button
                   key={theme.id}
                   onClick={() => setAppTheme(theme.id as any)}
                   className={`p-3 rounded-xl border-2 font-bold transition-all text-left ${appTheme === theme.id ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20 cursor-default' : 'border-brand-border bg-brand-bg text-brand-text-secondary hover:border-gray-300 hover:text-brand-text-primary'}`}
                 >
                   {theme.label}
                 </button>
               ))}
             </div>
           </div>
        </div>

        {/* Subjects */}
        <div className="bg-brand-surface p-8 rounded-3xl border border-brand-border border-dashed h-fit space-y-6">
           <h3 className="font-bold text-xl flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Manage Subjects & Exams</h3>
           <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-4">
             {subjects.map(s => (
               <div key={s.id} className="flex flex-col bg-brand-bg border border-brand-border p-4 rounded-2xl space-y-4 relative group hover:border-gray-300 transition-colors">
                 <div className="flex justify-between items-center border-b border-brand-border pb-3">
                   <SubjectBadge name={s.name} color={s.color} />
                   <button onClick={() => removeSubject(s.id)} className="text-xs text-danger hover:underline font-bold bg-danger/10 px-2 py-1 rounded-lg transition-colors hover:bg-danger hover:text-white">Remove</button>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Goal (Hrs/wk)</label>
                     <input 
                       type="number" min="1" max="40" 
                       value={s.weeklyGoalHrs}
                       onChange={e => updateSubject(s.id, { weeklyGoalHrs: parseInt(e.target.value) || 0 })}
                       className="w-full px-3 py-2 border border-brand-border bg-brand-surface rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-semibold shadow-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Exam Date</label>
                     <input 
                       type="date"
                       value={s.examDate || ''}
                       onChange={e => updateSubject(s.id, { examDate: e.target.value || undefined })}
                       className="w-full px-3 py-2 border border-brand-border bg-brand-surface rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-brand-text-primary font-semibold shadow-sm"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Reminder Date</label>
                     <input 
                       type="date"
                       value={s.examReminderDate || ''}
                       onChange={e => updateSubject(s.id, { examReminderDate: e.target.value || undefined })}
                       className="w-full px-3 py-2 border border-brand-border bg-brand-surface rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-brand-text-primary font-semibold shadow-sm"
                     />
                   </div>
                   <div className="col-span-2 space-y-1.5">
                     <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block">Exam Name (Optional)</label>
                     <input 
                       type="text"
                       placeholder="e.g., Midterms, Final Exam"
                       value={s.examName || ''}
                       onChange={e => updateSubject(s.id, { examName: e.target.value || undefined })}
                       className="w-full px-3 py-2 border border-brand-border bg-brand-surface rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-brand-text-primary font-semibold shadow-sm"
                     />
                   </div>
                 </div>
               </div>
             ))}
             {subjects.length === 0 && (
               <div className="text-center py-6 text-brand-text-secondary">No subjects added.</div>
             )}
           </div>

           <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 space-y-4">
             <input 
               type="text" placeholder="Subject Name" value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})}
               className="w-full px-4 py-2.5 border border-brand-border bg-brand-surface rounded-xl text-brand-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
             />
             <div className="flex gap-3">
               <input 
                 type="color" value={newSub.color} onChange={e => setNewSub({...newSub, color: e.target.value})}
                 className="w-12 h-[42px] p-1 border border-brand-border rounded-xl cursor-pointer bg-brand-surface shadow-sm"
               />
               <input 
                 type="number" placeholder="Weekly Hrs" value={newSub.weeklyGoalHrs} onChange={e => setNewSub({...newSub, weeklyGoalHrs: parseInt(e.target.value)})}
                 className="flex-1 w-24 px-4 py-2.5 border border-brand-border bg-brand-surface rounded-xl text-brand-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm"
               />
               <button onClick={handleAddSubject} className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-transform active:scale-95">Add</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
