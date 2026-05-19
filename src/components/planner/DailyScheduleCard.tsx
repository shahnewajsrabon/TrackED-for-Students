import React from 'react';
import { Clock, Check, Trash2 } from 'lucide-react';
import { Subject } from '@/types';

interface DailyScheduleCardProps {
  selectedDate: Date;
  dayNames: string[];
  monthNames: string[];
  selectedDateTasks: any[];
  subjects: Subject[];
  setNewTaskType: (t: 'task' | 'exam') => void;
  setShowAddForm: (v: boolean) => void;
  toggleTaskCompletion: (taskId: string, isComp: boolean) => void;
  deleteTask: (taskId: string) => void;
}

export default function DailyScheduleCard({
  selectedDate,
  dayNames,
  monthNames,
  selectedDateTasks,
  subjects,
  setNewTaskType,
  setShowAddForm,
  toggleTaskCompletion,
  deleteTask
}: DailyScheduleCardProps) {
  return (
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
  );
}
