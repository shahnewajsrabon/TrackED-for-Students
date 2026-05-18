import React, { useMemo } from 'react';
import { format, subDays, startOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Session } from '@/types';

interface HeatmapProps {
  sessions: Session[];
}

export default function HeatmapCalendar({ sessions }: HeatmapProps) {
  const weeks = 52;
  const daysInYear = weeks * 7;
  
  const today = new Date();
  const startDate = startOfWeek(subDays(today, daysInYear - 1), { weekStartsOn: 0 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today });
  }, [startDate, today]);

  const intensityMap = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach(s => {
      const dateKey = format(new Date(s.started_at), 'yyyy-MM-dd');
      map.set(dateKey, (map.get(dateKey) || 0) + s.duration_mins);
    });
    return map;
  }, [sessions]);

  const getColorClass = (mins: number) => {
    if (mins === 0) return 'bg-brand-border/50 dark:bg-brand-border';
    if (mins < 60) return 'bg-primary/20';
    if (mins < 120) return 'bg-primary/50';
    if (mins < 180) return 'bg-primary/80';
    return 'bg-primary';
  };

  // Group by weeks
  const weeksArray = [];
  for (let i = 0; i < days.length; i += 7) {
    weeksArray.push(days.slice(i, i + 7));
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-max flex gap-[3px]">
        {weeksArray.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dIndex) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const mins = intensityMap.get(dateKey) || 0;
              const hrs = (mins / 60).toFixed(1);
              
              return (
                <div 
                  key={dIndex}
                  className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-150 hover:bg-brand-text-primary cursor-pointer relative group ${getColorClass(mins)}`}
                >
                  <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-brand-text-primary text-brand-bg font-bold tracking-widest uppercase text-[10px] py-1 px-2 rounded-2xl whitespace-nowrap z-10 pointer-events-none transition-opacity shadow-lg backdrop-blur-md">
                    {format(day, 'MMM d, yyyy')}: {hrs} hrs
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 mt-6 text-[10px] uppercase tracking-widest font-bold text-brand-text-secondary">
        <span>Less</span>
        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(0)}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(30)}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(90)}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(150)}`} />
        <div className={`w-2.5 h-2.5 rounded-full ${getColorClass(200)}`} />
        <span>More</span>
      </div>
    </div>
  );
}
