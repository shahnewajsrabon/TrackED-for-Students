import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, Session } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import XPProgressRing from '@/components/XPProgressRing';
import BadgeGrid from '@/components/BadgeGrid';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import { Award, Clock } from 'lucide-react';
import { startOfYear, endOfYear } from 'date-fns';

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

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const uSnap = await getDoc(doc(db, 'users', id));
        if (!uSnap.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        setUserData(uSnap.data() as User);

        // Fetch user's sessions for heatmap
        const sessQ = query(collection(db, 'sessions'), where('user_id', '==', id));
        const sessSnap = await getDocs(sessQ);
        setSessions(sessSnap.docs.map(d => d.data() as Session));
      } catch (err) {
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <div className="h-screen flex"><LoadingSpinner /></div>;
  if (error || !userData) return <div className="h-screen flex items-center justify-center text-xl font-bold">{error}</div>;

  const lvlIndex = LEVEL_THRESHOLDS.findIndex(l => l.level === userData.level);
  const curLvl = LEVEL_THRESHOLDS[lvlIndex] || LEVEL_THRESHOLDS[0];
  const nextLvl = LEVEL_THRESHOLDS[lvlIndex + 1] || { min: Infinity };

  // Calculate stats
  const totalHrs = (sessions.reduce((a,b) => a + b.duration_mins, 0) / 60).toFixed(1);

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Profile Card */}
        <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border flex flex-col md:flex-row items-center gap-8 shadow-sm">
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
            <h1 className="text-4xl font-bold mb-2 text-brand-text-primary">{userData.display_name}</h1>
            <p className="text-brand-text-secondary font-medium mb-4">@{userData.username}</p>
            <div className="inline-flex items-center gap-2 bg-warning/10 text-warning px-5 py-2.5 rounded-2xl font-bold">
              <Award className="w-5 h-5 -mt-0.5" /> Level: {userData.level} ({userData.xp} XP)
            </div>
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-2xl font-bold">
              <Clock className="w-5 h-5 -mt-0.5" /> Total Study: {totalHrs} hrs
            </div>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-sm overflow-x-auto">
          <h2 className="text-xl font-bold mb-6 text-brand-text-primary">Study Consistency</h2>
          <HeatmapCalendar sessions={sessions} />
        </div>

        {/* Badges */}
        <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-sm">
           <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-text-primary"><Award className="w-5 h-5 text-primary" /> Earned Badges</h2>
           <BadgeGrid badges={userData.badges || []} />
        </div>

        <div className="text-center pt-8">
          <Link to="/" className="text-primary font-bold hover:underline">Join TrackEd today</Link>
        </div>

      </div>
    </div>
  );
}
