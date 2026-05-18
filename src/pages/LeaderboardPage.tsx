import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthContext } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Trophy, Clock } from 'lucide-react';
import { startOfWeek, endOfWeek, differenceInHours } from 'date-fns';

import { motion } from 'motion/react';

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaders = async () => {
      setLoading(true);
      
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const end = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      try {
        const sessQ = query(
          collection(db, 'sessions'),
          where('started_at', '>=', start),
          where('started_at', '<=', end)
        );
        const sessSnap = await getDocs(sessQ);

        const hoursMap: Record<string, number> = {};
        sessSnap.forEach(d => {
          const s = d.data();
          hoursMap[s.user_id] = (hoursMap[s.user_id] || 0) + s.duration_mins;
        });

        const userIds = Object.keys(hoursMap);
        
        if (userIds.length > 0) {
          const uQ = query(collection(db, 'users'), where('id', 'in', userIds));
          const uSnap = await getDocs(uQ);
          const userData = uSnap.docs.map(d => d.data());

          const lb = userData.map((u: any) => ({
            ...u,
            hours: (hoursMap[u.id] || 0) / 60
          })).sort((a,b) => b.hours - a.hours).slice(0, 50);

          setLeaders(lb);
        } else {
          setLeaders([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLeaders();
  }, []);

  if (loading) return <LoadingSpinner />;

  const myRankIndex = leaders.findIndex(l => l.id === user?.uid);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : '> 50';

  const resetHours = differenceInHours(endOfWeek(new Date(), { weekStartsOn: 1 }), new Date());

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto space-y-10 pb-12"
    >
      
      <div className="text-center space-y-4 pt-6">
        <div className="inline-flex items-center justify-center p-4 bg-warning/10 rounded-2xl text-warning mb-2 shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-brand-text-primary drop-shadow-sm">Global Leaderboard</h1>
        <p className="text-brand-text-secondary text-lg font-medium">Top 50 students this week by hours studied.</p>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="bg-brand-surface border border-brand-border px-6 py-3 rounded-2xl font-bold shadow-sm flex items-center gap-3">
            <span className="text-brand-text-secondary">Your Rank:</span> <strong className="text-primary text-xl">#{myRank}</strong>
          </div>
          <div className="bg-brand-surface border border-brand-border px-6 py-3 rounded-2xl font-bold shadow-sm flex items-center gap-3 text-brand-text-secondary">
            <Clock className="w-5 h-5 text-gray-400" /> <span>Resets in {resetHours}h</span>
          </div>
        </div>
      </div>

      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-bg border-b border-brand-border">
                <th className="py-6 px-8 font-black text-xs uppercase tracking-widest text-brand-text-secondary w-24 text-center">Rank</th>
                <th className="py-6 px-8 font-black text-xs uppercase tracking-widest text-brand-text-secondary">Student</th>
                <th className="py-6 px-8 font-black text-xs uppercase tracking-widest text-brand-text-secondary w-32 text-right">Level</th>
                <th className="py-6 px-8 font-black text-xs uppercase tracking-widest text-brand-text-secondary w-32 text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l, i) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={l.id} 
                  className={`border-b border-brand-border/50 last:border-0 hover:bg-brand-bg transition-colors ${l.id === user?.uid ? 'bg-primary/5 hover:bg-primary/10' : ''}`}
                >
                  <td className="py-5 px-8 text-center">
                    {i === 0 ? <span className="text-3xl drop-shadow-sm">🥇</span> : 
                     i === 1 ? <span className="text-3xl drop-shadow-sm">🥈</span> : 
                     i === 2 ? <span className="text-3xl drop-shadow-sm">🥉</span> : 
                     <span className="font-black text-brand-text-secondary text-lg">#{i + 1}</span>}
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0 text-xl shadow-inner">
                        {l.avatar_url ? <img src={l.avatar_url} className="w-full h-full rounded-2xl object-cover" /> : l.display_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-bold text-lg ${l.id === user?.uid ? 'text-primary' : 'text-brand-text-primary'}`}>{l.display_name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right font-black text-brand-text-secondary">
                    {l.level}
                  </td>
                  <td className="py-5 px-8 text-right">
                    <span className="font-black text-xl text-brand-text-primary bg-brand-bg px-3 py-1 rounded-md border border-brand-border">{l.hours.toFixed(1)}</span>
                  </td>
                </motion.tr>
              ))}
              {leaders.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-brand-text-secondary font-medium text-lg">
                    No study sessions recorded this week yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </motion.div>
  );
}
