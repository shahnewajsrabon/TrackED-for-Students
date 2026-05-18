import React, { useState } from 'react';
import { useSubjects } from '@/hooks/useSubjects';
import { SyllabusTopic } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import SubjectBadge from '@/components/SubjectBadge';
import { BookOpen, Plus, Check, Circle, Trash2, ChevronDown, Clock, Edit2, X, ListPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SyllabusPage() {
  const { subjects, loading, updateSubject } = useSubjects();
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  
  // Bulk Add State
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Edit State
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (loading) return <LoadingSpinner />;

  const activeSubject = subjects.find(s => s.id === selectedSubId) || subjects[0];

  const handleAddTopic = async () => {
    if (!activeSubject || !newTopicTitle.trim()) return;
    const newTopic: SyllabusTopic = {
      id: crypto.randomUUID(),
      title: newTopicTitle.trim(),
      status: 'not_started'
    };
    
    const updatedSyllabus = [...(activeSubject.syllabus || []), newTopic];
    await updateSubject(activeSubject.id, { syllabus: updatedSyllabus });
    setNewTopicTitle('');
  };

  const handleBulkAdd = async () => {
    if (!activeSubject || !bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newTopics: SyllabusTopic[] = lines.map(line => ({
      id: crypto.randomUUID(),
      title: line,
      status: 'not_started'
    }));

    const updatedSyllabus = [...(activeSubject.syllabus || []), ...newTopics];
    await updateSubject(activeSubject.id, { syllabus: updatedSyllabus });
    setBulkText('');
    setShowBulkAdd(false);
  };

  const handleToggleTopic = async (topicId: string, currentStatus: string) => {
    if (!activeSubject) return;
    let nextStatus: SyllabusTopic['status'] = 'not_started';
    if (currentStatus === 'not_started') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';

    const updatedSyllabus = (activeSubject.syllabus || []).map(t => 
      t.id === topicId ? { ...t, status: nextStatus } : t
    );
    await updateSubject(activeSubject.id, { syllabus: updatedSyllabus });
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!activeSubject) return;
    const updatedSyllabus = (activeSubject.syllabus || []).filter(t => t.id !== topicId);
    await updateSubject(activeSubject.id, { syllabus: updatedSyllabus });
  };

  const startEditing = (topic: SyllabusTopic) => {
    setEditingTopicId(topic.id);
    setEditTitle(topic.title);
  };

  const saveEdit = async () => {
    if (!activeSubject || !editingTopicId) return;
    
    if (!editTitle.trim()) {
      setEditingTopicId(null);
      return;
    }

    const updatedSyllabus = (activeSubject.syllabus || []).map(t => 
      t.id === editingTopicId ? { ...t, title: editTitle.trim() } : t
    );
    await updateSubject(activeSubject.id, { syllabus: updatedSyllabus });
    setEditingTopicId(null);
    setEditTitle('');
  };

  const calculateProgress = (syllabus?: SyllabusTopic[]) => {
    if (!syllabus || syllabus.length === 0) return 0;
    const completed = syllabus.filter(t => t.status === 'completed').length;
    const inProgress = syllabus.filter(t => t.status === 'in_progress').length;
    const score = completed + (inProgress * 0.5);
    return Math.round((score / syllabus.length) * 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-10 relative"
    >
      {/* Bulk Add Modal */}
      {showBulkAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-base w-full max-w-lg p-8 relative">
            <button onClick={() => setShowBulkAdd(false)} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-text-primary p-2">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-brand-text-primary mb-2 flex items-center gap-3">
              <ListPlus className="w-6 h-6 text-primary" />
              Bulk Add Topics
            </h2>
            <p className="text-brand-text-secondary font-medium mb-6 text-sm">Paste your syllabus topics here, each on a new line.</p>
            <textarea
              className="h-48 resize-none mb-4 font-mono text-sm"
              placeholder="Chapter 1: Introduction&#10;Chapter 2: Kinematics&#10;Chapter 3: Dynamics"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowBulkAdd(false)} className="px-5 py-2.5 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 text-brand-text-primary">
                Cancel
              </button>
              <button onClick={handleBulkAdd} disabled={!bulkText.trim()} className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
                Add Topics
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-base p-8 md:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 text-brand-text-primary drop-shadow-sm">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            Syllabus
          </h1>
          <p className="text-brand-text-secondary font-medium mt-2 text-lg">Break down your subjects and track progress.</p>
        </div>
        
        {subjects.length > 0 && (
          <div className="relative min-w-[240px]">
            <select 
              className="w-full appearance-none bg-brand-surface border border-brand-border px-5 py-4 font-bold text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-lg cursor-pointer transition-colors hover:border-gray-300 rounded-2xl"
              value={activeSubject.id}
              onChange={(e) => setSelectedSubId(e.target.value)}
            >
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-24 bg-brand-surface rounded-2xl border border-brand-border border-dashed shadow-sm">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-2 text-brand-text-primary">No subjects found</h2>
          <p className="text-brand-text-secondary font-medium text-lg">Add some subjects in your profile to start tracking syllabus.</p>
        </div>
      ) : activeSubject && (
        <div className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-8">
            <div className="card-base p-8 md:p-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-8">
                 <div>
                   <SubjectBadge name={activeSubject.name} color={activeSubject.color} />
                   <h2 className="text-3xl font-black mt-4 text-brand-text-primary">Topics</h2>
                 </div>
                 <div className="text-left sm:text-right">
                   <div className="text-[3rem] font-black text-primary leading-none drop-shadow-sm">{calculateProgress(activeSubject.syllabus)}<span className="text-2xl opacity-60 ml-1">%</span></div>
                   <div className="text-sm font-bold uppercase tracking-widest text-brand-text-secondary mt-1">Completed</div>
                 </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-brand-bg rounded-full h-4 mb-10 shadow-inner overflow-hidden flex border border-brand-border/50">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress(activeSubject.syllabus)}%` }}
                  transition={{ duration: 0.8, type: 'spring', bounce: 0.3 }}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-brand-bg p-5 rounded-2xl border border-brand-border shadow-sm items-center">
                <input 
                  type="text" 
                  placeholder="E.g. Chapter 1: Introduction" 
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                  className="w-full sm:flex-1"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleAddTopic}
                    disabled={!newTopicTitle.trim()}
                    className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="sm:hidden">Add</span>
                  </button>
                  <button 
                    onClick={() => setShowBulkAdd(true)}
                    className="flex-1 sm:flex-none bg-brand-surface hover:bg-gray-50 border border-brand-border text-brand-text-primary px-4 py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-bold"
                    aria-label="Bulk Add"
                    title="Bulk Add Topics"
                  >
                    <ListPlus className="w-5 h-5" />
                    <span className="sm:hidden">Bulk</span>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {(activeSubject.syllabus || []).map(topic => (
                    <motion.div 
                      key={topic.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.98 }}
                      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all shadow-sm gap-4 ${
                        topic.status === 'completed' ? 'bg-primary/5 border-primary/20' : 
                        topic.status === 'in_progress' ? 'bg-warning/5 border-warning/30' :
                        'bg-brand-bg border-brand-border hover:border-gray-300'
                      }`}
                    >
                      {editingTopicId === topic.id ? (
                        <div className="flex flex-1 items-center gap-3">
                           <input 
                             autoFocus
                             type="text" 
                             value={editTitle}
                             onChange={e => setEditTitle(e.target.value)}
                             onKeyDown={e => e.key === 'Enter' && saveEdit()}
                             className="flex-1"
                           />
                           <button onClick={saveEdit} className="bg-primary text-white p-3 border border-primary font-bold rounded-xl shadow-sm hover:bg-primary/90">
                             Save
                           </button>
                           <button onClick={() => setEditingTopicId(null)} className="p-3 bg-brand-surface border border-brand-border rounded-xl text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-100">
                             <X className="w-5 h-5" />
                           </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start sm:items-center gap-4 flex-1 cursor-pointer" onClick={() => handleToggleTopic(topic.id, topic.status)}>
                            <button 
                              className={`shrink-0 min-w-8 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 sm:mt-0 ${
                                topic.status === 'completed' ? 'bg-primary border-primary shadow-md shadow-primary/20' : 
                                topic.status === 'in_progress' ? 'bg-warning border-warning shadow-md shadow-warning/20' : 
                                'bg-white border-gray-300 shadow-inner group-hover:border-primary/50'
                              }`}
                            >
                              {topic.status === 'completed' && <Check className="w-5 h-5 text-white" />}
                              {topic.status === 'in_progress' && <Clock className="w-5 h-5 text-white" />}
                            </button>
                            <span className={`font-bold text-base sm:text-lg transition-colors leading-snug break-words ${topic.status === 'completed' ? 'line-through text-brand-text-secondary opacity-60' : 'text-brand-text-primary'}`}>
                              {topic.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 justify-end sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditing(topic)}
                              className="text-gray-400 hover:text-brand-text-primary p-2 sm:p-2.5 bg-brand-surface hover:bg-gray-100 border border-brand-border rounded-xl shadow-sm"
                              title="Edit Topic"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="text-gray-400 hover:text-danger p-2 sm:p-2.5 bg-brand-surface hover:bg-danger/10 hover:border-danger/30 border border-brand-border rounded-xl shadow-sm"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {(!activeSubject.syllabus || activeSubject.syllabus.length === 0) && (
                  <div className="text-center py-16 text-brand-text-secondary font-bold text-lg bg-brand-bg rounded-2xl border-2 border-dashed border-brand-border">
                    No topics yet. Start framing your syllabus!
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="card-base p-8 h-fit max-h-[80vh] overflow-y-auto scrollbar-hide sticky top-8">
              <h3 className="font-extrabold text-2xl mb-6 text-brand-text-primary">All Subjects</h3>
              <div className="space-y-4">
                {subjects.map(s => {
                  const prog = calculateProgress(s.syllabus);
                  return (
                    <button 
                      key={s.id}
                      onClick={() => setSelectedSubId(s.id)}
                      className={`w-full text-left p-5 rounded-2xl border transition-all ${s.id === activeSubject.id ? 'bg-brand-bg border-primary shadow-md transform scale-[1.02]' : 'bg-brand-bg border-brand-border hover:border-gray-300 hover:shadow-sm'}`}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <SubjectBadge name={s.name} color={s.color} />
                        <span className="font-bold text-sm bg-brand-surface px-3 py-1.5 rounded-lg border border-brand-border tabular-nums tracking-tight text-brand-text-primary shadow-sm">{prog}%</span>
                      </div>
                      <div className="w-full bg-brand-surface rounded-full h-2 overflow-hidden border border-brand-border/50 bg-opacity-50 shadow-inner">
                        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${prog}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
