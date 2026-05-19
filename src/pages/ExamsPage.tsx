import React, { useState, useEffect } from 'react';
import { FileQuestion, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

import ExamTakingSession from '@/components/exams/ExamTakingSession';
import CreateExamModal from '@/components/exams/CreateExamModal';
import ExamLists from '@/components/exams/ExamLists';

export default function ExamsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'created' | 'past'>('available');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [exams, setExams] = useState<any[]>([]);
  const [pastExams, setPastExams] = useState<any[]>([]);
  const [takingExam, setTakingExam] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    const q = query(collection(db, 'exams'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetchedExams = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(fetchedExams);
      setLoading(false);
    });

    const pastQ = query(collection(db, 'exam_participants'), where('user_id', '==', user.uid), orderBy('submitted_at', 'desc'));
    const unsubscribePast = onSnapshot(pastQ, (snap) => {
      const fetchedPast = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPastExams(fetchedPast);
    });

    return () => {
      unsubscribe();
      unsubscribePast();
    };
  }, [user]);

  const startExam = (exam: any) => {
    setTakingExam(exam);
  };

  const deleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (takingExam) {
    return <ExamTakingSession takingExam={takingExam} user={user} onClose={() => setTakingExam(null)} />;
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-8 h-full flex flex-col relative">
      {showCreateForm && (
        <CreateExamModal user={user} onClose={() => setShowCreateForm(false)} />
      )}

      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-text-primary flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-sm inline-flex">
            <FileQuestion className="w-8 h-8" />
          </div>
          Exams & Competitions
        </h1>
        <p className="text-brand-text-secondary font-medium mt-3 text-base md:text-lg max-w-2xl">
          Create custom exams, challenge your friends, and climb the leaderboard.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column: Menu and Controls */}
        <div className="md:w-64 shrink-0 flex flex-col gap-4">
          <button onClick={() => setShowCreateForm(true)} className="bg-primary text-white py-3.5 px-6 rounded-2xl font-bold shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" />
            Create Exam
          </button>
          
          <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm flex flex-col mt-4">
            <button 
              onClick={() => setActiveTab('available')}
              className={`text-left px-5 py-4 font-bold text-sm transition-all border-l-4 ${activeTab === 'available' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-brand-text-secondary hover:bg-gray-50'}`}
            >
              Available & Shared
            </button>
            <div className="h-[1px] bg-brand-border w-full"></div>
            <button 
              onClick={() => setActiveTab('created')}
              className={`text-left px-5 py-4 font-bold text-sm transition-all border-l-4 ${activeTab === 'created' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-brand-text-secondary hover:bg-gray-50'}`}
            >
              My Created Exams
            </button>
            <div className="h-[1px] bg-brand-border w-full"></div>
            <button 
              onClick={() => setActiveTab('past')}
              className={`text-left px-5 py-4 font-bold text-sm transition-all border-l-4 ${activeTab === 'past' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent text-brand-text-secondary hover:bg-gray-50'}`}
            >
              Past Results
            </button>
          </div>

          <div className="mt-4 p-5 bg-brand-bg rounded-2xl border border-brand-border">
             <h3 className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary mb-3">Join with Code</h3>
             <div className="flex gap-2">
               <input type="text" placeholder="e.g. EXAM-123" className="w-full" />
               <button className="bg-brand-surface text-brand-text-primary px-4 border border-brand-border rounded-xl font-bold hover:bg-gray-100 transition-colors">
                 Join
               </button>
             </div>
          </div>
        </div>

        {/* Right column: Main Content Area */}
        <div className="flex-1">
          <div className="card-base p-8 min-h-[400px] flex flex-col bg-brand-surface">
            <ExamLists 
              activeTab={activeTab} 
              exams={exams} 
              pastExams={pastExams} 
              user={user} 
              startExam={startExam} 
              deleteExam={deleteExam}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
