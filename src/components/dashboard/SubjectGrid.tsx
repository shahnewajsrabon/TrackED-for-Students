import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar as CalendarIcon, ArrowRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SyllabusTopic, Subject } from '@/types';
import { isFuture, formatDistanceToNow } from 'date-fns';

interface SubjectGridProps {
  subjects: Subject[];
  calculateSyllabusProgress: (syllabus?: SyllabusTopic[]) => number;
  t: any;
}

export default function SubjectGrid({ subjects, calculateSyllabusProgress, t }: SubjectGridProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-brand-surface shadow hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-2xl border border-brand-border"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-extrabold text-brand-text-primary mb-0 tracking-tight">{t('dashboard.activeSubjects', 'Your Subjects')}</h2>
          <div className="bg-brand-bg border border-brand-border px-3 py-1 rounded-full text-sm font-bold text-brand-text-secondary shadow-inner flex items-center justify-center shadow-sm">
            {subjects.length}
          </div>
        </div>
        <Link to="/syllabus" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center bg-primary/5 px-5 py-2.5 rounded-2xl shadow-sm border border-primary/10">
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {subjects.map((subject, idx) => {
          const prog = calculateSyllabusProgress(subject.syllabus);
          return (
            <Link 
              key={subject.id}
              to="/syllabus"
              className="block outline-none"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="p-6 rounded-2xl border border-brand-border bg-brand-bg flex flex-col h-full group hover:border-brand-border hover:bg-brand-surface hover:shadow-lg transition-all relative overflow-hidden"
              >
                {/* Top section: Icon and badges */}
                <div className="flex justify-between items-start mb-6">
                  <div 
                    className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform" 
                    style={{ backgroundColor: subject.color }}
                  >
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex flex-col gap-2 items-end">
                    <span className="font-extrabold text-xs bg-brand-surface border border-brand-border px-3 py-1.5 rounded-full text-brand-text-primary shadow-sm">
                      {prog}%
                    </span>
                    {(subject.examDate || subject.examName) && (
                      <span className="font-bold text-xs bg-danger/10 text-danger border border-danger/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5" /> 
                        {subject.examDate ? (isFuture(new Date(subject.examDate)) ? formatDistanceToNow(new Date(subject.examDate)).replace('about ', '') + ' left' : 'Past') : 'Exam'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title and stats */}
                <h3 className="font-extrabold text-2xl text-brand-text-primary mb-3 line-clamp-2 leading-tight">
                  {subject.name}
                </h3>
                
                <div className="flex items-center gap-1.5 bg-brand-surface border border-brand-border shadow-sm px-3 py-1.5 rounded-2xl w-fit mb-8 opacity-80">
                  <BookOpen className="w-4 h-4 text-brand-text-secondary" />
                  <span className="text-sm font-bold text-brand-text-secondary">{subject.syllabus?.length || 0}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-auto space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm font-bold text-brand-text-secondary">
                    <span>Progress</span>
                    <span>{prog}%</span>
                  </div>
                  <div className="w-full bg-brand-surface rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${prog}%`, backgroundColor: subject.color || '#534AB7' }}
                    />
                  </div>
                </div>
                
                {/* Divider */}
                <div className="w-full h-px bg-brand-border/60 mb-5 line-clamp-2"></div>
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-sm font-bold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors">Details</span>
                  <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center group-hover:bg-brand-border transition-all text-brand-text-secondary shadow-sm">
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
        {subjects.length === 0 && (
          <div className="text-center py-10 sm:col-span-2 lg:col-span-3 xl:col-span-4 text-brand-text-secondary border-2 border-dashed border-brand-border rounded-2xl font-medium">
            No subjects added yet. Go to Profile to set them up.
          </div>
        )}
      </div>
    </motion.section>
  );
}
