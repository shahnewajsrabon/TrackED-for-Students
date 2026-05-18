import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubjects } from '@/hooks/useSubjects';
import { useSession } from '@/hooks/useSession';
import { Session, TimerState } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import FocusRatingModal from '@/components/FocusRatingModal';
import TimerSettingsPanel from '@/components/TimerSettingsPanel';
import { Play, Pause, Square, Maximize, ExternalLink, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ambientAudio } from '@/lib/audio';
import confetti from 'canvas-confetti';

const DEFAULT_TIMER_STATE: TimerState = {
  subjectId: null,
  workDuration: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakAfter: 4,
  autoStart: false,
  sound: 'Chime',
  volume: 50,
  timerType: 'Pomodoro',
  ambientSound: 'None',
  ambientVolume: 30
};

const playAlertSound = (type: string, volume: number) => {
  if (type === 'None') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const vol = volume / 100;
    
    if (type === 'Beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);
      osc.stop(ctx.currentTime + 1);
    } else if (type === 'Chime') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(); osc2.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 2);
      osc1.stop(ctx.currentTime + 2);
      osc2.stop(ctx.currentTime + 2);
    } else if (type === 'Digital') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(vol, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(vol, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch (err) {
    console.error('Audio playback error', err);
  }
};

export default function TimerPage() {
  const { subjects, loading: subjectsLoading } = useSubjects();
  const { saveSession, getTodaySessions } = useSession();
  
  const [config, setConfig] = useState<TimerState>(() => {
    const saved = localStorage.getItem('trackEd_timerState');
    return saved ? JSON.parse(saved) : DEFAULT_TIMER_STATE;
  });

  const [timeLeft, setTimeLeft] = useState(config.workDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [mode, setMode] = useState<'Focus' | 'Break'>('Focus');
  const [sessionCount, setSessionCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isStrictMode, setIsStrictMode] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  // Stop ambient audio on unmount or mode change if not focus
  useEffect(() => {
    if (isActive && mode === 'Focus') {
      ambientAudio.playMode(config.ambientSound, config.ambientVolume);
    } else {
      ambientAudio.stop();
    }
    return () => ambientAudio.stop();
  }, [isActive, mode, config.ambientSound, config.ambientVolume]);

  useEffect(() => {
    // Restore active timer state
    const savedActive = localStorage.getItem('trackEd_activeTimer');
    if (savedActive) {
      try {
        const parsed = JSON.parse(savedActive);
        if (parsed.isActive && parsed.endTime) {
          if (parsed.timerType === 'Stopwatch') {
            setTimeLeft(Math.floor((Date.now() - new Date(parsed.sessionStartTime).getTime()) / 1000));
          } else {
            const rem = Math.max(0, Math.round((parsed.endTime - Date.now()) / 1000));
            setTimeLeft(rem);
            if (rem === 0) {
              parsed.isActive = false;
            }
          }
          setIsActive(parsed.isActive);
          setEndTime(parsed.endTime);
          setMode(parsed.mode);
          setSessionCount(parsed.sessionCount);
          if (parsed.sessionStartTime) setSessionStartTime(new Date(parsed.sessionStartTime));
        }
      } catch (e) { console.error('Failed to parse active timer'); }
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Save active state
    if (sessionStartTime || isActive) {
      localStorage.setItem('trackEd_activeTimer', JSON.stringify({
        isActive,
        endTime,
        mode,
        sessionCount,
        sessionStartTime: sessionStartTime?.toISOString() || null,
        timerType: config.timerType
      }));
    } else {
      localStorage.removeItem('trackEd_activeTimer');
    }
  }, [isActive, endTime, mode, sessionCount, sessionStartTime, config.timerType]);

  useEffect(() => {
    getTodaySessions().then(setTodaySessions);
  }, [getTodaySessions]);

  useEffect(() => {
    localStorage.setItem('trackEd_timerState', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    let worker: Worker | null = null;
    
    if (isActive) {
      worker = new Worker(new URL('../lib/timerWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = () => {
        const now = Date.now();
        
        if (config.timerType === 'Stopwatch') {
           const diff = Math.floor((now - (sessionStartTime?.getTime() || now)) / 1000);
           setTimeLeft(diff);
        } else {
           if (endTime) {
             const remaining = Math.max(0, Math.round((endTime - now) / 1000));
             setTimeLeft(remaining);

             if (remaining === 0) {
               setIsActive(false);
               setEndTime(null);
               handleComplete();
             }
           }
        }
      };
      worker.postMessage('start');
    }
    
    return () => {
      if (worker) {
        worker.postMessage('stop');
        worker.terminate();
      }
    };
  }, [isActive, endTime, config.timerType, sessionStartTime]);

  const handleComplete = () => {
    setIsActive(false);
    setEndTime(null);
    playAlertSound(config.sound, config.volume);
    
    ambientAudio.playUISound('complete');
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#534AB7', '#1D9E75', '#F59E0B']
    });

    if (mode === 'Focus') {
      setShowRatingModal(true);
    } else {
      switchMode('Focus', config.workDuration, config.autoStart);
    }
  };

  const forceStopStopwatch = () => {
    setIsActive(false);
    setEndTime(null);
    setShowRatingModal(true);
  };

  const saveCurrentSession = async (rating: number, mood: string, note: string) => {
    setShowRatingModal(false);
    
    const activeSubject = subjects.find(s => s.id === config.subjectId) || subjects[0];
    if (!activeSubject) {
      const m = (sessionCount + 1) % config.longBreakAfter === 0 ? config.longBreak : config.shortBreak;
      switchMode('Break', m, config.autoStart);
      return; 
    }

    const completedAt = new Date();
    
    let actualDurationMins = config.workDuration;
    if (config.timerType === 'Stopwatch') {
      actualDurationMins = Math.max(1, Math.round(timeLeft / 60)); // Round up to nearest minute, minimum 1
    }
    
    await saveSession({
      subject_name: activeSubject.name,
      subject_color: activeSubject.color,
      duration_mins: actualDurationMins,
      focus_rating: rating,
      mood: mood,
      note: note,
      started_at: (sessionStartTime || new Date(Date.now() - actualDurationMins * 60000)).toISOString(),
      completed_at: completedAt.toISOString()
    });

    const newSessions = await getTodaySessions();
    setTodaySessions(newSessions);

    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    
    const m = (newCount % config.longBreakAfter === 0) ? config.longBreak : config.shortBreak;
    switchMode('Break', m, config.autoStart);
  };

  const switchMode = (newMode: 'Focus' | 'Break', durationMins?: number, shouldStart: boolean = false) => {
    setMode(newMode);
    
    if (newMode === 'Focus' && config.timerType === 'Stopwatch') {
      setTimeLeft(0);
      setSessionStartTime(null);
    } else {
      const m = durationMins || config.workDuration;
      setTimeLeft(m * 60);
      if (shouldStart) {
        setEndTime(Date.now() + (m * 60 * 1000));
        setIsActive(true);
      } else {
        setIsActive(false);
        setEndTime(null);
      }
    }
  };

  const startTimer = () => {
    ambientAudio.playUISound('pop');
    if (mode === 'Focus' && !sessionStartTime) {
      setSessionStartTime(new Date());
    }
    if (mode === 'Focus' && config.timerType === 'Stopwatch') {
       if (timeLeft > 0) {
         setSessionStartTime(new Date(Date.now() - (timeLeft * 1000)));
       }
    } else {
       setEndTime(Date.now() + (timeLeft * 1000));
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    ambientAudio.playUISound('pop');
    setIsActive(false);
    setEndTime(null);
  };

  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = () => {
    ambientAudio.playUISound('pop');
    setIsActive(false);
    setEndTime(null);
    setSessionStartTime(null);
    if (mode === 'Focus' && config.timerType === 'Stopwatch') {
      setTimeLeft(0);
    } else {
      setTimeLeft((mode === 'Focus' ? config.workDuration : config.shortBreak) * 60);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false));
      }
    }
  };

  useEffect(() => {
    const handleEsc = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleEsc);
    return () => document.removeEventListener('fullscreenchange', handleEsc);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const h = Math.floor(m / 60);
    const mDisplay = h > 0 ? (m % 60).toString().padStart(2, '0') : m.toString().padStart(2, '0');
    return h > 0 
      ? `${h}:${mDisplay}:${s.toString().padStart(2, '0')}`
      : `${mDisplay}:${s.toString().padStart(2, '0')}`;
  };

  const applyPreset = (work: number, short: number, long: number) => {
    setConfig(prev => ({...prev, workDuration: work, shortBreak: short, longBreak: long}));
    if (mode === 'Focus') setTimeLeft(work * 60);
    ambientAudio.playUISound('pop');
  };

  const togglePiP = async () => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
      return;
    }
    if ('documentPictureInPicture' in window) {
      try {
        const dpip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 380,
        });
        dpip.addEventListener('pagehide', () => setPipWindow(null));
        
        // Copy styles
        document.head.querySelectorAll('style').forEach(s => {
          dpip.document.head.appendChild(s.cloneNode(true));
        });
        document.head.querySelectorAll('link[rel="stylesheet"]').forEach(l => {
          dpip.document.head.appendChild(l.cloneNode(true));
        });
        
        dpip.document.body.className = "bg-brand-bg text-brand-text-primary h-screen w-screen m-0 p-0 overflow-hidden font-sans flex items-center justify-center";
        
        // Add a root div
        const rootDiv = document.createElement('div');
        rootDiv.id = 'pip-root';
        rootDiv.className = 'w-full h-full flex flex-col items-center justify-center';
        dpip.document.body.appendChild(rootDiv);
        
        setPipWindow(dpip);
      } catch(err) {
        console.error("PiP failed", err);
      } 
    } else {
      alert("Document Picture-in-Picture API is not supported in your browser.");
    }
  };

  const radius = 150;
  const circumfer = 2 * Math.PI * radius;
  
  let strokeDashoffset = circumfer;
  if (config.timerType === 'Stopwatch') {
     // Stopwatch circle pulses or fills completely? Let's just have it slowly fill over 1 hour
     const totalSec = 3600; // 1 hr visually
     strokeDashoffset = circumfer - ((timeLeft % totalSec) / totalSec) * circumfer;
  } else {
     const totalSeconds = (mode === 'Focus' ? config.workDuration : 
                           (sessionCount > 0 && sessionCount % config.longBreakAfter === 0 ? config.longBreak : config.shortBreak)) * 60;
     strokeDashoffset = circumfer - (timeLeft / totalSeconds) * circumfer;
  }

  if (subjectsLoading) return <LoadingSpinner />;

  return (
    <div className={clsx("flex flex-col md:flex-row gap-8 w-full", isFullScreen && "fixed inset-0 z-50 bg-brand-bg p-8 items-center justify-center")}>
      
      {/* Main Timer Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Atmospheric Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="bg-brand-surface/80 backdrop-blur-3xl p-8 md:p-14 rounded-3xl shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-shadow border border-brand-border flex flex-col items-center w-full max-w-xl relative group z-10"
        >
              <button 
                onClick={togglePiP}
                className="absolute top-6 right-16 p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors opacity-0 group-hover:opacity-100 bg-brand-bg rounded-2xl border border-brand-border"
                title="Picture-in-Picture"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleFullScreen}
                className="absolute top-6 right-6 p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors opacity-0 group-hover:opacity-100 bg-brand-bg rounded-2xl border border-brand-border"
                title="Full Screen"
              >
                <Maximize className="w-5 h-5" />
              </button>

              <div className={clsx("px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 transition-colors border", 
                mode === 'Focus' ? "bg-primary/10 text-primary border-primary/20" : "bg-success/10 text-success border-success/20"
              )}>
                {mode === 'Focus' ? (config.timerType === 'Stopwatch' ? 'Stopwatch Mode' : 'Focus Session') : 'Break Time'}
              </div>

              <div className="relative flex items-center justify-center mb-10">
                 <svg width="340" height="340" className="transform -rotate-90 drop-shadow-sm">
                   <circle cx="170" cy="170" r={150} stroke="rgba(150, 150, 150, 0.1)" strokeWidth="12" fill="none" />
                   <motion.circle 
                     cx="170" cy="170" r={150} 
                     stroke={mode === 'Focus' ? "#534AB7" : "#1D9E75"} 
                     strokeWidth="12" fill="none" strokeLinecap="round"
                     animate={{ strokeDashoffset }}
                     transition={{ duration: 1, ease: 'linear' }}
                     style={{ strokeDasharray: circumfer }}
                   />
                 </svg>
                 <div className="absolute flex flex-col items-center justify-center">
                   <div className={clsx("font-black font-mono tracking-tighter text-brand-text-primary leading-none drop-shadow-md", timeLeft >= 3600 ? "text-[4.5rem]" : "text-[5rem]")}>
                     {formatTime(timeLeft)}
                   </div>
                   <div className="mt-4 text-brand-text-secondary font-bold uppercase tracking-widest text-sm px-4 py-1.5 bg-brand-bg rounded-lg border border-brand-border">
                     {subjects.find(s => s.id === config.subjectId)?.name || 'No subject'}
                   </div>
                 </div>
              </div>

              <div className="flex items-center gap-6">
                {isActive ? (
                   <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTimer} className="w-20 h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-text-primary rounded-full transition-colors shadow-inner">
                     <Pause className="w-8 h-8 fill-current" />
                   </motion.button>
                ) : (
                   <motion.button 
                     whileTap={{ scale: 0.9 }}
                     onClick={toggleTimer} 
                     disabled={mode === 'Focus' && !config.subjectId && subjects.length > 0}
                     className="w-24 h-24 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-full transition-transform shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                     <Play className="w-10 h-10 fill-current ml-2" />
                   </motion.button>
                )}
                
                <motion.button whileTap={{ scale: 0.9 }} onClick={resetTimer} className="w-16 h-16 flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-brand-text-primary rounded-full transition-colors border border-brand-border shadow-sm">
                  <Square className="w-6 h-6 fill-current" />
                </motion.button>

                {config.timerType === 'Stopwatch' && mode === 'Focus' && (isActive || timeLeft > 0) && (
                   <motion.button 
                     whileTap={{ scale: 0.9 }} 
                     onClick={forceStopStopwatch} 
                     className="w-20 h-12 px-4 flex items-center justify-center bg-danger hover:bg-danger/90 text-white rounded-2xl transition-colors shadow-sm font-bold uppercase tracking-wider text-xs ml-2"
                   >
                     Finish
                   </motion.button>
                )}
              </div>
              
              {/* Quick Presets */}
              {!isActive && mode === 'Focus' && config.timerType !== 'Stopwatch' && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => applyPreset(25, 5, 15)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Pomodoro 25/5</button>
                  <button onClick={() => applyPreset(50, 10, 20)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Long 50/10</button>
                  <button onClick={() => applyPreset(90, 15, 30)} className="px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border text-xs font-bold text-brand-text-secondary hover:text-primary transition-colors">Deep Work 90m</button>
                </div>
              )}
            </motion.div>

        {!isFullScreen && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-xl mt-8 bg-brand-surface rounded-2xl p-8 border border-brand-border shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-bold mb-6 text-brand-text-primary flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_var(--color-primary)]"></div> Today's Sessions</h3>
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-hide">
               {todaySessions.length === 0 ? (
                 <p className="text-center text-brand-text-secondary text-sm font-medium py-8 bg-brand-bg rounded-2xl border border-dashed border-brand-border">No sessions completed yet today.</p>
               ) : (
                 todaySessions.map(s => (
                   <div key={s.id} className="flex justify-between items-center p-4 bg-brand-bg rounded-2xl border border-brand-border shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: s.subject_color }} />
                        <span className="font-bold">{s.subject_name}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-brand-text-secondary font-bold">
                        <span className="bg-brand-surface px-2 py-1 rounded-md border border-brand-border">{s.duration_mins}m</span>
                        <div className="flex items-center text-warning bg-warning/10 px-2 py-1 rounded-md">
                          {s.focus_rating} <span className="text-[10px] ml-0.5">★</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest">{format(new Date(s.completed_at), 'HH:mm')}</span>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Config Panel */}
      {!isFullScreen && (
        <TimerSettingsPanel 
          config={config} 
          setConfig={setConfig} 
          subjects={subjects} 
          mode={mode} 
          isActive={isActive} 
          sessionCount={sessionCount} 
          setTimeLeft={setTimeLeft} 
          playAlertSound={playAlertSound} 
        />
      )}

      <FocusRatingModal 
        isOpen={showRatingModal} 
        onSave={saveCurrentSession} 
      />

      {pipWindow && pipWindow.document.getElementById('pip-root') && createPortal(
        <div className="flex flex-col items-center justify-center p-6 bg-brand-surface w-full h-full">
           <div className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-2">
             {mode === 'Focus' ? 'Focus Session' : 'Break Time'}
           </div>
           <div className={clsx("font-black font-mono tracking-tighter text-brand-text-primary leading-none mb-6", timeLeft >= 3600 ? "text-5xl" : "text-6xl")}>
             {formatTime(timeLeft)}
           </div>
           <div className="flex gap-4">
             {isActive ? (
                <button onClick={toggleTimer} className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-brand-text-primary rounded-full transition-colors">
                  <Pause className="w-5 h-5 fill-current" />
                </button>
             ) : (
                <button onClick={toggleTimer} className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full transition-colors">
                  <Play className="w-5 h-5 fill-current ml-1" />
                </button>
             )}
           </div>
        </div>,
        pipWindow.document.getElementById('pip-root')!
      )}
    </div>
  );
}
