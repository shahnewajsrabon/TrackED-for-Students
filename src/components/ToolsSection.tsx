import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, Code2, Terminal, X, Play, Maximize2, Minimize2, Timer, Variable, PenTool, Hash, Copy, Check, GraduationCap, Palette, Trash2, Download, Volume2, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

type ToolModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isMaximized: boolean;
  setIsMaximized: (maximized: boolean) => void;
};

function ToolModal({ isOpen, onClose, title, icon, children, isMaximized, setIsMaximized }: ToolModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6 z-[100]">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative bg-brand-surface border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isMaximized ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-4xl max-h-[85vh] h-[600px]'}`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <h3 className="text-xl font-bold tracking-tight text-brand-text-primary">{title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-border transition-colors hidden sm:flex"
              >
                {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text-secondary hover:bg-danger hover:text-white hover:border-danger transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative z-0">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function CalculatorTool() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  
  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' || display === 'Error' ? num : display + num);
    }
  };
  
  const calculate = (a: number, b: number, op: string) => {
    let val = 0;
    if (op === '+') val = a + b;
    if (op === '-') val = a - b;
    if (op === '*') val = a * b;
    if (op === '/') val = a / b;
    return val;
  };

  const handleOp = (op: string) => {
    const currentValue = parseFloat(display);
    
    if (previousValue === null) {
      setPreviousValue(currentValue);
    } else if (operator && !waitingForNewValue) {
      const result = calculate(previousValue, currentValue, operator);
      const formattedResult = String(Math.round(result * 100000000) / 100000000);
      setDisplay(formattedResult);
      setPreviousValue(parseFloat(formattedResult));
    }
    
    setOperator(op);
    setWaitingForNewValue(true);
    setEquation(`${waitingForNewValue && previousValue !== null ? previousValue : display} ${op}`);
  };
  
  const handleEval = () => {
    if (operator && previousValue !== null) {
      const currentValue = parseFloat(display);
      const result = calculate(previousValue, currentValue, operator);
      const formattedResult = String(Math.round(result * 100000000) / 100000000);
      setDisplay(formattedResult);
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
      setEquation('');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 bg-brand-bg">
      <div className="w-full max-w-sm bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl">
        <div className="bg-brand-bg rounded-2xl p-4 mb-6 text-right border border-brand-border shadow-inner min-h-[100px] flex flex-col justify-end">
          <div className="text-brand-text-secondary text-sm font-medium mb-1 h-5">{equation}</div>
          <div className="text-4xl font-black text-brand-text-primary tracking-tight overflow-hidden text-ellipsis">{display}</div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={handleClear} className="col-span-2 py-4 bg-danger/10 text-danger hover:bg-danger hover:text-white font-bold rounded-2xl transition-colors">AC</button>
          <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="py-4 bg-warning/10 text-warning hover:bg-warning hover:text-white font-bold rounded-2xl transition-colors">DEL</button>
          <button onClick={() => handleOp('/')} className="py-4 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-2xl transition-colors">÷</button>
          
          <button onClick={() => handleNum('7')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">7</button>
          <button onClick={() => handleNum('8')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">8</button>
          <button onClick={() => handleNum('9')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">9</button>
          <button onClick={() => handleOp('*')} className="py-4 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-2xl transition-colors">×</button>
          
          <button onClick={() => handleNum('4')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">4</button>
          <button onClick={() => handleNum('5')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">5</button>
          <button onClick={() => handleNum('6')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">6</button>
          <button onClick={() => handleOp('-')} className="py-4 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-2xl transition-colors">−</button>
          
          <button onClick={() => handleNum('1')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">1</button>
          <button onClick={() => handleNum('2')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">2</button>
          <button onClick={() => handleNum('3')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">3</button>
          <button onClick={() => handleOp('+')} className="py-4 bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold rounded-2xl transition-colors">+</button>
          
          <button onClick={() => handleNum('0')} className="col-span-2 py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">0</button>
          <button onClick={() => handleNum('.')} className="py-4 bg-brand-bg hover:bg-brand-border text-brand-text-primary font-bold rounded-2xl transition-colors text-lg">.</button>
          <button onClick={handleEval} className="py-4 bg-success text-white hover:bg-success/90 font-bold rounded-2xl transition-colors shadow-lg shadow-success/20">=</button>
        </div>
      </div>
    </div>
  );
}

function HTMLRunner() {
  const [html, setHtml] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f3f4f6;
    }
    .card {
      background: white;
      padding: 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      text-align: center;
    }
    h1 { color: #534AB7; margin-top: 0; }
    button {
      background: #534AB7; color: white;
      border: none; padding: 0.5rem 1rem;
      border-radius: 0.5rem; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello, HTML!</h1>
    <p>Edit this code to see changes instantly.</p>
    <button onclick="alert('Button clicked!')">Click me</button>
  </div>
</body>
</html>`);

  return (
    <div className="flex flex-col sm:flex-row h-full">
      <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r border-brand-border flex flex-col">
        <div className="bg-brand-bg px-5 py-2.5 border-b border-brand-border flex items-center gap-2">
          <Code2 className="w-4 h-4 text-brand-text-secondary" />
          <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">HTML/CSS/JS Editor</span>
        </div>
        <textarea
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          className="w-full flex-1 p-4 bg-brand-surface text-brand-text-primary font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>
      <div className="w-full sm:w-1/2 flex flex-col bg-white">
        <div className="bg-brand-bg px-5 py-2.5 border-b border-brand-border flex items-center gap-2 border-t sm:border-t-0">
           <Play className="w-4 h-4 text-success" />
           <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Output Preview</span>
        </div>
        <iframe
          srcDoc={html}
          title="output"
          className="w-full flex-1 border-none bg-white"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}

function CRunner() {
  const [code, setCode] = useState(`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'c',
          version: '*',
          files: [{ content: code }]
        })
      });
      const data = await response.json();
      if (data.run && data.run.output) {
        setOutput(data.run.output);
      } else if (data.message) {
        setOutput('Error: ' + data.message);
      } else {
        setOutput('No output received.');
      }
    } catch (err) {
       console.error(err);
       setOutput('Failed to execute code. Please check your network connection.');
       toast.error('Code execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface">
       <div className="bg-brand-bg px-4 py-3 border-b border-brand-border flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Terminal className="w-4 h-4 text-brand-text-secondary" />
             <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">C Program Editor</span>
           </div>
           <button 
             onClick={runCode}
             disabled={isRunning}
             className="flex items-center gap-2 bg-success hover:bg-success/90 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isRunning ? (
               <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <Play className="w-4 h-4 fill-current" />
             )}
             Run Code
           </button>
        </div>
        <div className="flex-1 flex flex-col sm:flex-row h-full overflow-hidden">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full sm:w-2/3 h-1/2 sm:h-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
          <div className="w-full sm:w-1/3 h-1/2 sm:h-full bg-black text-white font-mono flex flex-col border-t sm:border-t-0 sm:border-l border-brand-border">
            <div className="bg-[#2d2d2d] px-3 py-1.5 text-xs font-bold text-gray-400">Terminal Output</div>
            <div className="p-4 overflow-auto flex-1 whitespace-pre-wrap text-sm">
              {output || <span className="text-gray-600 italic">Output will appear here...</span>}
            </div>
          </div>
        </div>
    </div>
  );
}

function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      toast.success(mode === 'work' ? 'Time for a break!' : 'Back to work!');
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-brand-bg p-6">
      <div className="bg-brand-surface p-8 sm:p-12 border border-brand-border rounded-3xl shadow-xl text-center max-w-sm w-full">
        <div className="flex bg-brand-bg p-1 rounded-2xl mb-8">
          <button 
            onClick={() => switchMode('work')}
            className={`flex-1 py-2 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base ${mode === 'work' ? 'bg-danger text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-surface'}`}
          >
            Pomodoro (25m)
          </button>
          <button 
            onClick={() => switchMode('break')}
            className={`flex-1 py-2 sm:py-3 rounded-2xl font-bold transition-all text-sm sm:text-base ${mode === 'break' ? 'bg-success text-white shadow-md' : 'text-brand-text-secondary hover:bg-brand-surface'}`}
          >
            Break (5m)
          </button>
        </div>
        
        <div className="text-7xl sm:text-8xl font-black text-brand-text-primary mb-10 tracking-tighter tabular-nums drop-shadow-sm">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={toggleTimer} 
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 ${isRunning ? 'bg-brand-bg border-4 border-brand-border text-brand-text-primary' : 'bg-primary text-white hover:bg-primary/90'}`}
          >
             {isRunning ? <Timer className="w-8 h-8 sm:w-10 sm:h-10" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitConverter() {
  const [value, setValue] = useState('1');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  
  const conversions: Record<string, Record<string, number>> = {
    length: {
      'm': 1, 'km': 1000, 'cm': 0.01, 'mm': 0.001,
      'in': 0.0254, 'ft': 0.3048, 'yd': 0.9144, 'mi': 1609.34
    },
    weight: {
      'kg': 1, 'g': 0.001, 'mg': 0.000001, 
      'lb': 0.453592, 'oz': 0.0283495
    }
  };

  const [category, setCategory] = useState<'length' | 'weight'>('length');

  const handleCategoryChange = (cat: 'length' | 'weight') => {
    setCategory(cat);
    const keys = Object.keys(conversions[cat]);
    setFromUnit(keys[0]);
    setToUnit(keys[1]);
  };

  const convert = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    const inBase = num * conversions[category][fromUnit];
    const out = inBase / conversions[category][toUnit];
    // Format to avoid long decimals
    return out.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <div className="flex flex-col items-center p-6 sm:p-10 bg-brand-bg h-full">
      <div className="w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-md mt-10">
        <div className="flex gap-2 mb-8">
           <button 
             onClick={() => handleCategoryChange('length')} 
             className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors ${category === 'length' ? 'bg-primary text-white' : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-primary'}`}
           >
             Length
           </button>
           <button 
             onClick={() => handleCategoryChange('weight')} 
             className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors ${category === 'weight' ? 'bg-primary text-white' : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-primary'}`}
           >
             Weight
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end mb-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider ml-1">From</label>
            <input 
              type="number" 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded-2xl px-4 py-3 text-lg font-bold shadow-inner focus:outline-none focus:ring-2 focus:ring-primary w-full"
            />
          </div>
          <select 
            value={fromUnit} 
            onChange={(e) => setFromUnit(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
          >
            {Object.keys(conversions[category]).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="flex justify-center my-2 text-brand-text-secondary">
          <Variable className="w-5 h-5 rotate-90 sm:rotate-0" />
        </div>

        <div className="grid grid-cols-2 gap-4 items-end mt-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider ml-1">To</label>
            <div className="bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-lg font-bold shadow-inner flex items-center w-full min-h-[52px] overflow-hidden text-ellipsis">
               {convert()}
            </div>
          </div>
          <select 
            value={toUnit} 
            onChange={(e) => setToUnit(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 text-lg font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
          >
            {Object.keys(conversions[category]).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function TextAnalyzer() {
  const [text, setText] = useState('');
  
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const charsCount = text.length;
  const noSpaceCount = text.replace(/\s+/g, '').length;
  const readingTime = Math.ceil(words / 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast.success("Text copied!");
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-brand-border border-b border-brand-border">
         <div className="bg-brand-bg p-4 flex flex-col justify-center items-center">
            <div className="text-2xl font-black text-brand-text-primary tracking-tight">{words}</div>
            <div className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mt-1">Words</div>
         </div>
         <div className="bg-brand-bg p-4 flex flex-col justify-center items-center">
            <div className="text-2xl font-black text-brand-text-primary tracking-tight">{charsCount}</div>
            <div className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mt-1">Characters</div>
         </div>
         <div className="bg-brand-bg p-4 flex flex-col justify-center items-center">
            <div className="text-2xl font-black text-brand-text-primary tracking-tight">{noSpaceCount}</div>
            <div className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mt-1">No Spaces</div>
         </div>
         <div className="bg-brand-bg p-4 flex flex-col justify-center items-center">
            <div className="text-2xl font-black text-brand-text-primary tracking-tight">{readingTime} <span className="text-lg">m</span></div>
            <div className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mt-1">Read Time</div>
         </div>
      </div>
      <div className="flex flex-col flex-1 relative bg-white">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type your essay/text here to analyze it..."
          className="w-full flex-1 p-6 sm:p-8 bg-transparent text-brand-text-primary font-medium text-lg resize-none focus:outline-none placeholder:text-brand-text-secondary/50"
        />
        {text && (
          <button 
            onClick={handleCopy}
            className="absolute bottom-6 right-6 bg-brand-surface border border-brand-border shadow-md hover:border-primary text-brand-text-secondary hover:text-primary rounded-2xl px-5 py-2.5 flex items-center gap-2 transition-all font-bold"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
        )}
      </div>
    </div>
  );
}

function GPACalculator() {
  const [courses, setCourses] = useState([{ id: 1, name: '', credits: 3, grade: 'A+' }]);
  const [gradingSystem, setGradingSystem] = useState<'ssc_hsc' | 'university'>('ssc_hsc');
  
  const bdSscHscGrades: Record<string, number> = {
    'A+': 5.0,
    'A': 4.0,
    'A-': 3.5,
    'B': 3.0,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0
  };

  const bdUniversityGrades: Record<string, number> = {
    'A+': 4.00,
    'A': 3.75,
    'A-': 3.50,
    'B+': 3.25,
    'B': 3.00,
    'B-': 2.75,
    'C+': 2.50,
    'C': 2.25,
    'D': 2.00,
    'F': 0.00
  };

  const gradePoints = gradingSystem === 'ssc_hsc' ? bdSscHscGrades : bdUniversityGrades;

  const addCourse = () => {
    setCourses([...courses, { id: Date.now(), name: '', credits: gradingSystem === 'ssc_hsc' ? 1 : 3, grade: 'A+' }]);
  };

  const updateCourse = (id: number, field: string, value: string | number) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCourse = (id: number) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const calculateGPA = () => {
    let totalCredits = 0;
    let totalPoints = 0;
    let hasFailed = false;
    
    courses.forEach(c => {
      const credits = Number(c.credits) || 0;
      if (credits > 0) {
        totalCredits += credits;
        const pts = gradePoints[c.grade] || 0;
        totalPoints += credits * pts;
        if (pts === 0) hasFailed = true;
      }
    });
    
    // In SSC/HSC, failing one subject usually means failing the whole exam (GPA 0.00)
    // We'll just show the raw GPA calculation but maybe users want to know their points.
    // For universal calculation, we simply return totalPoints / totalCredits.
    if (totalCredits === 0) return '0.00';
    return (totalPoints / totalCredits).toFixed(2);
  };

  const handleSystemChange = (sys: 'ssc_hsc' | 'university') => {
    setGradingSystem(sys);
    // Reset courses when switching system to avoid invalid grades
    setCourses([{ id: Date.now(), name: '', credits: sys === 'ssc_hsc' ? 1 : 3, grade: 'A+' }]);
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg md:p-6 overflow-hidden">
      <div className="bg-brand-surface sm:rounded-2xl border border-brand-border shadow-xl flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
        <div className="bg-primary/5 p-6 sm:p-8 border-b border-brand-border text-center relative">
           <div className="flex justify-center gap-2 mb-4">
             <button 
               onClick={() => handleSystemChange('ssc_hsc')}
               className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${gradingSystem === 'ssc_hsc' ? 'bg-primary text-white shadow-sm' : 'bg-brand-surface border border-brand-border text-brand-text-secondary hover:text-brand-text-primary'}`}
             >
               SSC / HSC (Max 5.0)
             </button>
             <button 
               onClick={() => handleSystemChange('university')}
               className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${gradingSystem === 'university' ? 'bg-primary text-white shadow-sm' : 'bg-brand-surface border border-brand-border text-brand-text-secondary hover:text-brand-text-primary'}`}
             >
               University (UGC Max 4.0)
             </button>
           </div>
           <div className="text-xl font-bold text-brand-text-secondary mb-2 uppercase tracking-wide">Cumulative GPA</div>
           <div className="text-6xl sm:text-7xl font-black text-primary tracking-tighter">{calculateGPA()}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 text-xs font-bold text-brand-text-secondary uppercase tracking-wider hidden sm:grid">
            <div className="col-span-6">Subject</div>
            <div className="col-span-3">{gradingSystem === 'ssc_hsc' ? 'Weight' : 'Credits'}</div>
            <div className="col-span-3">Grade</div>
          </div>
          {courses.map(course => (
            <div key={course.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-brand-bg p-4 sm:p-2 sm:px-4 rounded-2xl border border-brand-border relative">
              <div className="col-span-6 w-full relative group">
                 <input 
                   type="text" 
                   value={course.name}
                   onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                   placeholder="Subject (optional)"
                   className="w-full bg-transparent font-medium border-b border-transparent focus:border-primary px-2 py-1 outline-none transition-colors"
                 />
              </div>
              <div className="col-span-3 w-full flex items-center justify-between sm:justify-start gap-2">
                 <span className="sm:hidden text-xs font-bold text-brand-text-secondary uppercase">{gradingSystem === 'ssc_hsc' ? 'Weight:' : 'Credits:'}</span>
                 <input 
                   type="number" 
                   value={course.credits}
                   min="0.5" max="10" step="0.5"
                   onChange={(e) => updateCourse(course.id, 'credits', Number(e.target.value))}
                   className="w-full sm:w-20 bg-brand-surface border border-brand-border rounded-2xl px-3 py-2 text-center font-bold outline-none focus:border-primary"
                 />
              </div>
              <div className="col-span-3 w-full flex items-center justify-between gap-2">
                 <span className="sm:hidden text-xs font-bold text-brand-text-secondary uppercase">Grade:</span>
                 <div className="flex items-center gap-2 w-full sm:w-auto">
                   <select 
                     value={course.grade}
                     onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                     className="w-full sm:w-24 bg-brand-surface border border-brand-border rounded-2xl px-3 py-2 font-bold outline-none focus:border-primary appearance-none"
                   >
                     {Object.keys(gradePoints).map(g => <option key={g} value={g}>{g}</option>)}
                   </select>
                   <button onClick={() => removeCourse(course.id)} className="p-2 text-brand-text-secondary hover:text-danger hover:bg-danger/10 rounded-2xl transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
              </div>
            </div>
          ))}
          <button 
            onClick={addCourse}
            className="w-full py-4 border-2 border-dashed border-brand-border rounded-2xl text-brand-text-secondary font-bold hover:bg-brand-bg hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            + Add Subject
          </button>
        </div>
      </div>
    </div>
  );
}

function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#534AB7');
  const [brushSize, setBrushSize] = useState(3);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height); // white background
        setContext(ctx);
      }
    }
    
    // Handle resizing
    const handleResize = () => {
      if (canvas && context) {
         const tempCanvas = document.createElement('canvas');
         tempCanvas.width = canvas.width;
         tempCanvas.height = canvas.height;
         const tCtx = tempCanvas.getContext('2d');
         tCtx?.drawImage(canvas, 0, 0);

         canvas.width = canvas.offsetWidth;
         canvas.height = canvas.offsetHeight;
         context.lineCap = 'round';
         context.lineJoin = 'round';
         context.drawImage(tempCanvas, 0, 0);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [context]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    context?.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    let x, y;
    if ('touches' in e) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    context.lineWidth = brushSize;
    context.strokeStyle = color;
    
    context.lineTo(x, y);
    context.stroke();
    context.beginPath();
    context.moveTo(x, y);
  };

  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const downloadCanvas = () => {
     if (canvasRef.current) {
       const url = canvasRef.current.toDataURL('image/png');
       const a = document.createElement('a');
       a.href = url;
       a.download = 'whiteboard.png';
       a.click();
     }
  };

  const colors = ['#534AB7', '#E11D48', '#16A34A', '#D97706', '#000000', '#FFFFFF'];

  return (
    <div className="flex flex-col h-full bg-brand-surface">
      <div className="flex flex-wrap items-center gap-4 bg-brand-bg px-4 py-3 border-b border-brand-border">
         <div className="flex items-center gap-2">
            {colors.map(c => (
              <button 
                key={c}
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform ${color === c ? 'scale-110 border-brand-text-primary' : 'border-black/10'}`}
                style={{ backgroundColor: c }}
                title={c === '#FFFFFF' ? 'Eraser' : 'Color'}
              >
                {c === '#FFFFFF' && <span className="text-[10px] text-gray-400">Eraser</span>}
              </button>
            ))}
         </div>
         <div className="w-px h-6 bg-brand-border hidden sm:block"></div>
         <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider">Size</span>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-24 accent-primary"
            />
         </div>
         <div className="ml-auto w-full sm:w-auto flex items-center justify-end gap-2">
           <button onClick={clearCanvas} className="text-sm font-bold text-danger hover:bg-danger/10 px-3 py-1.5 rounded-2xl transition-colors">Clear</button>
           <button onClick={downloadCanvas} className="text-sm font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-2xl transition-colors flex items-center gap-2">
             <Download className="w-4 h-4" /> Save
           </button>
         </div>
      </div>
      <div className="flex-1 w-full bg-brand-surface relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
      </div>
    </div>
  );
}

function TextToSpeech() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Puck');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    setIsGenerating(true);
    setAudioUrl(null);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate speech');
      if (data.audio) {
        const url = `data:audio/wav;base64,${data.audio}`;
        setAudioUrl(url);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg md:p-6 overflow-hidden">
      <div className="bg-brand-surface sm:rounded-2xl border border-brand-border shadow-xl flex flex-col h-full max-w-3xl mx-auto w-full overflow-hidden">
        <div className="p-6 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
            <span className="font-bold text-brand-text-primary">Gemini TTS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-text-secondary uppercase">Voice:</span>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="bg-brand-bg border border-brand-border rounded-2xl px-3 py-1.5 text-sm font-bold outline-none focus:border-primary cursor-pointer"
            >
              <option value="Puck">Voice 1</option>
              <option value="Charon">Voice 2</option>
              <option value="Kore">Voice 3</option>
              <option value="Fenrir">Voice 4</option>
              <option value="Zephyr">Voice 5</option>
            </select>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type anything here to synthesize it into natural-sounding speech..."
            className="w-full flex-1 p-4 bg-brand-bg rounded-2xl border border-brand-border text-brand-text-primary text-lg resize-none focus:outline-none focus:border-primary transition-colors"
          />
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between mt-auto">
             <div className="w-full sm:w-auto h-12 flex-1">
                {audioUrl && (
                  <audio controls src={audioUrl} className="w-full max-w-xs h-full bg-brand-bg rounded-2xl" autoPlay />
                )}
             </div>
             <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className="w-full sm:w-auto bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white font-bold px-8 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
             >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                <span>{isGenerating ? 'Generating...' : 'Synthesize Audio'}</span>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToolsSection() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!activeTool) setIsMaximized(false);
  }, [activeTool]);

  const tools = [
    {
      id: 'calculator',
      title: 'Calculator',
      icon: <Calculator className="w-6 h-6" />,
      color: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white',
      borderColor: 'hover:border-primary',
      desc: 'Quick calculations for math and physics'
    },
    {
      id: 'html',
      title: 'HTML Runner',
      icon: <Code2 className="w-6 h-6" />,
      color: 'bg-success/10 text-success group-hover:bg-success group-hover:text-white',
      borderColor: 'hover:border-success',
      desc: 'Instant HTML/CSS/JS preview playground'
    },
    {
      id: 'c',
      title: 'C Program Runner',
      icon: <Terminal className="w-6 h-6" />,
      color: 'bg-info/10 text-info group-hover:bg-info group-hover:text-white',
      borderColor: 'hover:border-info',
      desc: 'Compile & run simple C snippets quickly'
    },
    {
      id: 'pomodoro',
      title: 'Pomodoro Timer',
      icon: <Timer className="w-6 h-6" />,
      color: 'bg-danger/10 text-danger group-hover:bg-danger group-hover:text-white',
      borderColor: 'hover:border-danger',
      desc: 'Stay focused with 25m work sessions'
    },
    {
      id: 'unit',
      title: 'Unit Converter',
      icon: <Variable className="w-6 h-6" />,
      color: 'bg-warning/10 text-warning-foreground group-hover:bg-warning group-hover:text-white',
      borderColor: 'hover:border-warning',
      desc: 'Convert length, weight, and more'
    },
    {
      id: 'text',
      title: 'Text Analyzer',
      icon: <Hash className="w-6 h-6" />,
      color: 'bg-brand-text-secondary/10 text-brand-text-secondary group-hover:bg-brand-text-secondary group-hover:text-white',
      borderColor: 'hover:border-brand-text-secondary',
      desc: 'Word count and reading time'
    },
    {
      id: 'gpa',
      title: 'GPA Calculator',
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white',
      borderColor: 'hover:border-[#8B5CF6]',
      desc: 'Calculate college or high school GPA'
    },
    {
      id: 'tts',
      title: 'Text to Speech',
      icon: <Volume2 className="w-6 h-6" />,
      color: 'bg-[#8B5CF6]/10 text-[#8B5CF6] group-hover:bg-[#8B5CF6] group-hover:text-white',
      borderColor: 'hover:border-[#8B5CF6]',
      desc: 'Natural-sounding speech with Gemini TTS'
    },
    {
      id: 'whiteboard',
      title: 'Whiteboard',
      icon: <Palette className="w-6 h-6" />,
      color: 'bg-[#EC4899]/10 text-[#EC4899] group-hover:bg-[#EC4899] group-hover:text-white',
      borderColor: 'hover:border-[#EC4899]',
      desc: 'Draw, sketch and write notes'
    }
  ];

  return (
    <>
      <section className="bg-brand-surface shadow hover:shadow-md transition-all duration-300 p-8 md:p-10 rounded-2xl border border-brand-border mt-8">
        <h2 className="text-2xl font-bold mb-6 text-brand-text-primary flex items-center gap-3">
           <div className="p-2.5 bg-brand-text-secondary/10 rounded-2xl text-brand-text-secondary">
             <Terminal className="w-6 h-6" />
           </div>
           Student Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`group text-left p-5 rounded-2xl border border-brand-border bg-brand-bg transition-all duration-300 hover:shadow-md ${tool.borderColor} outline-none flex flex-col gap-4`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${tool.color}`}>
                {tool.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-brand-text-primary mb-1">{tool.title}</h3>
                <p className="text-sm font-medium text-brand-text-secondary leading-snug">{tool.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeTool === 'calculator' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Calculator"
          icon={<Calculator className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <CalculatorTool />
        </ToolModal>
      )}

      {activeTool === 'html' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="HTML Playground"
          icon={<Code2 className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <HTMLRunner />
        </ToolModal>
      )}

      {activeTool === 'c' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="C Language Runner"
          icon={<Terminal className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <CRunner />
        </ToolModal>
      )}

      {activeTool === 'pomodoro' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Pomodoro Timer"
          icon={<Timer className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <PomodoroTimer />
        </ToolModal>
      )}

      {activeTool === 'unit' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Unit Converter"
          icon={<Variable className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <UnitConverter />
        </ToolModal>
      )}

      {activeTool === 'text' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Text Analyzer"
          icon={<Hash className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <TextAnalyzer />
        </ToolModal>
      )}

      {activeTool === 'gpa' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="GPA Calculator"
          icon={<GraduationCap className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <GPACalculator />
        </ToolModal>
      )}

      {activeTool === 'tts' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Text to Speech"
          icon={<Volume2 className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <TextToSpeech />
        </ToolModal>
      )}

      {activeTool === 'whiteboard' && (
        <ToolModal 
          isOpen={true} 
          onClose={() => setActiveTool(null)} 
          title="Whiteboard"
          icon={<Palette className="w-6 h-6" />}
          isMaximized={isMaximized}
          setIsMaximized={setIsMaximized}
        >
          <Whiteboard />
        </ToolModal>
      )}
    </>
  );
}
