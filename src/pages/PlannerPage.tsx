import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, BookOpen, AlertCircle, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PlannerPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals / Toggles
  const [examTab, setExamTab] = useState<'subject' | 'exam'>('subject');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'exam'>('task');
  
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
      created_at: new Date().toISOString()
    });

    setNewTaskTitle('');
    setShowAddForm(false);
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

  const upcomingExams = tasks.filter(t => t.priority === 'high' && !t.is_completed).sort((a,b) => {
      if(!a.due_date) return 1;
      if(!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto pb-24 md:pb-8 h-full flex flex-col relative">
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-[2rem] w-full max-w-md p-6 shadow-2xl relative">
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
                  className="bg-brand-bg rounded-xl px-4 py-3 font-bold border border-brand-border outline-none focus:border-primary"
                  placeholder="e.g. Physics Midterm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-brand-text-secondary uppercase">Date & Time</label>
                <input
                  required
                  type="datetime-local"
                  value={newTaskDate}
                  onChange={e => setNewTaskDate(e.target.value)}
                  className="bg-brand-bg rounded-xl px-4 py-3 font-bold border border-brand-border outline-none focus:border-primary"
                />
              </div>
              <button type="submit" className="mt-4 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
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
        <div className="bg-brand-surface rounded-[2rem] p-6 lg:p-10 border border-brand-border flex-1 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-brand-text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextMonth} className="p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors">
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
                    className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-sm md:text-lg font-bold transition-all relative ${
                      isSelected 
                        ? 'bg-[#3A82F6] text-white shadow-lg shadow-blue-500/30 font-black' 
                        : isToday
                          ? 'text-primary font-black border-2 border-primary/20 bg-primary/5'
                          : 'text-brand-text-primary hover:bg-brand-bg'
                    }`}
                  >
                    {date}
                    {/* Activity dots indicator could go here */}
                    {tasks.some(t => {
                        if(!t.due_date) return false;
                        const d = new Date(t.due_date);
                        return d.getDate() === date && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                    }) && !isSelected && (
                        <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary/60"></div>
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
          <div className="bg-brand-surface rounded-[2rem] p-6 lg:p-8 border border-brand-border shadow-sm flex flex-col min-h-[250px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <Clock className="w-6 h-6 text-[#8B5CF6]" />
                 <h3 className="font-bold text-lg text-brand-text-primary">
                    {dayNames[selectedDate.getDay()]} {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                 </h3>
               </div>
               <button onClick={() => setShowAddForm(true)} className="text-primary font-bold text-sm hover:underline">+ Add</button>
             </div>
             
             <div className="flex-1 flex flex-col">
               {selectedDateTasks.length === 0 ? (
                 <div className="flex flex-col items-center justify-center flex-1 py-8 text-center gap-6">
                   <p className="text-brand-text-secondary font-medium">No study sessions scheduled.</p>
                   <button onClick={() => setShowAddForm(true)} className="bg-primary/10 text-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/20 transition-all shadow-sm">
                     + Schedule Session
                   </button>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {selectedDateTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 bg-brand-bg p-4 rounded-2xl border border-brand-border">
                         <div className="flex-1">
                           <div className="font-bold text-brand-text-primary">{task.title}</div>
                           {task.due_date && (
                             <div className="text-xs text-brand-text-secondary mt-1 font-medium">
                               {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </div>
                           )}
                         </div>
                      </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {/* Upcoming Exams Card */}
          <div className="bg-brand-surface rounded-[2rem] p-6 lg:p-8 border border-brand-border shadow-sm flex-1 flex flex-col">
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
                    examTab === 'subject' 
                      ? 'bg-brand-surface text-brand-text-primary shadow-sm border border-brand-border/50' 
                      : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> SUBJECT WISE
                </button>
                <button 
                  onClick={() => setExamTab('exam')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold tracking-wide transition-all ${
                    examTab === 'exam' 
                      ? 'bg-brand-surface text-brand-text-primary shadow-sm border border-brand-border/50' 
                      : 'text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> EXAM WISE
                </button>
             </div>

             <div className="space-y-4 flex-1">
               {upcomingExams.length === 0 ? (
                 <div className="text-center py-8 text-brand-text-secondary font-medium text-sm">
                   No upcoming exams. You're all caught up!
                 </div>
               ) : (
                 upcomingExams.map(exam => {
                    const daysDiff = exam.due_date 
                      ? Math.ceil((new Date(exam.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
                      : 0;
                    
                    const isUrgent = daysDiff >= 0 && daysDiff <= 7;
                    const isPast = daysDiff < 0;

                    return (
                      <div key={exam.id} className="group relative flex items-center gap-4 bg-brand-bg p-4 md:p-5 rounded-2xl border border-brand-border hover:border-primary/30 transition-all overflow-hidden">
                         {isUrgent && (
                           <div className="absolute left-0 top-0 bottom-0 w-1 bg-danger"></div>
                         )}
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isUrgent ? 'bg-[#3A82F6] text-white' : 'bg-[#3A82F6]/10 text-[#3A82F6]'}`}>
                            <BookOpen className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="font-bold text-brand-text-primary truncate">{exam.title}</div>
                           <div className="text-xs text-brand-text-secondary font-bold mt-1 tracking-wide uppercase">
                             {exam.due_date ? new Date(exam.due_date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : 'No date'}
                           </div>
                         </div>
                         <div className="text-right shrink-0 flex flex-col items-end justify-center">
                           {isPast ? (
                              <div className="text-xs font-bold text-brand-text-secondary uppercase">Past</div>
                           ) : isUrgent ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-danger mb-0.5" />
                                <div className="text-xl font-black text-danger leading-none">{daysDiff}</div>
                                <div className="text-[10px] font-bold text-danger uppercase tracking-wider">Days</div>
                              </>
                           ) : (
                              <>
                                <div className="text-xl font-black text-brand-text-primary leading-none">{daysDiff}</div>
                                <div className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider">Days</div>
                              </>
                           )}
                         </div>
                      </div>
                    );
                 })
               )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

