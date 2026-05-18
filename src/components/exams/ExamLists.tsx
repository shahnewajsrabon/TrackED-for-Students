import React from 'react';
import { Target, Clock, Play, Flame, Users, Share2, FileQuestion, Trophy, BarChart2 } from 'lucide-react';

interface ExamListsProps {
  activeTab: 'available' | 'created' | 'past';
  exams: any[];
  pastExams: any[];
  user: any;
  startExam: (exam: any) => void;
}

export default function ExamLists({ activeTab, exams, pastExams, user, startExam }: ExamListsProps) {
  if (activeTab === 'available') {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-black text-brand-text-primary mb-6">Available Exams</h2>
        {exams.filter(e => e.creator_id !== user?.uid).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
            <Target className="w-16 h-16 text-brand-text-secondary mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">No exams found</h3>
            <p className="text-brand-text-secondary font-medium">You don't have any pending exam invites. Enter a code to join one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {exams.filter(e => e.creator_id !== user?.uid).map(exam => (
              <div key={exam.id} className="bg-brand-bg rounded-2xl p-5 border border-brand-border hover:border-primary/50 transition-all flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{exam.type}</span>
                    <h3 className="font-bold text-lg text-brand-text-primary mt-2 flex items-center gap-2">
                       {exam.title}
                       {exam.isCompetition && <Flame className="w-4 h-4 text-warning" />}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-brand-text-secondary font-medium mt-1">
                       <Users className="w-3.5 h-3.5" /> By {exam.creator} • {exam.participants} joined
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-brand-border pt-4 mt-2">
                   <div className="flex gap-4 text-xs font-bold text-brand-text-secondary">
                     <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-warning" /> {exam.duration}m</div>
                     <div className="flex items-center gap-1"><Target className="w-4 h-4 text-success" /> {exam.marks} Marks</div>
                   </div>
                   <button onClick={() => startExam(exam)} className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 flex items-center gap-2 transition-all shadow-sm">
                     <Play className="w-4 h-4" /> Start
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'created') {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-black text-brand-text-primary mb-6">My Created Exams</h2>
        {exams.filter(e => e.creator_id === user?.uid).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
            <FileQuestion className="w-16 h-16 text-brand-text-secondary mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">You haven't created any exams yet</h3>
            <p className="text-brand-text-secondary font-medium">Create customized tests to challenge your peers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exams.filter(e => e.creator_id === user?.uid).map(exam => (
              <div key={exam.id} className="bg-brand-bg rounded-2xl p-5 border border-brand-border hover:border-brand-text-secondary/20 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-brand-text-secondary bg-brand-surface border border-brand-border px-2 py-0.5 rounded-md">{exam.type}</span>
                    <span className="text-xs font-bold text-brand-text-secondary">{new Date(exam.date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-brand-text-primary flex items-center gap-2">
                     {exam.title}
                     {exam.isCompetition && <Flame className="w-4 h-4 text-warning" />}
                  </h3>
                  <div className="text-xs font-bold text-brand-text-secondary mt-1">
                     {exam.duration} mins • {exam.marks} marks • {exam.questions} Questions
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                   <button className="flex-1 md:flex-none border border-brand-border bg-brand-surface text-brand-text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                     <Share2 className="w-4 h-4" /> Share
                   </button>
                   <button className="flex-1 md:flex-none bg-brand-surface text-brand-text-primary border border-brand-border px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                     Edit
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'past') {
    return (
      <div className="flex flex-col h-full">
        <h2 className="text-2xl font-black text-brand-text-primary mb-6">Past Results</h2>
        {pastExams.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
            <BarChart2 className="w-16 h-16 text-brand-text-secondary mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">No results yet</h3>
            <p className="text-brand-text-secondary font-medium">Take an exam to see your analytics and leaderboard standing.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pastExams.map(exam => (
              <div key={exam.id} className="bg-brand-bg rounded-2xl p-5 border border-brand-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-brand-surface border border-brand-border rounded-xl hidden sm:block">
                     <Trophy className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-brand-text-primary flex items-center gap-2">
                       {exam.title}
                       {exam.isCompetition && <Flame className="w-4 h-4 text-warning" />}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-brand-text-secondary font-bold mt-1">
                       <span>{new Date(exam.date).toLocaleDateString()}</span>
                       <span>{exam.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 md:gap-8 w-full md:w-auto bg-brand-surface md:bg-transparent p-3 md:p-0 rounded-xl border border-brand-border md:border-none">
                   <div className="flex flex-col text-center flex-1 md:flex-none">
                     <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">Score</span>
                     <span className="font-black text-lg text-primary">{exam.score}</span>
                   </div>
                   <div className="w-[1px] h-8 bg-brand-border md:hidden"></div>
                   <div className="flex flex-col text-center flex-1 md:flex-none">
                     <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest">Rank</span>
                     <span className="font-black text-lg text-brand-text-primary">{exam.rank}</span>
                   </div>
                   <button className="hidden md:flex ml-2 border border-brand-border bg-brand-surface text-brand-text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 items-center gap-2 transition-all">
                     Details
                   </button>
                </div>
                <button className="md:hidden w-full mt-2 border border-brand-border bg-brand-surface text-brand-text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-all">
                  View Analytics
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
