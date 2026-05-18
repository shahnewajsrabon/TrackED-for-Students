import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, Plus, Share2, Trophy, Clock, Target, Play, BarChart2, X, Users, Flame } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, getDocs, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ExamsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'created' | 'past'>('available');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newQuestions, setNewQuestions] = useState<any[]>([{ text: '', options: ['', '', '', ''], correctOption: 0 }]);

  const [exams, setExams] = useState<any[]>([]);
  const [pastExams, setPastExams] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user) return;
    
    // Fetch exams
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

  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    type: 'MCQ',
    duration: 60,
    marks: 50,
    negativeMarking: 0.25,
    isCompetition: true
  });

  const [takingExam, setTakingExam] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let timer: any;
    if (takingExam && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (takingExam && timeLeft === 0) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [takingExam, timeLeft]);

  const startExam = (exam: any) => {
    setTakingExam(exam);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setTimeLeft(exam.duration * 60);
  };

  const handleSubmitExam = async () => {
    if (!user || !takingExam) return;

    try {
      const response = await fetch('/api/exams/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: takingExam.id,
          userId: user.uid,
          answers: answers
        })
      });
      const data = await response.json();

      if (response.ok) {
        alert(`Exam Submitted! Your raw score is: ${data.score}`);
      } else {
        alert(data.error || 'Failed to submit exam');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting exam.');
    }

    setTakingExam(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCreateStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStep(2);
  };

  const handleCreateExam = async () => {
    if (!user) return;
    try {
      // Create bare questions without answers for public access
      const publicQuestions = newQuestions.map(q => ({
        text: q.text,
        options: q.options
      }));
      
      const correctAnswers = newQuestions.map(q => q.correctOption);

      const examDocId = doc(collection(db, 'exams')).id;

      // Write exam to public collection
      await setDoc(doc(db, 'exams', examDocId), {
        title: newExam.title,
        type: newExam.type,
        duration: newExam.duration,
        questions: newQuestions.length,
        marks: newExam.marks,
        negativeMarking: newExam.negativeMarking,
        creator_id: user.uid,
        creator: user.displayName || 'Anonymous',
        participants: 0,
        isCompetition: newExam.isCompetition,
        date: new Date().toISOString(),
        questionList: publicQuestions
      });

      // Write secure keys (could use doc() if we extract the ID properly)
      await setDoc(doc(db, 'exam_keys', examDocId), {
        answers: correctAnswers
      });
      
      setShowCreateForm(false);
      setCreateStep(1);
      setNewQuestions([{ text: '', options: ['', '', '', ''], correctOption: 0 }]);
      setNewExam({ ...newExam, title: '' });
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (takingExam) {
    const currentQ = takingExam.questionList?.[currentQuestionIdx] || { text: 'Question missing', options: [] };
    
    return (
      <div className="fixed inset-0 z-[200] bg-brand-surface flex flex-col">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-brand-border bg-brand-bg shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="font-black text-brand-text-primary text-xl flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-primary" /> {takingExam.title}
            </h1>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{takingExam.type}</span>
          </div>
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timeLeft < 300 ? 'text-danger animate-pulse' : 'text-brand-text-primary'}`}>
               <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmitExam} className="bg-success text-white px-5 py-2 rounded-xl font-bold hover:bg-success/90 shadow-sm transition-all">
              Submit Exam
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar / Question Palette */}
          <div className="w-64 border-r border-brand-border bg-brand-bg p-4 flex flex-col">
             <h3 className="font-bold text-brand-text-secondary text-xs uppercase tracking-widest mb-4">Question Palette</h3>
             <div className="grid grid-cols-4 gap-2">
               {(takingExam.questionList || []).map((_: any, idx: number) => (
                 <button
                   key={idx}
                   onClick={() => setCurrentQuestionIdx(idx)}
                   className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center border-2 transition-all ${
                     currentQuestionIdx === idx ? 'border-primary ring-2 ring-primary/30 ring-offset-2' :
                     answers[idx] !== undefined ? 'bg-primary/10 border-primary text-primary' :
                     'bg-brand-surface border-brand-border text-brand-text-secondary hover:border-gray-300'
                   }`}
                 >
                   {idx + 1}
                 </button>
               ))}
             </div>
             
             <div className="mt-auto space-y-2 pt-4 border-t border-brand-border">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-text-secondary">
                  <div className="w-3 h-3 rounded-full bg-primary/10 border-2 border-primary"></div> Answered
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-brand-text-secondary">
                  <div className="w-3 h-3 rounded-full bg-brand-surface border-2 border-brand-border"></div> Not Visited
                </div>
             </div>
          </div>

          {/* Main Question Area */}
          <div className="flex-1 overflow-y-auto p-8 relative">
             <div className="max-w-3xl mx-auto">
               <div className="mb-8">
                 <h2 className="text-sm font-bold text-brand-text-secondary uppercase tracking-widest mb-2">Question {currentQuestionIdx + 1} of {takingExam.questionList?.length || 0}</h2>
                 <p className="text-2xl font-medium text-brand-text-primary leading-snug">{currentQ.text}</p>
               </div>

               {takingExam.type === 'MCQ' ? (
                 <div className="space-y-3">
                   {(currentQ.options || []).map((opt: string, optIdx: number) => (
                     <button
                       key={optIdx}
                       onClick={() => setAnswers(prev => ({ ...prev, [currentQuestionIdx]: optIdx }))}
                       className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all flex items-center gap-4 ${
                         answers[currentQuestionIdx] === optIdx 
                           ? 'bg-primary/5 border-primary text-primary'
                           : 'bg-brand-surface border-brand-border hover:border-primary/40 text-brand-text-primary'
                       }`}
                     >
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestionIdx] === optIdx ? 'border-primary' : 'border-gray-300'}`}>
                          {answers[currentQuestionIdx] === optIdx && <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>}
                       </div>
                       {opt}
                     </button>
                   ))}
                 </div>
               ) : (
                 <textarea 
                   className="w-full h-48 resize-none p-4 text-base"
                   placeholder="Type your answer here..."
                   value={answers[currentQuestionIdx] || ''}
                   onChange={e => setAnswers(prev => ({ ...prev, [currentQuestionIdx]: e.target.value as any }))}
                 />
               )}

               <div className="mt-12 flex justify-between items-center border-t border-brand-border pt-6">
                 <button 
                   onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
                   disabled={currentQuestionIdx === 0}
                   className="px-6 py-2.5 rounded-xl font-bold bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-gray-50 disabled:opacity-50 transition-all font-mono"
                 >
                   &larr; Previous
                 </button>
                 
                 {currentQuestionIdx < (takingExam.questionList?.length || 0) - 1 ? (
                   <button 
                     onClick={() => setCurrentQuestionIdx(prev => Math.min((takingExam.questionList?.length || 0) - 1, prev + 1))}
                     className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-sm transition-all"
                   >
                     Next &rarr;
                   </button>
                 ) : null}
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-8 h-full flex flex-col relative">
      {showCreateForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-base w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateForm(false)} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-text-primary">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-brand-text-primary mb-6 flex items-center gap-3">
              <Plus className="w-6 h-6 text-primary" /> {createStep === 1 ? 'Create Exam' : 'Add Questions'}
            </h2>
            
            {createStep === 1 ? (
              <form onSubmit={handleCreateStep1} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-brand-text-secondary uppercase">Exam Title</label>
                  <input
                    required
                    type="text"
                    value={newExam.title}
                    onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                    placeholder="e.g. Weekly Physics Test"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-text-secondary uppercase">Type</label>
                    <select value={newExam.type} onChange={e => setNewExam({ ...newExam, type: e.target.value })}>
                      <option value="MCQ">MCQ</option>
                      <option value="Written">Written</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-text-secondary uppercase">Duration (mins)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newExam.duration}
                      onChange={e => setNewExam({ ...newExam, duration: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-text-secondary uppercase">Total Marks</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newExam.marks}
                      onChange={e => setNewExam({ ...newExam, marks: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-brand-text-secondary uppercase">Negative Marking</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 0.25 for BUET"
                      value={newExam.negativeMarking}
                      onChange={e => setNewExam({ ...newExam, negativeMarking: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-brand-surface p-4 rounded-xl border border-brand-border">
                  <input
                    type="checkbox"
                    id="competition-mode"
                    checked={newExam.isCompetition}
                    onChange={e => setNewExam({ ...newExam, isCompetition: e.target.checked })}
                    className="w-5 h-5 accent-primary"
                  />
                  <div className="flex flex-col">
                     <label htmlFor="competition-mode" className="font-bold text-sm text-brand-text-primary flex items-center gap-2">
                       <Flame className="w-4 h-4 text-warning" /> Competition Mode
                     </label>
                     <span className="text-xs text-brand-text-secondary mt-0.5">Enable real-time leaderboard scoring and time-based rankings.</span>
                  </div>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md mt-4">
                  Continue to Questions
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="space-y-6">
                  {newQuestions.map((q, idx) => (
                    <div key={idx} className="bg-brand-surface p-5 rounded-xl border border-brand-border">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-brand-text-primary text-sm">Question {idx + 1}</h3>
                         {newQuestions.length > 1 && (
                           <button onClick={() => setNewQuestions(newQuestions.filter((_, i) => i !== idx))} className="text-danger hover:underline text-xs font-bold">Remove</button>
                         )}
                      </div>
                      <input
                        className="w-full mb-4"
                        placeholder="Type question here..."
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...newQuestions];
                          updated[idx].text = e.target.value;
                          setNewQuestions(updated);
                        }}
                      />
                      {newExam.type === 'MCQ' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {q.options.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-3 bg-brand-bg px-3 py-2 rounded-lg border border-brand-border">
                              <input 
                                type="radio" 
                                name={`correct-${idx}`} 
                                checked={q.correctOption === optIdx}
                                onChange={() => {
                                  const updated = [...newQuestions];
                                  updated[idx].correctOption = optIdx;
                                  setNewQuestions(updated);
                                }}
                                className="w-4 h-4 accent-success shrink-0"
                              />
                              <input 
                                className="bg-transparent border-none text-sm focus:outline-none w-full"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const updated = [...newQuestions];
                                  updated[idx].options[optIdx] = e.target.value;
                                  setNewQuestions(updated);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={() => setNewQuestions([...newQuestions, { text: '', options: ['', '', '', ''], correctOption: 0 }])}
                  className="w-full bg-brand-surface border-2 border-dashed border-brand-border text-brand-text-primary py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-5 h-5" /> Add Another Question
                </button>

                <div className="flex gap-4 mt-2">
                  <button onClick={() => setCreateStep(1)} className="flex-1 bg-brand-surface text-brand-text-primary py-3.5 rounded-xl font-bold border border-brand-border hover:bg-gray-50 transition-all">
                    Back
                  </button>
                  <button onClick={handleCreateExam} className="flex-[2] bg-success text-white py-3.5 rounded-xl font-bold hover:bg-success/90 transition-all shadow-md flex justify-center items-center gap-2">
                    <FileQuestion className="w-5 h-5" /> Publish Exam
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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
            {activeTab === 'available' && (
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
            )}
            
            {activeTab === 'created' && (
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
            )}

            {activeTab === 'past' && (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
