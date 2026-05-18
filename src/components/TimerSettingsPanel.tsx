import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Volume2, Music } from 'lucide-react';
import clsx from 'clsx';
import { TimerState, Subject } from '@/types';
import { ambientAudio } from '@/lib/audio';

interface Props {
  config: TimerState;
  setConfig: (config: TimerState) => void;
  subjects: Subject[];
  mode: 'Focus' | 'Break';
  isActive: boolean;
  sessionCount: number;
  setTimeLeft: (time: number) => void;
  playAlertSound: (type: string, volume: number) => void;
}

export default function TimerSettingsPanel({
  config,
  setConfig,
  subjects,
  mode,
  isActive,
  sessionCount,
  setTimeLeft,
  playAlertSound
}: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full md:w-[360px] space-y-6"
    >
       <div className="bg-brand-surface p-8 rounded-2xl border border-brand-border shadow hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2 text-brand-text-primary"><Settings className="w-5 h-5 text-primary" /> Timer Settings</h3>
          </div>
          
          <div className="space-y-5">
             <div>
                <label className="block text-xs font-semibold uppercase text-brand-text-secondary mb-2">Subject</label>
                <select 
                  value={config.subjectId || ''} 
                  onChange={e => setConfig({...config, subjectId: e.target.value})}
                  className="w-full bg-brand-bg border border-brand-border rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-brand-text-primary"
                >
                  <option value="" disabled>Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
             
             <div className="flex bg-brand-bg p-1 rounded-2xl border border-brand-border mb-4">
               <button 
                 onClick={() => {
                    setConfig({...config, timerType: 'Pomodoro'});
                    if(mode === 'Focus' && !isActive) setTimeLeft(config.workDuration * 60);
                 }}
                 className={clsx("flex-1 text-sm font-bold py-1.5 rounded-lg transition-colors", config.timerType === 'Pomodoro' ? "bg-white dark:bg-gray-800 shadow-sm text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary")}
               >
                 Pomodoro
               </button>
               <button 
                 onClick={() => {
                    setConfig({...config, timerType: 'Stopwatch'});
                    if(mode === 'Focus' && !isActive) setTimeLeft(0);
                 }}
                 className={clsx("flex-1 text-sm font-bold py-1.5 rounded-lg transition-colors", config.timerType === 'Stopwatch' ? "bg-white dark:bg-gray-800 shadow-sm text-brand-text-primary" : "text-brand-text-secondary hover:text-brand-text-primary")}
               >
                 Stopwatch
               </button>
             </div>

             {config.timerType === 'Pomodoro' && (
               <div>
                  <label className="block text-xs font-semibold uppercase text-brand-text-secondary mb-2">Work Duration ({config.workDuration}m)</label>
                  <select 
                    value={config.workDuration} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setConfig({...config, workDuration: val});
                      if(mode==='Focus' && !isActive) setTimeLeft(val * 60);
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-brand-text-primary"
                  >
                    {[15, 20, 25, 30, 45, 60, 90, 120].map(v => <option key={v} value={v}>{v} minutes</option>)}
                  </select>
               </div>
             )}

             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Short Break</label>
                  <select 
                    value={config.shortBreak} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setConfig({...config, shortBreak: val});
                      if(mode==='Break' && sessionCount % config.longBreakAfter !== 0 && !isActive) setTimeLeft(val * 60);
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-brand-text-primary"
                  >
                    {[5, 10, 15].map(v => <option key={v} value={v}>{v}m</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Long Break</label>
                  <select 
                    value={config.longBreak} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setConfig({...config, longBreak: val});
                      if(mode==='Break' && sessionCount > 0 && sessionCount % config.longBreakAfter === 0 && !isActive) setTimeLeft(val * 60);
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-brand-text-primary"
                  >
                    {[15, 20, 30, 45].map(v => <option key={v} value={v}>{v}m</option>)}
                  </select>
               </div>
             </div>

             <div className="border-t border-brand-border mt-4 pt-4">
               <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-brand-text-primary"><Music className="w-4 h-4" /> Ambient Audio</h4>
               <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Soundscape</label>
                    <select 
                      value={config.ambientSound} 
                      onChange={e => setConfig({...config, ambientSound: e.target.value})}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-brand-text-primary"
                    >
                      {['None', 'Rain', 'Cafe', 'White Noise', 'Lofi'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Volume</label>
                    <input 
                      type="range"
                      min="0" max="100"
                      value={config.ambientVolume}
                      onChange={e => setConfig({...config, ambientVolume: parseInt(e.target.value)})}
                      className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                    />
                 </div>
               </div>
             </div>

             <div className="border-t border-brand-border mt-2 pt-4 grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Alarm
                  </label>
                  <select 
                    value={config.sound} 
                    onChange={e => {
                      const newSound = e.target.value;
                      setConfig({...config, sound: newSound});
                      playAlertSound(newSound, config.volume);
                    }}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-brand-text-primary"
                  >
                    {['None', 'Chime', 'Beep', 'Digital'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Volume</label>
                  <input 
                    type="range"
                    min="0" max="100"
                    value={config.volume}
                    onChange={e => setConfig({...config, volume: parseInt(e.target.value)})}
                    className="w-full h-1.5 bg-brand-border rounded-lg appearance-none cursor-pointer accent-primary mt-3"
                  />
               </div>
             </div>

             <div className="flex items-center justify-between pt-4 border-t border-brand-border">
               <label className="text-sm font-medium text-brand-text-secondary">Auto-start Next Round</label>
               <button 
                 onClick={() => setConfig({...config, autoStart: !config.autoStart})}
                 className={clsx("w-10 h-6 rounded-full transition-colors relative", config.autoStart ? "bg-primary" : "bg-brand-border border border-brand-border")}
               >
                 <motion.div 
                   className="w-4 h-4 bg-brand-surface rounded-full absolute top-1 shadow-sm"
                   animate={{ left: config.autoStart ? 20 : 4 }}
                   transition={{ type: "spring", stiffness: 500, damping: 30 }}
                 />
               </button>
             </div>
          </div>
       </div>
    </motion.div>
  );
}
