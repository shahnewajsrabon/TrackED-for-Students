import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minimize2, Maximize2, Sparkles, Loader2, Trash2, Mail, Mic, Scan, Zap, BrainCircuit, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';
import { useAuth } from '@/hooks/useAuth';

interface MessagePart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  }
}

interface Message {
  role: 'user' | 'model';
  parts: MessagePart[];
}

export default function ChatBotWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const initialMessages: Message[] = [
    { role: 'model', parts: [{ text: "Hi there! I'm your AI tutor and assistant. How can I help you today?" }] }
  ];
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chatbot_messages_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return initialMessages;
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // New State variables for features
  const [isFastMode, setIsFastMode] = useState(true);
  const [isReasoningMode, setIsReasoningMode] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, previewUrl: string} | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    localStorage.setItem('chatbot_messages_v2', JSON.stringify(messages));
  }, [messages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  
  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image should be less than 5MB");
      return;
    }
    
    const reader = new FileReader();
    const previewUrl = URL.createObjectURL(file);
    
    reader.onload = (ev) => {
      const base64d = ev.target?.result?.toString().split(',')[1];
      if (base64d) {
        setAttachment({
          data: base64d,
          mimeType: file.type,
          previewUrl
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Speech Recognition for Voice Chat
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start speech recognition", e);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image should be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      const previewUrl = URL.createObjectURL(file);
      
      reader.onload = (ev) => {
        const base64d = ev.target?.result?.toString().split(',')[1];
        if (base64d) {
          setAttachment({
            data: base64d,
            mimeType: file.type,
            previewUrl
          });
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitAIRequest = async (actualText: string, contextMessages: Message[], displayAttachment?: any) => {
    try {
      let targetModel = 'gemini-3.1-flash-lite';
      let thinkingConfig: any = undefined;
      
      if (isReasoningMode) {
         targetModel = 'gemini-3-flash-preview';
         thinkingConfig = { thinkingLevel: "HIGH" };
      } else if (contextMessages.some(m => m.parts.some(p => p.inlineData))) {
         targetModel = 'gemini-3-flash-preview';
      } else if (!isFastMode) {
         targetModel = 'gemini-3-flash-preview';
      }

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          contents: contextMessages.map(m => ({
            role: m.role,
            parts: m.parts.map(p => {
               if (p.text) return { text: p.text };
               if (p.inlineData) return { inlineData: p.inlineData };
               return { text: '' };
            })
          })),
          config: {
            thinkingConfig,
            systemInstruction: "You are a helpful, encouraging, and highly intelligent AI tutor for a student focusing app. Be concise, inspiring, and provide step-by-step explanations for complex problems.",
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages(msgs => {
        // Find the placeholder user message to replace if we used a display override, or just append
        // Wait, the display message is already in `messages` state. We just append the AI response.
        return [...msgs, { role: 'model', parts: [{ text: data.text }] }];
      });
    } catch (err: any) {
      console.error(err);
      setMessages(msgs => [...msgs, { role: 'model', parts: [{ text: "Sorry, I ran into an error. Please try again." }] }]);
    } finally {
      setIsLoading(false);
      if (displayAttachment?.previewUrl) {
         URL.revokeObjectURL(displayAttachment.previewUrl);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachment) || isLoading) return;

    const parts: MessagePart[] = [];
    if (input.trim()) {
      parts.push({ text: input.trim() });
    }
    if (attachment) {
      parts.push({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
    }

    const userMessage: Message = { role: 'user', parts };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    const currentAttachmentUrl = attachment?.previewUrl;
    const currentAttachment = attachment;
    setAttachment(null);
    setIsLoading(true);

    await submitAIRequest(input.trim(), newMessages, currentAttachment);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 p-4 bg-primary text-white rounded-full shadow-xl hover:shadow-primary/30 transition-shadow active:scale-95 group"
          >
            <Sparkles className="absolute top-0 right-0 w-4 h-4 text-white opacity-0 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:translate-x-2 transition-all duration-300" />
            <MessageCircle className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={clsx(
              "fixed z-50 bg-brand-surface border border-brand-border shadow-2xl flex flex-col overflow-hidden transition-all duration-300",
              isExpanded 
                ? "bottom-0 right-0 md:bottom-6 md:right-6 w-full h-[100dvh] md:h-[85vh] md:w-[600px] md:rounded-2xl" 
                : "bottom-0 right-0 md:bottom-6 md:right-6 w-full h-[80dvh] md:h-[650px] md:w-[420px] rounded-t-2xl md:rounded-2xl",
              isDragging && "ring-4 ring-primary ring-inset"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-surface z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                   <h3 className="font-bold text-brand-text-primary text-sm flex items-center gap-2">AI Tutor <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span></h3>
                   <p className="text-[10px] text-brand-text-secondary">Flash Lite & Thinking Modes available</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${user?.email}&su=AI Tutor Transcript (TrackEd)&body=${encodeURIComponent(messages.map(m => `${m.role === 'user' ? 'You' : 'AI Tutor'}:\n${m.parts.map(p => p.text || '[Image]').join('\n')}`).join('\n\n'))}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Email Transcript"
                  className="p-2 text-brand-text-secondary hover:text-primary transition-colors hidden md:block"
                >
                  <Mail className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setMessages(initialMessages)}
                  title="Clear Chat"
                  className="p-2 text-brand-text-secondary hover:text-red-500 transition-colors hidden md:block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-brand-border hidden md:block mx-1"></div>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors hidden md:block"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-brand-text-secondary hover:text-brand-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* AI Capability Toggles */}
            <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-brand-bg border-b border-brand-border cursor-default">
               <button 
                 onClick={() => {
                   setIsFastMode(true);
                   setIsReasoningMode(false);
                 }}
                 className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none",
                 isFastMode && !isReasoningMode ? "bg-amber-500/10 text-amber-500 border border-amber-500/30" : "bg-brand-surface text-brand-text-secondary border border-brand-border hover:text-brand-text-primary")}
               >
                 <Zap className="w-3.5 h-3.5" /> Bolt Mode
               </button>
               
               <button 
                 onClick={() => {
                   setIsReasoningMode(true);
                   setIsFastMode(false);
                 }}
                 className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none",
                 isReasoningMode ? "bg-purple-500/10 text-purple-500 border border-purple-500/30" : "bg-brand-surface text-brand-text-secondary border border-brand-border hover:text-brand-text-primary")}
               >
                 <BrainCircuit className="w-3.5 h-3.5" /> Network Intelligence
               </button>
               
               <button 
                 title="Document Scanner"
                 onClick={() => fileInputRef.current?.click()}
                 className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none",
                 attachment ? "bg-blue-500/10 text-blue-500 border border-blue-500/30" : "bg-brand-surface text-brand-text-secondary border border-brand-border hover:text-brand-text-primary")}
               >
                 <Scan className="w-3.5 h-3.5" /> {attachment ? 'Image Attached' : 'Analyze Image'}
               </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-brand-bg relative">
              {messages.map((message, i) => (
                <div 
                  key={i} 
                  className={clsx(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                    message.role === 'user' ? "ml-auto" : "mr-auto"
                  )}
                >
                  <div className={clsx("text-[10px] font-bold text-brand-text-secondary/60 uppercase tracking-widest mb-1 px-1", message.role === 'user' ? "text-right" : "text-left")}>
                    {message.role === 'user' ? 'You' : 'AI Tutor'}
                  </div>
                  <div 
                    className={clsx(
                      "px-4 py-3 text-sm shadow-sm",
                      message.role === 'user' 
                        ? "bg-primary text-white rounded-2xl rounded-tr-sm" 
                        : "bg-brand-surface border border-brand-border text-brand-text-primary rounded-2xl rounded-tl-sm markdown-body"
                    )}
                  >
                     <div className="flex flex-col gap-2">
                        {message.parts.map((p, pIdx) => {
                           if (p.inlineData) {
                              return <img key={pIdx} src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} className="max-w-[200px] max-h-[200px] rounded-lg object-cover" alt="Attachment" />
                           }
                           
                           if (p.text && message.role === 'user') {
                              return <span key={pIdx}>{p.text}</span>
                           } else if (p.text) {
                              return (
                                <div key={pIdx} className="w-full overflow-hidden">
                                  <ReactMarkdown>{p.text}</ReactMarkdown>
                                </div>
                              );
                           }
                           return null;
                        })}
                     </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex flex-col max-w-[85%] animate-in fade-in ml-auto mr-auto items-start">
                   <div className="px-4 py-3 text-sm bg-brand-surface border border-brand-border text-brand-text-primary rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                     <Loader2 className="w-4 h-4 animate-spin text-primary" />
                     <span className="text-brand-text-secondary text-xs">{isReasoningMode ? "Thinking deeply..." : "Thinking..."}</span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-brand-surface border-t border-brand-border">
              {attachment && (
                <div className="mb-3 animate-in fade-in flex items-start gap-4">
                  <div className="relative inline-block">
                    <img src={attachment.previewUrl} alt="preview" className="h-20 rounded-md object-cover border border-brand-border shadow-sm" />
                    <button type="button" onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-brand-surface rounded-full shadow-sm text-red-500 hover:scale-110 transition-transform">
                      <XCircle className="w-5 h-5 fill-white" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setInput("Generate a 5-question pop quiz based on these notes. Return the questions first, and then the answers hidden securely at the bottom.")}
                      className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors text-left flex items-center gap-1.5"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Generate Pop Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput("Summarize these notes into key bullet points.")}
                      className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors text-left flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Summarize Notes
                    </button>
                  </div>
                </div>
              )}
              
              {!attachment && (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                   <button
                     type="button"
                     onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
                          const { db } = await import('@/lib/firebase');
                          const q = query(collection(db, 'notes'), where('user_id', '==', user?.uid), orderBy('created_at', 'desc'), limit(1));
                          const snaps = await getDocs(q);
                          if (snaps.empty) {
                             alert("No notes found to quiz on.");
                             setIsLoading(false);
                             return;
                          }
                          const latestNote = snaps.docs[0].data();
                          const messageText = `Please quiz me one question at a time on my latest note titled "${latestNote.title}". Note content:\n\n${latestNote.content}`;
                          setMessages([...messages, { role: 'user', parts: [{ text: `Quiz me on my latest note: ${latestNote.title}` }] }]);
                          submitAIRequest(messageText, [...messages, { role: 'user', parts: [{ text: messageText }] }]);
                        } catch(e) { console.error(e); setIsLoading(false); }
                     }}
                     className="shrink-0 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                   >
                     <BrainCircuit className="w-3.5 h-3.5" /> Quiz my Latest Note
                   </button>
                   <button
                     type="button"
                     onClick={async () => {
                        setIsLoading(true);
                        try {
                          const { collection, getDocs, query, where } = await import('firebase/firestore');
                          const { db } = await import('@/lib/firebase');
                          const q = query(collection(db, 'decks'), where('user_id', '==', user?.uid));
                          const snaps = await getDocs(q);
                          let flashcardsMsg = "";
                          snaps.forEach(d => {
                            if (d.data().cards) {
                               d.data().cards.forEach((c: any) => {
                                  flashcardsMsg += `Q: ${c.q}\nA: ${c.a}\n\n`;
                               });
                            }
                          });
                          if (!flashcardsMsg) {
                             alert("No flashcards found to quiz on.");
                             setIsLoading(false);
                             return;
                          }
                          const messageText = `Please act as my tutor and quiz me one question at a time using these flashcards in a random order:\n\n${flashcardsMsg}`;
                          setMessages([...messages, { role: 'user', parts: [{ text: "Quiz me on my flashcards!" }] }]);
                          submitAIRequest(messageText, [...messages, { role: 'user', parts: [{ text: messageText }] }]);
                        } catch(e) { console.error(e); setIsLoading(false); }
                     }}
                     className="shrink-0 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                   >
                     <Sparkles className="w-3.5 h-3.5" /> Quiz my Flashcards
                   </button>
                </div>
              )}
            
              <div className="relative flex items-center gap-2">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={fileInputRef}
                  className="hidden" 
                  onChange={handleFileChange}
                />
                
                <div className="relative flex-1 flex items-center">
                   <button 
                     type="button"
                     onClick={toggleListening}
                     title="Voice Chat"
                     className={clsx("absolute left-1.5 p-1.5 rounded-full transition-all focus:outline-none", isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-brand-text-secondary hover:text-primary hover:bg-primary/10")}
                   >
                     <Mic className="w-4 h-4" />
                   </button>
                   
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask a question..."}
                    className="w-full bg-brand-bg border border-brand-border text-brand-text-primary rounded-full pl-9 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={(!input.trim() && !attachment) || isLoading}
                    className="absolute right-2 p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:scale-95 transition-all hover:bg-primary/90 active:scale-90"
                  >
                    <Send className="w-4 h-4 -ml-0.5" />
                  </button>
                </div>
              </div>
              <div className="text-center mt-2 flex justify-center gap-2">
                <p className="text-[9px] text-brand-text-secondary uppercase tracking-widest font-bold">
                  {isReasoningMode ? "Powered by Gemini Pro (High Thinking)" : "Powered by Gemini Flash Lite"}
                </p>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

