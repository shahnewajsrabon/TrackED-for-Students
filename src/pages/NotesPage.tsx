import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { FileText, Save, Edit, Eye, MessageSquare, Trash2, Plus, Wand2, Mail } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { motion } from 'motion/react';

interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  subject_id: string | null;
  created_at: string;
  updated_at: string;
  is_markdown?: boolean;
}

export default function NotesPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notes'), where('user_id', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Note));
      setNotes(data);
      if (activeNote) {
         const updated = data.find(n => n.id === activeNote.id);
         if (updated) setActiveNote(updated);
         else setActiveNote(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File must be under 5MB for AI processing.");
      return;
    }

    // Get Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (ev) => {
      const base64d = ev.target?.result?.toString().split(',')[1];
      if (!base64d) return;

      setIsEnhancing(true);

      try {
        const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-3-flash-preview',
            contents: [
              { role: 'user', parts: [
                { text: "Extract the text from this image and format it as structured, clean markdown notes suitable for studying." },
                { inlineData: { mimeType: file.type, data: base64d } }
              ]}
            ]
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        if (data.text) {
          if (!activeNote || !isEditing) {
            handleCreateNote(data.text);
          } else {
            setEditContent(prev => prev + '\n\n' + data.text);
          }
        }
      } catch (err) {
        console.error('Failed to parse dropped image:', err);
        alert('Failed to parse image for notes.');
      } finally {
        setIsEnhancing(false);
      }
    };
  };

  const handleAIEnhance = async () => {
    if (!editContent.trim()) return;
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3-flash-preview',
          contents: `Enhance the following notes. Fix any typos, improve clarity, and add Markdown formatting where appropriate (like bullet points, bolding, headings). Keep the core meaning unchanged, but make it look like a well-structured study guide.\n\nNotes:\n${editContent}`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.text) {
        setEditContent(data.text);
      }
    } catch (e) {
      console.error('AI Enhance failed', e);
      alert('Failed to enhance notes using AI.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!isEditing || !activeNote || !user) return;

    const hasUnsavedChanges = 
      editTitle.trim() !== (activeNote.title || 'Untitled Note').trim() ||
      editContent !== (activeNote.content || '') ||
      (editSubjectId || null) !== (activeNote.subject_id || null);

    if (!hasUnsavedChanges) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const timeoutId = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'notes', activeNote.id), {
          title: editTitle.trim() || 'Untitled Note',
          content: editContent,
          subject_id: editSubjectId || null,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [editTitle, editContent, editSubjectId, isEditing, activeNote, user]);

  const handleCreateNote = async (initialContent?: string) => {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'notes'), {
      user_id: user.uid,
      title: 'Untitled Note',
      content: initialContent || '',
      subject_id: subjects[0]?.id || null,
      is_markdown: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setActiveNote({ 
      id: docRef.id, 
      user_id: user.uid,
      title: 'Untitled Note', 
      content: initialContent || '', 
      subject_id: subjects[0]?.id || null, 
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_markdown: true
    });
    setIsEditing(true);
    setEditTitle('Untitled Note');
    setEditContent(initialContent || '');
    setEditSubjectId(subjects[0]?.id || '');
  };

  const handleSaveNote = async () => {
    if (!user || !activeNote) return;
    await updateDoc(doc(db, 'notes', activeNote.id), {
      title: editTitle.trim() || 'Untitled Note',
      content: editContent,
      subject_id: editSubjectId || null,
      updated_at: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const deleteNote = async (noteId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'notes', noteId));
    if (activeNote?.id === noteId) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col space-y-6"
    >
      <div className="flex items-center justify-between bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-sm shrink-0">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 text-brand-text-primary drop-shadow-sm">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <FileText className="w-8 h-8" />
            </div>
            Notes
          </h1>
          <p className="text-brand-text-secondary font-medium mt-2 text-lg">Rich-text markdown notes attached to your subjects.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleCreateNote()}
          className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> New Note
        </motion.button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
        {/* Sidebar */}
        <div className="w-full md:w-80 flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-sm shrink-0 overflow-hidden">
          <div className="p-6 border-b border-brand-border bg-gray-50 flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-brand-text-primary text-lg">All Notes</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
            {notes.sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(note => {
               const subject = subjects.find(s => s.id === note.subject_id);
               return (
                 <div
                   key={note.id}
                   onClick={() => {
                     setActiveNote(note);
                     setIsEditing(false);
                     setEditTitle(note.title);
                     setEditContent(note.content || '');
                     setEditSubjectId(note.subject_id || '');
                   }}
                   className={`p-5 rounded-2xl border cursor-pointer transition-all group relative ${activeNote?.id === note.id ? 'bg-primary-light border-primary/30 shadow-md transform scale-[1.02]' : 'bg-brand-bg border-brand-border hover:border-gray-300 hover:shadow-sm'}`}
                 >
                   <h3 className="font-bold text-brand-text-primary truncate pr-6 text-lg mb-2">{note.title}</h3>
                   <div className="flex items-center gap-3">
                     {subject && (
                       <span className="text-xs font-semibold px-2 py-1 rounded-md bg-white border border-brand-border flex items-center gap-1.5 shrink-0">
                         <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subject.color }} />
                         {subject.name}
                       </span>
                     )}
                     <span className="text-xs text-brand-text-secondary truncate">
                       {new Date(note.updated_at).toLocaleDateString()}
                     </span>
                   </div>
                   <button 
                     onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                     className="absolute top-4 right-3 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-md border border-brand-border shadow-sm"
                   >
                     <Trash2 className="w-3.5 h-3.5" />
                   </button>
                 </div>
               )
            })}
            {notes.length === 0 && (
               <div className="text-center py-10 text-brand-text-secondary font-medium">
                 No notes yet. Create one!
               </div>
            )}
          </div>
        </div>

        {/* Note Editor/Viewer */}
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
          {activeNote ? (
            <>
              <div className="border-b border-brand-border p-6 md:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between bg-brand-bg">
                {isEditing ? (
                  <div className="flex-1 flex gap-4 w-full">
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="flex-1 bg-white border border-brand-border rounded-2xl px-5 py-2.5 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                    />
                    <select
                      value={editSubjectId}
                      onChange={e => setEditSubjectId(e.target.value)}
                      className="bg-white border border-brand-border rounded-2xl px-5 py-2.5 font-bold text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-primary shadow-sm w-48"
                    >
                      <option value="">No Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h2 className="text-4xl font-black text-brand-text-primary mb-3 pr-4">{activeNote.title}</h2>
                      <div className="flex gap-2">
                        <a 
                          href={`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${user?.email}&su=${encodeURIComponent(activeNote.title)}&body=${encodeURIComponent(activeNote.content + '\n\n---\nSent from TrackEd')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-brand-bg hover:bg-gray-100 text-brand-text-primary border border-brand-border p-2.5 rounded-2xl transition-colors shadow-sm"
                          title="Send to Gmail"
                        >
                          <Mail className="w-5 h-5 text-primary" />
                        </a>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-brand-text-secondary flex items-center gap-3">
                       <span className="bg-brand-bg px-3 py-1 rounded-md border border-brand-border">Last edited: {new Date(activeNote.updated_at).toLocaleString()}</span>
                       {activeNote.subject_id && subjects.find(s=>s.id===activeNote.subject_id) && (
                         <>
                           <span className="flex items-center gap-2 bg-brand-bg px-3 py-1 rounded-md border border-brand-border">
                             <span className="w-2 h-2 rounded-full" style={{backgroundColor: subjects.find(s=>s.id===activeNote.subject_id)!.color}} />
                             {subjects.find(s=>s.id===activeNote.subject_id)!.name}
                           </span>
                         </>
                       )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 w-full sm:w-auto items-center">
                  {isEditing ? (
                    <>
                      {isSaving && <span className="text-sm font-semibold text-brand-text-secondary animate-pulse mr-2">Saving...</span>}
                      <button 
                        onClick={handleAIEnhance} 
                        disabled={isEnhancing || !editContent.trim()}
                        className="bg-brand-surface border border-brand-border text-brand-text-primary px-4 py-2.5 rounded-2xl font-bold hover:bg-gray-100 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isEnhancing ? (
                          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4 text-primary" /> 
                        )}
                        Enhance
                      </button>
                      <button onClick={handleSaveNote} className="flex-1 sm:flex-none bg-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-primary/90 transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" /> Done
                      </button>
                    </>
                  ) : (
                    <button onClick={() => {
                        setIsEditing(true);
                        setEditTitle(activeNote.title);
                        setEditContent(activeNote.content || '');
                        setEditSubjectId(activeNote.subject_id || '');
                      }} 
                      className="flex-1 sm:flex-none bg-white border border-brand-border px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5" /> Edit Page
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative flex flex-col bg-brand-bg">
                {isEditing ? (
                  <div className="flex flex-col md:flex-row h-full w-full">
                    <div className="flex-1 md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-brand-border relative">
                      <label className="absolute top-3 right-4 text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest bg-brand-bg border border-brand-border px-2 py-1 rounded-md z-10 shadow-sm">Markdown</label>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Write your note here using Markdown..."
                        className="w-full h-full p-6 pt-12 bg-transparent resize-none focus:outline-none text-brand-text-primary font-mono text-sm leading-relaxed"
                      />
                    </div>
                    <div className="flex-1 md:w-1/2 h-1/2 md:h-full overflow-y-auto p-6 pt-12 bg-brand-surface relative">
                       <label className="absolute top-3 right-4 text-[10px] font-bold text-brand-text-secondary uppercase tracking-widest bg-brand-surface border border-brand-border px-2 py-1 rounded-md z-10 shadow-sm">Preview</label>
                       <div className="prose prose-sm md:prose-base prose-brand max-w-none dark:prose-invert">
                         <Markdown remarkPlugins={[remarkGfm]}>
                           {editContent || '*Start typing to see preview...*'}
                         </Markdown>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full overflow-y-auto p-8">
                     <div className="prose prose-brand max-w-4xl mx-auto dark:prose-invert">
                       <Markdown remarkPlugins={[remarkGfm]}>
                         {activeNote.content || '*Empty note. Click Edit to start writing.*'}
                       </Markdown>
                     </div>
                  </div>
                )}
              </div>
            </>
          ) : (
             <div className="h-full flex flex-col items-center justify-center p-12 text-center text-brand-text-secondary bg-brand-surface relative group">
               {notes.length === 0 ? (
                 <>
                   <div className="p-6 bg-brand-bg rounded-2xl border border-dashed border-brand-border mb-6 group-hover:bg-primary/5 transition-colors">
                     <Wand2 className="w-16 h-16 text-primary" />
                   </div>
                   <h3 className="text-2xl font-black text-brand-text-primary mb-4">No notes? No problem.</h3>
                   <p className="font-medium max-w-md mx-auto mb-8 text-lg">Create a new note or ask the AI Tutor to generate flashcards and summaries from your pictures.</p>
                   <button 
                      onClick={() => handleCreateNote()}
                      className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> Start First Note
                    </button>
                 </>
               ) : (
                 <>
                   <div className="p-6 bg-brand-bg rounded-2xl border border-dashed border-brand-border mb-6">
                     <FileText className="w-16 h-16 text-gray-300" />
                   </div>
                   <h3 className="text-2xl font-black text-brand-text-primary mb-2">Select a note</h3>
                   <p className="font-medium max-w-md mx-auto text-lg">Choose a note from the sidebar or drag and drop files here.</p>
                 </>
               )}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
