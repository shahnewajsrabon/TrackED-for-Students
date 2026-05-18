import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, BookOpen, AlertCircle, X, Check, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isFuture, differenceInDays, startOfDay } from 'date-fns';

export default function PlannerPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals / Toggles
  const [examTab, setExamTab] = useState<'subject' | 'exam'>('subject');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'exam'>('task');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  // Format selected date for datetime-local input safely
  const formattedSelectedDate = selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000;
  const autoDate = new Date(formattedSelectedDate).toISOString().slice(0,16);

  const [newTaskDate, setNewTaskDate] = useState(autoDate);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTaskTitle.trim()) return;

    await addDoc(collection(db, 'tasks'), {
      user_id: user.uid,
      title: newTaskTitle.trim(),
      due_date: newTaskDate || null,
      priority: newTaskType === 'exam' ? 'high' : 'medium',
      is_completed: false,
      subject_id: selectedSubjectId || null,
      created_at: new Date().toISOString()
    });

    setNewTaskTitle('');
    setSelectedSubjectId('');
    setShowAddForm(false);
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'tasks', taskId), { is_completed: !currentStatus });
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
    }
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setTasks(allTasks);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Filter tasks for selected date
  const selectedDateTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  });

  // Calculate upcoming exams properly by merging Subject-based and Task-based exams
  const getUpcomingExams = () => {
    const exams: any[] = [];
    
    // 1. From subjects collection
    subjects.forEach(s => {
      if (s.examDate) {
        exams.push({ 
          id: `subject_exam_${s.id}`,
          title: s.examName || s.name + " Exam",
          due_date: s.examDate,
          subjectName: s.name, 
          subjectColor: s.color,
          source: 'subject' 
        });
      }
    });

    // 2. From tasks collection
    tasks.filter(t => t.priority === 'high' && !t.is_completed).forEach(t => {
      const subject = subjects.find(s => s.id === t.subject_id);
      exams.push({
         id: t.id,
         title: t.title,
         due_date: t.due_date,
         subjectName: subject?.name || 'Custom',
         subjectColor: subject?.color || 'bg-primary',
         source: 'task',
         taskRef: t
      });
    });

    return exams.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const upcomingExams = getUpcomingExams();

  if (loading || subjectsLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-8 h-full flex flex-col relative">
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card-base w-full max-w-md p-6 relative">
            <button onClick={() => setShowAddForm(false)} className="absolute top-6 right-6 text-brand-text-secondary hover:text-brand-text-primary">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-black text-brand-text-primary mb-6">
              {newTaskType === 'exam' ? 'Add Exam' : 'Schedule Session'}
            </h2>
            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase">Title</label>
                <input
                  autoFocus
                  required
                  type="text"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Physics Midterm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase">Subject (Optional)</label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">-- None --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase">Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                />
              </div>
              <button type="submit" className="mt-4 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90">
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-text-primary">
          Study Planner
        </h1>
        <p className="text-brand-text-secondary font-medium mt-2 text-base md:text-lg">
          Manage your schedule and stay on track.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 md:gap-8 flex-1">
        {/* Left Column: Calendar */}
        <div className="card-base p-6 lg:p-10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-brand-text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 text-brand-text-secondary hover:text-brand-text-primary border border-brand-border bg-brand-bg rounded-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextMonth} className="p-2 text-brand-text-secondary hover:text-brand-text-primary border border-brand-border bg-brand-bg rounded-lg">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-6 md:gap-y-12">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs md:text-sm font-bold text-brand-text-secondary tracking-widest">
                {day}
              </div>
            ))}
            
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="text-center p-2"></div>
            ))}
            
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = i + 1;
              const isSelected = selectedDate.getDate() === date && 
                                 selectedDate.getMonth() === currentDate.getMonth() && 
                                 selectedDate.getFullYear() === currentDate.getFullYear();
                                 
              const isToday = new Date().getDate() === date && 
                              new Date().getMonth() === currentDate.getMonth() && 
                              new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div key={date} className="flex justify-center items-center">
                  <button
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), date))}
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex flex-col items-center justify-center text-sm md:text-lg font-bold transition-all relative ${
                      isSelected 
                        ? 'bg-[#3A82F6] text-white shadow-lg shadow-blue-500/30 font-black scale-105' 
                        : isToday
                          ? 'text-primary font-black border-2 border-primary/20 bg-primary/5'
                          : 'text-brand-text-primary hover:bg-brand-bg'
                    }`}
                  >
                    {date}
                    {tasks.some(t => {
                        if(!t.due_date) return false;
                        const d = new Date(t.due_date);
                        return d.getDate() === date && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    }) && (
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary/80'}`}></div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Details & Upcoming */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6 md:gap-8 shrink-0">
          
          {/* Daily Schedule Card */}
          <div className="card-base p-6 lg:p-8 flex flex-col min-h-[250px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <Clock className="w-6 h-6 text-[#8B5CF6]" />
                 <h3 className="font-bold text-lg text-brand-text-primary">
                    {dayNames[selectedDate.getDay()]} {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                 </h3>
               </div>
               <button onClick={() => { setNewTaskType('task'); setShowAddForm(true); }} className="text-primary font-bold text-sm hover:underline">+ Add</button>
             </div>
             
             <div className="flex-1 flex flex-col">
               {selectedDateTasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center flex-1 py-8 text-center gap-6 bg-brand-bg/50 rounded-2xl border border-dashed border-brand-border">
                   <p className="text-brand-text-secondary font-medium text-sm">No study sessions scheduled.</p>
                   <button onClick={() => { setNewTaskType('task'); setShowAddForm(true); }} className="bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all">
                     + Schedule Session
                   </button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {selectedDateTasks.map(task => (
                      <div key={task.id} className={`flex items-center gap-4 bg-brand-bg p-4 rounded-2xl border transition-all ${task.is_completed ? 'border-success/30 opacity-60 hover:opacity-100 bg-success/5' : 'border-brand-border hover:border-primary/30'}`}>
                         <button 
                            onClick={() => toggleTaskCompletion(task.id, task.is_completed)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${task.is_completed ? 'bg-success border-success text-white' : 'border-brand-border text-transparent hover:border-success/50'}`}
                         >
                            <Check className="w-3.5 h-3.5" />
                         </button>
                         <div className="flex-1 min-w-0">
                           <div className={`font-bold truncate text-sm md:text-base ${task.is_completed ? 'text-success line-through' : 'text-brand-text-primary'}`}>{task.title}</div>
                           <div className="flex items-center gap-2 mt-1 flex-wrap">
                             {task.due_date && (
                               <div className={`text-xs font-bold ${task.is_completed ? 'text-success/80' : 'text-brand-text-secondary'}`}>
                                 {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </div>
                             )}
                             {task.subject_id && subjects.find(s=>s.id===task.subject_id) && (
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${task.is_completed ? 'border-success/30 bg-success/10 text-success' : 'bg-brand-surface border-brand-border text-brand-text-secondary'}`}>
                                 {subjects.find(s=>s.id===task.subject_id)?.name}
                               </span>
                             )}
                           </div>
                         </div>
                         <button onClick={() => deleteTask(task.id)} className="p-2 text-brand-text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all opacity-50 hover:opacity-100">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Upcoming Exams Card */}
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

        </div>
      </div>
    </div>
  );
}
