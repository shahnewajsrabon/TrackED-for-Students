import React from 'react';
import { motion } from 'framer-motion';
import ToolsSection from '@/components/ToolsSection';

export default function ToolsPage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-5 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-24 md:pb-8"
    >
      <div className="mb-6 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-black text-brand-text-primary tracking-tight">Student Tools</h1>
        <p className="text-brand-text-secondary mt-2 font-medium">Quick access to calculators and utilities.</p>
      </div>
      
      <div className="-mt-8">
        <ToolsSection />
      </div>
    </motion.div>
  );
}
