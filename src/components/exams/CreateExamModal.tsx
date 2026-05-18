import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileQuestion, Plus, X, Flame, Wand2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useSubjects } from '@/hooks/useSubjects';

interface CreateExamModalProps {
  user: any;
  onClose: () => void;
}

export default function CreateExamModal({ user, onClose }: CreateExamModalProps) {
  const { subjects } = useSubjects();
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newQuestions, setNewQuestions] = useState<any[]>([{ text: '', options: ['', '', '', ''], correctOption: 0 }]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    type: 'MCQ',
    duration: 60,
    marks: 50,
    negativeMarking: 0.25,
    isCompetition: true
  });

  const handleCreateStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStep(2);
  };

  const handleCreateExam = async () => {
    if (!user) return;
    try {
      const publicQuestions = newQuestions.map(q => ({
        text: q.text,
        options: q.options
      }));
      
      const correctAnswers = newQuestions.map(q => q.correctOption);
      const examDocId = doc(collection(db, 'exams')).id;

      await setDoc(doc(db, 'exams', examDocId), {
        title: newExam.title,
        subject: newExam.subject,
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

      await setDoc(doc(db, 'exam_keys', examDocId), {
        answers: correctAnswers,
        creator_id: user.uid
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating exam:", error);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview',
          contents: `Generate a list of exactly ${Math.min(5, newExam.marks || 5)} Multiple Choice Questions (MCQ) based on the following material. Make them concise and clear.\n\nMaterial:\n${aiPrompt}`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING", description: 'The question text' },
                  options: { 
                    type: "ARRAY", 
                    items: { type: "STRING" },
                    description: 'Exactly 4 options for the answer'
                  },
                  correctOption: { 
                    type: "INTEGER", 
                    description: 'The index of the correct option (0-3)' 
                  }
                },
                required: ['text', 'options', 'correctOption']
              }
            }
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      const text = data.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && parsed.length > 0) {
           setNewQuestions(parsed);
           setShowAiModal(false);
           setAiPrompt('');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-base w-full max-w-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-text-primary">
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
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-text-secondary uppercase">Subject</label>
              <select 
                required 
                value={newExam.subject} 
                onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
              >
                <option value="" disabled>Select Subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="general">General / Other</option>
              </select>
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
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="flex-1 bg-primary/10 text-primary border-2 border-dashed border-primary/20 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
              >
                <Wand2 className="w-5 h-5" /> Generate Questions with AI
              </button>
              <button
                type="button"
                onClick={() => setNewQuestions([...newQuestions, { text: '', options: ['', '', '', ''], correctOption: 0 }])}
                className="flex-1 bg-brand-surface border-2 border-dashed border-brand-border text-brand-text-primary py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" /> Add Another Question
              </button>
            </div>

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
        
        <AnimatePresence>
          {showAiModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-surface/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-brand-bg md:w-[600px] w-full rounded-3xl p-8 border border-brand-border shadow-2xl relative"
              >
                <button onClick={() => setShowAiModal(false)} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-text-primary bg-brand-surface rounded-full p-1 border border-brand-border h-8 w-8 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-black text-brand-text-primary mb-2 flex items-center gap-2">
                   <Wand2 className="w-6 h-6 text-primary" /> AI Magic Generator
                </h2>
                <p className="text-sm font-medium text-brand-text-secondary mb-6">
                  Paste your study notes, textbook excerpts, or any text below. 
                  Our AI will instantly generate up to {Math.min(5, newExam.marks || 5)} MCQs based on the content.
                </p>
                
                <textarea
                  placeholder="Paste your material here..."
                  className="w-full h-48 resize-none p-4 font-medium mb-6 bg-brand-surface rounded-xl border border-brand-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGenerating}
                />

                <button
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>Generating Questions... Please wait</>
                  ) : (
                    <><Wand2 className="w-5 h-5" /> Generate MCQs</>
                  )}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
