import React from 'react';
import { motion } from 'framer-motion';
import { Exam } from '@/types';
import SubjectBadge from '@/components/SubjectBadge';
import { differenceInDays, startOfDay } from 'date-fns';

interface UpcomingExamsPanelProps {
  exams: (Exam & { subjectName: string, subjectColor: string })[];
  t: any;
}

export default function UpcomingExamsPanel({ exams, t }: UpcomingExamsPanelProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-brand-surface shadow hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-2xl border border-brand-border"
    >
      <h2 className="text-2xl font-bold mb-6 text-brand-text-primary">{t('dashboard.upcomingExams', 'Upcoming Exams')}</h2>
      {exams.length > 0 ? (
        <div className="space-y-4">
          {exams.map((exam, i) => {
            const daysLeft = differenceInDays(startOfDay(new Date(exam.examDate)), startOfDay(new Date()));
            let urgencyColor = 'text-success bg-success/10 border-success/20';
            if (daysLeft < 3) urgencyColor = 'text-danger bg-danger/10 border-danger/20';
            else if (daysLeft <= 7) urgencyColor = 'text-warning bg-warning/10 border-warning/20';

            return (
              <motion.div 
                key={i} 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-5 rounded-2xl border border-brand-border transition-all bg-brand-bg shadow-sm"
              >
                <div>
                  <div className="font-extrabold text-base mb-1.5 text-brand-text-primary">{exam.examName}</div>
                  <SubjectBadge name={exam.subjectName} color={exam.subjectColor} />
                </div>
                <div className={`px-4 py-2.5 rounded-2xl border flex flex-col items-center justify-center min-w-[70px] ${urgencyColor}`}>
                  <div className="text-xl font-black leading-none mb-0.5">{daysLeft}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest opacity-80">Days</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
         <div className="text-center py-8 text-brand-text-secondary text-sm">
           {t('dashboard.noExams', 'No upcoming exams.')}<br/>{t('dashboard.addExamsMsg', 'Add them in your Profile.')}
         </div>
      )}
    </motion.section>
  );
}
