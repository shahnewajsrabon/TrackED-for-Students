import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, BookOpen, AlertCircle, X, Check, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { isFuture, differenceInDays, startOfDay } from 'date-fns';
import DailyScheduleCard from '@/components/planner/DailyScheduleCard';
import UpcomingPlannerExamsCard from '@/components/planner/UpcomingPlannerExamsCard';

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

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleGenerateAIPlan = async () => {
    if (!user) return;
    setIsGeneratingPlan(true);
    try {
      const subjectData = subjects.map(s => ({
        id: s.id,
        name: s.name,
        weeklyGoalHrs: s.weeklyGoalHrs,
        examDate: s.examDate
      }));

      const contents = `Create a 7-day study plan starting tomorrow for these subjects based on their weekly goals and upcoming exams.
Subjects: ${JSON.stringify(subjectData)}
Break down into reasonable daily study sessions (1-2 hours each).`;

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING", description: "Title of the study session" },
                  subject_id: { type: "STRING" },
                  day_offset: { type: "INTEGER", description: "1 for tomorrow, 2 for day after, etc." },
                  duration_hrs: { type: "NUMBER" }
                },
                required: ['title', 'subject_id', 'day_offset', 'duration_hrs']
              }
            }
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const plan = JSON.parse(data.text);
      
      const promises = plan.map((session: any) => {
        const d = new Date();
        d.setDate(d.getDate() + session.day_offset);
        d.setHours(9 + (Math.random()*4), 0, 0, 0); // Random time between 9am-1pm

        return addDoc(collection(db, 'tasks'), {
          user_id: user.uid,
          title: session.title,
          due_date: d.toISOString().slice(0, 16),
          priority: 'medium',
          is_completed: false,
          subject_id: session.subject_id,
          created_at: new Date().toISOString()
        });
      });

      await Promise.all(promises);
      alert('AI successfully generated your 7-day study plan!');
    } catch (e) {
       console.error("AI Plan Error", e);
       alert("Failed to generate AI plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

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

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-brand-text-primary">
            Study Planner
          </h1>
          <p className="text-brand-text-secondary font-medium mt-2 text-base md:text-lg">
            Manage your schedule and stay on track.
          </p>
        </div>
        <button 
          onClick={handleGenerateAIPlan}
          disabled={isGeneratingPlan || subjects.length === 0}
          className="bg-brand-text-primary text-brand-bg px-6 py-3 rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-black/10 dark:shadow-white/10 flex items-center gap-2 max-w-fit"
        >
          {isGeneratingPlan ? (
            <div className="w-5 h-5 rounded-full border-2 border-brand-bg border-t-transparent animate-spin" />
          ) : (
            <span className="text-xl leading-none font-black opacity-80 sparkle-animation">✨</span>
          )}
          {isGeneratingPlan ? 'Creating Plan...' : 'Auto-Generate Schedule'}
        </button>
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
          <DailyScheduleCard 
            selectedDate={selectedDate}
            dayNames={dayNames}
            monthNames={monthNames}
            selectedDateTasks={selectedDateTasks}
            subjects={subjects}
            setNewTaskType={setNewTaskType}
            setShowAddForm={setShowAddForm}
            toggleTaskCompletion={toggleTaskCompletion}
            deleteTask={deleteTask}
          />

          {/* Upcoming Exams Card */}
          <UpcomingPlannerExamsCard
            upcomingExams={upcomingExams}
            examTab={examTab}
            setExamTab={setExamTab}
            setNewTaskType={setNewTaskType}
            setShowAddForm={setShowAddForm}
          />

        </div>
      </div>
    </div>
  );
}
