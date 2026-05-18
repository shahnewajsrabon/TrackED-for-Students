import React from 'react';
import { motion } from 'motion/react';

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, subtitle }: Props) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-brand-surface/90 backdrop-blur-3xl p-6 rounded-2xl border border-brand-border shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-xl hover:shadow-primary/10 transition-all relative overflow-hidden group z-10"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-all pointer-events-none transform translate-x-2 -translate-y-2 scale-150 rotate-[-10deg] group-hover:rotate-0">
        {icon}
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">{label}</p>
          <p className="text-[2.25rem] font-light mt-1 text-brand-text-primary leading-none tracking-tight font-display">{value}</p>
          {subtitle && <p className="text-[11px] font-semibold text-brand-text-secondary mt-3">{subtitle}</p>}
        </div>
        {icon && <div className="p-3 bg-primary/5 rounded-2xl text-primary shadow-sm border border-primary/10">{icon}</div>}
      </div>
    </motion.div>
  );
}
