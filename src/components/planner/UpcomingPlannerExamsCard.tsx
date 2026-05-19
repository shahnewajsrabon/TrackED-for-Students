import React from 'react';
import { Calendar, Plus, BookOpen, AlertCircle } from 'lucide-react';

interface UpcomingPlannerExamsCardProps {
  upcomingExams: any[];
  examTab: 'subject' | 'exam';
  setExamTab: (t: 'subject' | 'exam') => void;
  setNewTaskType: (t: 'task' | 'exam') => void;
  setShowAddForm: (v: boolean) => void;
}

export default function UpcomingPlannerExamsCard({
  upcomingExams,
  examTab,
  setExamTab,
  setNewTaskType,
  setShowAddForm
}: UpcomingPlannerExamsCardProps) {
  return (
    <div className="card-base p-6 lg:p-8 flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#3A82F6]" />
          <h3 className="font-bold text-lg text-brand-text-primary">Upcoming Exams</h3>
        </div>
        <button onClick={() => { setNewTaskType('exam'); setShowAddForm(true); }} className="text-brand-text-secondary hover:text-brand-text-primary p-2">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Toggles */}
      <div className="flex bg-brand-bg rounded-xl p-1 mb-6 border border-brand-border">
        <button 
          onClick={() => setExamTab('subject')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
            examTab === 'subject' 
              ? 'bg-brand-surface text-brand-text-primary shadow-sm border border-brand-border' 
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" /> SUBJECT WISE
        </button>
        <button 
          onClick={() => setExamTab('exam')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
            examTab === 'exam' 
              ? 'bg-brand-surface text-brand-text-primary shadow-sm border border-brand-border' 
              : 'text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Calendar className="w-4 h-4" /> DATE WISE
        </button>
      </div>

      <div className="space-y-4 flex-1">
        {upcomingExams.length === 0 ? (
          <div className="text-center py-8 text-brand-text-secondary font-medium text-sm flex flex-col items-center justify-center h-full gap-4">
            No upcoming exams. You're all caught up!
          </div>
        ) : (
          examTab === 'exam' ? 
          upcomingExams.map(exam => {
            const daysDiff = exam.due_date 
              ? Math.ceil((new Date(exam.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
              : 0;
            
            const isUrgent = daysDiff >= 0 && daysDiff <= 7;
            const isPast = daysDiff < 0;

            return (
              <div key={exam.id} className="group relative flex items-center gap-4 bg-brand-bg p-4 md:p-5 rounded-2xl border border-brand-border hover:border-primary/30 transition-all overflow-hidden">
                  {isUrgent && !isPast && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-danger"></div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isUrgent && !isPast ? 'bg-[#3A82F6] text-white shadow-md' : 'bg-brand-surface border border-brand-border text-[#3A82F6]'}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">{new Date(exam.due_date).toLocaleDateString([], { month: 'short' })}</div>
                    <div className="text-lg font-black leading-none">{new Date(exam.due_date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-text-primary truncate">{exam.title}</div>
                    <div className="text-[10px] text-brand-text-secondary font-bold mt-1 tracking-wider uppercase">
                      {exam.subjectName}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    {isPast ? (
                      <div className="text-xs font-bold text-brand-text-secondary uppercase">Past</div>
                    ) : isUrgent ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-danger mb-0.5" />
                        <div className="text-xl font-black text-danger leading-none -tracking-wide">{daysDiff}</div>
                        <div className="text-[9px] font-bold text-danger uppercase tracking-widest mt-0.5">Days</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xl font-black text-brand-text-primary leading-none -tracking-wide">{daysDiff}</div>
                        <div className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-widest mt-0.5">Days</div>
                      </>
                    )}
                  </div>
              </div>
            );
          }) :
          // Subject Wise Grouping
          <div className="space-y-6">
          {Array.from(new Set(upcomingExams.map(e => e.subjectName))).map((subjectName: any) => (
            <div key={subjectName as string} className="space-y-3">
              <h4 className="text-xs font-black text-brand-text-secondary uppercase tracking-widest ml-1">{subjectName as string}</h4>
              {upcomingExams.filter(e => e.subjectName === subjectName).map(exam => {
                const daysDiff = exam.due_date 
                  ? Math.ceil((new Date(exam.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                  : 0;
                const isPast = daysDiff < 0;

                return (
                  <div key={exam.id} className="flex items-center gap-3 bg-brand-bg p-3 px-4 rounded-xl border border-brand-border hover:border-primary/30 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-brand-text-primary truncate">{exam.title}</div>
                        <div className="text-[10px] text-brand-text-secondary font-bold uppercase tracking-widest mt-0.5">
                          {exam.due_date ? new Date(exam.due_date).toLocaleDateString() : 'No date'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {isPast ? (
                          <span className="text-[10px] font-bold text-brand-text-secondary uppercase bg-brand-surface px-2 py-1 rounded-md border border-brand-border">Past</span>
                        ) : (
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${daysDiff <= 7 ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-brand-surface text-brand-text-primary border border-brand-border'}`}>
                            {daysDiff} days
                          </span>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
