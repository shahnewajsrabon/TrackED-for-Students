import React, { useState, useEffect } from 'react';
import { FileQuestion, Clock } from 'lucide-react';

interface ExamTakingSessionProps {
  takingExam: any;
  user: any;
  onClose: () => void;
}

export default function ExamTakingSession({ takingExam, user, onClose }: ExamTakingSessionProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(takingExam.duration * 60);

  useEffect(() => {
    let timer: any;
    if (timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

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

    onClose();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
