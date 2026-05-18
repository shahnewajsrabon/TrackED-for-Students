import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/hooks/useSession';
import { Session } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatCard from '@/components/StatCard';
import AdBanner from '@/components/AdBanner';
import AIInsights from '@/components/AIInsights';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

type Range = 'Today' | 'This Week' | 'This Month' | 'Last 3 Months' | 'All Time';

export default function AnalyticsPage() {
  const { getSessionsByDateRange, loading: sessionsLoading } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [range, setRange] = useState<Range>('This Week');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let days = 7;
    if (range === 'Today') days = 0;
    else if (range === 'This Month') days = 30;
    else if (range === 'Last 3 Months') days = 90;
    else if (range === 'All Time') days = 3650; // practically all time
    
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days));
    
    setLoading(true);
    getSessionsByDateRange(start.toISOString(), end.toISOString())
      .then(data => setSessions(data))
      .finally(() => setLoading(false));
  }, [range, getSessionsByDateRange]);

  const stats = useMemo(() => {
    const totalMins = sessions.reduce((acc, s) => acc + s.duration_mins, 0);
    const totalHrs = (totalMins / 60).toFixed(1);
    const avgLen = sessions.length ? Math.round(totalMins / sessions.length) : 0;
    const totalXp = sessions.reduce((acc, s) => acc + s.xp_earned, 0);

    const dayCounts = [0,0,0,0,0,0,0]; // Sun-Sat
    const hourCounts = new Array(24).fill(0);
    const subjectMins: Record<string, number> = {};

    sessions.forEach(s => {
      const d = new Date(s.started_at);
      dayCounts[d.getDay()]++;
      hourCounts[d.getHours()]++;
      subjectMins[s.subject_name] = (subjectMins[s.subject_name] || 0) + s.duration_mins;
    });

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mostProductiveDay = sessions.length > 0 ? daysOfWeek[dayCounts.indexOf(Math.max(...dayCounts))] : 'N/A';
    const peakHour = sessions.length > 0 ? `${hourCounts.indexOf(Math.max(...hourCounts))}:00` : 'N/A';

    // Balance score
    const subValues = Object.values(subjectMins);
    let balanceScore = 0;
    if (subValues.length > 1) {
       const mean = totalMins / subValues.length;
       const variance = subValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / subValues.length;
       const stdDev = Math.sqrt(variance);
       balanceScore = Math.max(0, Math.round((1 - (stdDev / mean)) * 100));
    } else if (subValues.length === 1) {
       balanceScore = 10; // Highly unbalanced if only 1 subject
    }

    return { totalHrs, avgLen, mostProductiveDay, peakHour, totalXp, subjectMins, hourCounts, balanceScore };
  }, [sessions]);

  // Chart Data format
  const hourChartData = stats.hourCounts.map((count, i) => ({ hour: `${i}:00`, count }));
  const subjectChartData = Object.entries(stats.subjectMins)
    .map(([name, mins]) => ({ name, value: Number((mins / 60).toFixed(1)) }))
    .sort((a,b) => b.value - a.value);

  const exportCSV = () => {
    const headers = ['Subject', 'Duration (mins)', 'Focus Rating', 'Mood', 'Note', 'XP', 'Started At'];
    const rows = sessions.map(s => [
      s.subject_name, s.duration_mins, s.focus_rating, s.mood, 
      `"${(s.note||'').replace(/"/g, '""')}"`, s.xp_earned, s.started_at
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trackeD_sessions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const lowerQuery = searchQuery.toLowerCase();
    return sessions.filter(s => 
      s.subject_name.toLowerCase().includes(lowerQuery) ||
      (s.note && s.note.toLowerCase().includes(lowerQuery)) ||
      (s.mood && s.mood.toLowerCase().includes(lowerQuery))
    );
  }, [sessions, searchQuery]);

  if (loading || sessionsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-brand-text-secondary">Insights to optimize your learning.</p>
        </div>
        <button onClick={exportCSV} className="bg-brand-surface border border-brand-border px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          Export CSV
        </button>
      </div>

      <div className="flex bg-brand-bg border border-brand-border p-1 rounded-2xl w-fit overflow-x-auto max-w-full">
        {(['Today', 'This Week', 'This Month', 'Last 3 Months', 'All Time'] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${range === r ? 'bg-brand-surface shadow-sm text-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Hours" value={stats.totalHrs} />
        <StatCard label="Avg Session" value={`${stats.avgLen}m`} />
        <StatCard label="Best Day" value={stats.mostProductiveDay} />
        <StatCard label="Peak Hour" value={stats.peakHour} />
        <StatCard label="XP Earned" value={stats.totalXp} />
      </div>

      <div className="mt-8 mb-8">
        <AIInsights stats={stats} sessions={sessions} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-brand-surface shadow hover:shadow-md transition-shadow p-6 rounded-2xl border border-brand-border">
          <h2 className="text-lg font-bold mb-6 text-brand-text-primary">Subject Distribution (Hours)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8E6E0" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#534AB7" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-brand-surface shadow hover:shadow-md transition-shadow p-6 rounded-2xl border border-brand-border flex flex-col items-center justify-center text-center relative overflow-hidden">
           <h2 className="text-lg font-bold mb-2 z-10 text-brand-text-primary">Balance Score</h2>
           <div className={`text-6xl font-black mb-2 z-10 ${stats.balanceScore > 70 ? 'text-success' : stats.balanceScore > 40 ? 'text-warning' : 'text-danger'}`}>
             {stats.balanceScore}
           </div>
           <div className="text-sm font-medium px-4 py-1.5 rounded-full bg-brand-bg border border-brand-border z-10 mb-4 shadow-sm">
             {stats.balanceScore > 70 ? 'Highly Balanced' : stats.balanceScore > 40 ? 'Fairly Balanced' : 'Unbalanced'}
           </div>
           <p className="text-xs text-brand-text-secondary max-w-[200px] z-10">
             A higher score means you are distributing your time evenly across subjects.
           </p>
           
           {/* Abstract shapes for design */}
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />
           <div className="absolute -top-10 -left-10 w-32 h-32 bg-warning/5 rounded-full blur-2xl" />
        </div>
      </div>

       <div className="bg-brand-surface shadow hover:shadow-md transition-shadow p-6 rounded-2xl border border-brand-border">
          <h2 className="text-lg font-bold mb-6 text-brand-text-primary">Activity by Time of Day</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E6E0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickMargin={10} minTickGap={20} />
                <YAxis hide />
                <Tooltip cursor={{ stroke: '#E8E6E0', strokeWidth: 2 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="#1D9E75" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#1D9E75', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

      <div className="bg-brand-surface shadow hover:shadow-md transition-shadow p-6 rounded-2xl border border-brand-border">
        <div className="flex flex-col md:flex-row justify-between items-start flex-wrap gap-4 mb-6">
          <h2 className="text-lg font-bold text-brand-text-primary">Study Journal</h2>
          <input 
            type="text" 
            placeholder="Search notes, subjects, mood..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 px-5 py-2.5 border border-brand-border rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        
        {filteredSessions.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSessions.map(session => (
              <div key={session.id} className="bg-brand-bg rounded-2xl p-4 border border-brand-border">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-md text-white" style={{ backgroundColor: session.subject_color || '#534AB7' }}>
                      {session.subject_name}
                    </span>
                    <span className="text-xs text-brand-text-secondary font-medium">
                      {format(new Date(session.started_at), 'MMM d, yyyy • h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold bg-white border border-brand-border px-2 py-0.5 rounded-full shadow-sm">{session.duration_mins}m</span>
                    <span className="flex items-center text-warning font-black text-sm">
                      {session.focus_rating} <span className="text-lg leading-none ml-0.5">★</span>
                    </span>
                  </div>
                </div>
                {session.mood && (
                  <div className="mb-2">
                    <span className="text-xs bg-white border border-brand-border px-2 py-1 rounded-md font-medium text-brand-text-secondary">
                      Mood: {session.mood}
                    </span>
                  </div>
                )}
                {session.note && (
                  <p className="text-sm text-brand-text-primary mt-2 italic border-l-2 border-primary/30 pl-3 py-1">
                    "{session.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-brand-text-secondary text-sm">
             No sessions found. Try a different search or log a new session.
          </div>
        )}
      </div>
      
      <AdBanner />
    </div>
  );
}
