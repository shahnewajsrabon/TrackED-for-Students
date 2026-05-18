import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '@/context/AuthContext';
import { PRESET_SUBJECTS } from '@/lib/subjects';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Plus, X } from 'lucide-react';
import { Subject } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export default function OnboardingPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState('');

  // Step 2
  const [subjects, setSubjects] = useState<Subject[]>(PRESET_SUBJECTS.slice(0, 3).map(s => ({
    id: crypto.randomUUID(),
    name: s.name,
    color: s.color,
    weeklyGoalHrs: 5
  })));
  const [customSubjectName, setCustomSubjectName] = useState('');

  // Step 3
  const [weeklyGoal, setWeeklyGoal] = useState(15);

  if (!user) return <Navigate to="/" />;

  const handleNext = async () => {
    if (step === 1) {
      if (!displayName.trim() || !username.trim()) {
        return toast.error('Please fill in both fields');
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setLoading(false);
          return toast.error('Username is already taken');
        }
        setStep(2);
      } catch (error: any) {
        toast.error('Error checking username');
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (subjects.length === 0) return toast.error('Please add at least one subject');
      setStep(3);
    } else if (step === 3) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        display_name: displayName,
        username,
        avatar_url: user.photoURL || '',
        subjects,
        weekly_goal_hrs: weeklyGoal,
        xp: 0,
        level: 'Novice',
        current_streak: 0,
        longest_streak: 0,
        created_at: new Date().toISOString()
      });
      toast.success('Welcome to TrackEd!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const addCustomSubject = () => {
    if (!customSubjectName.trim()) return;
    setSubjects([...subjects, {
      id: crypto.randomUUID(),
      name: customSubjectName.trim(),
      color: '#534AB7', // default primary
      weeklyGoalHrs: 5
    }]);
    setCustomSubjectName('');
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const getLevelText = (hrs: number) => {
    if (hrs < 10) return "Light study load";
    if (hrs < 20) return "Committed student";
    if (hrs < 30) return "Serious preparation";
    return "Intense focus mode";
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4 flex flex-col justify-center">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2 rounded-full mb-12 overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: '33%' }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="bg-brand-surface rounded-2xl p-8 border border-brand-border shadow-xl shadow-gray-200/50 min-h-[400px] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome to TrackEd</h1>
                <p className="text-brand-text-secondary">Let's set up your profile.</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="e.g. johndoe99"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <p className="text-xs text-brand-text-secondary mt-1">Letters, numbers, and underscores only.</p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">What are you studying?</h1>
                <p className="text-brand-text-secondary">Add your subjects to track progress.</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {subjects.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-primary-light text-primary px-3 py-1.5 rounded-lg text-sm font-medium border border-primary/20">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                    <button onClick={() => removeSubject(s.id)} className="ml-1 hover:text-black transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                  placeholder="Add custom subject..."
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                />
                <button 
                  onClick={addCustomSubject}
                  className="bg-gray-100 hover:bg-gray-200 px-4 rounded-2xl transition-colors font-medium text-brand-text-primary"
                >
                  Add
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-100 mt-4">
                 <p className="text-xs font-semibold text-brand-text-secondary uppercase mb-3">Quick Add Presets</p>
                 <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pb-2">
                   {PRESET_SUBJECTS.filter(ps => !subjects.find(s => s.name === ps.name)).map(ps => (
                     <button
                       key={ps.name}
                       onClick={() => setSubjects([...subjects, { id: crypto.randomUUID(), name: ps.name, color: ps.color, weeklyGoalHrs: 5 }])}
                       className="text-xs px-2.5 py-1.5 rounded-md border border-gray-200 hover:border-primary hover:bg-primary-light transition-colors text-brand-text-secondary hover:text-primary"
                     >
                       <Plus className="w-3 h-3 inline mr-1" />
                       {ps.name}
                     </button>
                   ))}
                 </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Set your target</h1>
                <p className="text-brand-text-secondary">How many hours per week do you want to study?</p>
              </div>

              <div className="py-8">
                <div className="text-5xl font-bold text-center text-primary mb-2">
                  {weeklyGoal} <span className="text-xl text-brand-text-secondary font-medium">hrs/week</span>
                </div>
                <div className="text-center font-medium text-brand-text-secondary bg-gray-50 py-1.5 px-4 rounded-full w-fit mx-auto mb-8 border border-gray-200">
                  {getLevelText(weeklyGoal)}
                </div>

                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={weeklyGoal}
                  onChange={e => setWeeklyGoal(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-brand-text-secondary mt-2">
                  <span>5 hrs</span>
                  <span>40 hrs</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between">
          <button
            onClick={() => setStep(step - 1)}
            className={`px-5 py-2.5 rounded-2xl font-medium ${step === 1 ? 'invisible' : 'text-brand-text-secondary hover:bg-gray-100'}`}
          >
            Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-8 py-2.5 rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {step === 3 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
