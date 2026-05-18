import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSubjects } from '@/hooks/useSubjects';
import { BrainCircuit, Play, Plus, Search, Trash2, Wand2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';

interface Flashcard {
  id: string;
  q: string;
  a: string;
}

interface Deck {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  description: string;
  cards: Flashcard[];
  created_at: string;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('');

  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [newCardQ, setNewCardQ] = useState('');
  const [newCardA, setNewCardA] = useState('');
  
  const [studyMode, setStudyMode] = useState(false);
  const [studyInd, setStudyInd] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'decks'), where('user_id', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedDecks = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Deck));
      setDecks(fetchedDecks);
      setLoading(false);
      
      // Update active deck if it was modified
      if (activeDeck) {
        const updatedActive = fetchedDecks.find(d => d.id === activeDeck.id);
        if (updatedActive) setActiveDeck(updatedActive);
      }
    });
    return unsub;
  }, [user]);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !activeDeck) return;
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a list of study flashcards based on the following material. Make them concise and clear.\n\nMaterial:\n${aiPrompt}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                q: { type: Type.STRING, description: 'The question for the flashcard' },
                a: { type: Type.STRING, description: 'The answer for the flashcard' }
              },
              required: ['q', 'a']
            }
          }
        }
      });
      
      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text) as Omit<Flashcard, 'id'>[];
        const newAIcards: Flashcard[] = parsed.map(c => ({ ...c, id: crypto.randomUUID() }));
        const newCards = [...(activeDeck.cards || []), ...newAIcards];
        await updateDoc(doc(db, 'decks', activeDeck.id), { cards: newCards });
        setAiPrompt('');
      }
    } catch (e) {
      console.error('Error generating flashcards with AI', e);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDeckTitle.trim()) return;

    await addDoc(collection(db, 'decks'), {
      user_id: user.uid,
      title: newDeckTitle.trim(),
      subject_id: newDeckSubject || null,
      description: '',
      cards: [],
      created_at: new Date().toISOString()
    });

    setNewDeckTitle('');
    setNewDeckSubject('');
  };

  const deleteDeck = async (deckId: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'decks', deckId));
    if (activeDeck?.id === deckId) setActiveDeck(null);
  };

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeDeck || !newCardQ.trim() || !newCardA.trim()) return;
    
    const newCards: Flashcard[] = [...(activeDeck.cards || []), { q: newCardQ.trim(), a: newCardA.trim(), id: crypto.randomUUID() }];
    await updateDoc(doc(db, 'decks', activeDeck.id), { cards: newCards });
    
    setNewCardQ('');
    setNewCardA('');
  };

  const deleteCard = async (cardId: string) => {
    if (!user || !activeDeck) return;
    const newCards = (activeDeck.cards || []).filter(c => c.id !== cardId);
    await updateDoc(doc(db, 'decks', activeDeck.id), { cards: newCards });
  };

  if (loading) return <LoadingSpinner />;

  if (studyMode && activeDeck) {
    const cards = activeDeck.cards || [];
    if (cards.length === 0) {
      setStudyMode(false);
      return null;
    }
    const currentCard = cards[studyInd];
    const progress = Math.round(((studyInd + 1) / cards.length) * 100);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto py-12 flex flex-col items-center w-full"
      >
        <div className="w-full mb-10 flex justify-between items-center bg-brand-surface p-4 rounded-2xl border border-brand-border shadow-sm">
          <h2 className="text-xl font-bold text-brand-text-primary px-2">{activeDeck.title}</h2>
          <div className="flex items-center gap-4 w-1/2">
            <div className="w-full bg-brand-bg rounded-full h-2 overflow-hidden border border-brand-border/50">
              <motion.div 
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="font-black text-brand-text-secondary text-sm tabular-nums whitespace-nowrap">
              {studyInd + 1} / {cards.length}
            </div>
          </div>
        </div>
        
        <div className="w-full perspective-[1200px] aspect-[5/3] cursor-pointer group" onClick={() => setShowAnswer(!showAnswer)}>
          <motion.div
            className="w-full h-full relative"
            style={{ transformStyle: 'preserve-3d' }}
            initial={false}
            animate={{ rotateY: showAnswer ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div 
              className="absolute inset-0 bg-brand-surface rounded-2xl border border-brand-border shadow-lg hover:shadow-xl flex flex-col items-center justify-center p-12 backface-hidden transition-all bg-gradient-to-br from-brand-surface to-brand-bg group-hover:-translate-y-1"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <h3 className="text-3xl md:text-5xl font-extrabold text-center text-brand-text-primary z-10 leading-tight">
                {currentCard.q}
              </h3>
              <span className="absolute bottom-8 font-black text-brand-text-secondary uppercase tracking-[0.2em] text-[10px] opacity-60">
                Question
              </span>
            </div>

            {/* Back */}
            <div 
              className="absolute inset-0 bg-primary rounded-2xl border border-primary/50 shadow-xl flex flex-col items-center justify-center p-12 backface-hidden text-white"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <h3 className="text-3xl md:text-5xl font-extrabold text-center z-10 leading-tight drop-shadow-md">
                {currentCard.a}
              </h3>
              <span className="absolute bottom-8 font-black uppercase tracking-[0.2em] text-[10px] text-white/60">
                Answer
              </span>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex items-center justify-between w-full max-w-sm">
          <button 
            onClick={() => {
               setStudyMode(false);
               setShowAnswer(false);
               setStudyInd(0);
            }} 
            className="px-6 py-3.5 bg-brand-bg border border-brand-border rounded-2xl font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-brand-text-secondary hover:text-brand-text-primary"
          >
            End Session
          </button>
          
          <AnimatePresence mode="wait">
            {showAnswer ? (
              <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => {
                  setShowAnswer(false);
                  setStudyInd((studyInd + 1) % cards.length);
                }}
                className="px-8 py-3.5 bg-brand-text-primary text-brand-bg rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl flex items-center gap-2"
              >
                Next Card <Play className="w-5 h-5 fill-current" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-brand-text-secondary font-medium italic text-sm"
              >
                Tap card to flip
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-sm">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4 drop-shadow-sm text-brand-text-primary">
            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
              <BrainCircuit className="w-8 h-8" />
            </div>
            Flashcards
          </h1>
          <p className="text-brand-text-secondary font-medium mt-2 text-lg">Master your subjects with active recall.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 shadow-sm">
            <h2 className="font-bold text-xl mb-4 text-brand-text-primary">Your Decks</h2>
            <form onSubmit={handleCreateDeck} className="space-y-3 mb-6 bg-brand-bg p-4 rounded-2xl border border-brand-border">
              <input
                type="text"
                placeholder="Deck Title"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-medium"
              />
              <select
                value={newDeckSubject}
                onChange={(e) => setNewDeckSubject(e.target.value)}
                className="w-full bg-brand-surface border border-brand-border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm font-medium"
              >
                <option value="">No Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="submit" disabled={!newDeckTitle.trim()} className="w-full bg-primary text-white py-2.5 rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-transform active:scale-95 shadow-md">
                Create Deck
              </button>
            </form>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {decks.map(deck => (
                <div 
                  key={deck.id} 
                  className={`group p-4 rounded-2xl border transition-all cursor-pointer ${activeDeck?.id === deck.id ? 'bg-primary-light border-primary/30 shadow-sm' : 'bg-brand-bg border-brand-border hover:border-gray-300'}`}
                  onClick={() => setActiveDeck(deck)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-brand-text-primary">{deck.title}</h3>
                      <p className="text-xs font-semibold text-brand-text-secondary mt-1">{deck.cards?.length || 0} cards</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                      className="text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-brand-surface rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {decks.length === 0 && (
                <div className="text-center py-6 text-brand-text-secondary font-medium">No decks yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeDeck ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-surface rounded-2xl border border-brand-border p-8 md:p-10 shadow-sm space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-border pb-8">
                <div>
                  <h2 className="text-3xl font-black text-brand-text-primary">{activeDeck.title}</h2>
                  <p className="text-brand-text-secondary font-bold mt-2 uppercase tracking-widest text-xs bg-brand-bg inline-block px-3 py-1 rounded-md border border-brand-border">{activeDeck.cards?.length || 0} cards total</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStudyInd(0);
                    setShowAnswer(false);
                    setStudyMode(true);
                  }}
                  disabled={!activeDeck.cards || activeDeck.cards.length === 0}
                  className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" /> Study Now
                </motion.button>
              </div>

              <form onSubmit={addCard} className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-4">
                <h3 className="font-bold text-brand-text-primary">Add New Card</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <textarea
                    placeholder="Question (e.g., What is the capital of France?)"
                    value={newCardQ}
                    onChange={(e) => setNewCardQ(e.target.value)}
                    className="bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-h-[100px] resize-none font-medium"
                  />
                  <textarea
                    placeholder="Answer (e.g., Paris)"
                    value={newCardA}
                    onChange={(e) => setNewCardA(e.target.value)}
                    className="bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-h-[100px] resize-none font-medium"
                  />
                </div>
                <div className="flex justify-end">
                  <button type="submit" disabled={!newCardQ.trim() || !newCardA.trim()} className="bg-primary text-white px-5 py-2.5 rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-transform active:scale-95 shadow-md flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Add Card
                  </button>
                </div>
              </form>

              <div className="bg-brand-bg p-6 rounded-2xl border border-brand-border space-y-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-brand-text-primary">Generate with AI</h3>
                </div>
                <textarea
                  placeholder="Paste your study material here, and Gemini will generate flashcards for you..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm min-h-[100px] font-medium resize-y"
                />
                <div className="flex justify-end">
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()} 
                    className="bg-brand-text-primary text-brand-bg px-5 py-2.5 rounded-2xl font-bold hover:opacity-90 disabled:opacity-50 transition-transform active:scale-95 shadow-md flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 rounded-full border-2 border-brand-bg border-t-transparent animate-spin" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )} 
                    {isGenerating ? 'Generating...' : 'Generate Cards'}
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(activeDeck.cards || []).map((card: Flashcard) => (
                  <div key={card.id} className="group bg-brand-bg rounded-2xl border border-brand-border p-5 relative shadow-sm hover:border-gray-300 transition-colors">
                    <button 
                      onClick={() => deleteCard(card.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity bg-brand-surface p-1.5 rounded-lg shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="mb-4 pr-8">
                      <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">Q</span>
                      <p className="font-semibold text-brand-text-primary">{card.q}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider block mb-1">A</span>
                      <p className="text-brand-text-secondary">{card.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-brand-surface rounded-2xl border border-dashed border-brand-border group relative overflow-hidden">
               {decks.length === 0 ? (
                 <>
                   <div className="p-6 bg-brand-bg rounded-2xl border border-brand-border shadow-sm mb-6 group-hover:bg-primary/10 transition-colors">
                     <Wand2 className="w-16 h-16 text-primary" />
                   </div>
                   <h3 className="text-2xl font-black text-brand-text-primary mb-4">Let AI build your decks.</h3>
                   <p className="font-medium max-w-md mx-auto mb-8 text-brand-text-secondary text-lg">Create a deck on the left, then paste notes or ask the AI Tutor to instantly generate flashcards.</p>
                 </>
               ) : (
                 <>
                   <div className="p-6 bg-brand-bg rounded-2xl border border-brand-border shadow-sm mb-6">
                     <BrainCircuit className="w-16 h-16 text-gray-300" />
                   </div>
                   <h3 className="text-2xl font-black text-brand-text-primary mb-2">Select a deck</h3>
                   <p className="text-brand-text-secondary font-medium text-lg">Choose a deck from the sidebar or create a new one to start adding cards.</p>
                 </>
               )}
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
