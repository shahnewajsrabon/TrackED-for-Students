import React, { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Loader2, CalendarClock } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });

interface AIInsightsProps {
  stats: any;
  sessions: any[];
}

export default function AIInsights({ stats, sessions }: AIInsightsProps) {
  const [insights, setInsights] = useState<string>('');
  const [schedule, setSchedule] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Create a summary of the data for the AI
      const dataSummary = {
        totalHours: stats.totalHrs,
        averageSessionMinutes: stats.avgLen,
        bestDay: stats.mostProductiveDay,
        peakHour: stats.peakHour,
        balanceScore: stats.balanceScore,
        subjectMinutes: stats.subjectMins,
        recentSessions: sessions.slice(0, 10).map(s => ({
          subject: s.subject_name,
          duration: s.duration_mins,
          focus: s.focus_rating,
          mood: s.mood,
          start: new Date(s.started_at).toLocaleString()
        }))
      };

      const prompt = `You are an AI study coach analyzing a student's study data. 
      Here is the data: ${JSON.stringify(dataSummary)}
      
      Please provide two things formatted in markdown:
      
      ### 1. Weekly Insights
      Write a short, engaging 2-3 sentence paragraph summarizing their week. Be encouraging but point out what they did well (e.g., "crushed your science goals") and where they lost focus or need balance.
      
      ### 2. Smart Scheduling
      Based on their 'peakHour' and 'bestDay', suggest an optimal study schedule or time blocks for their upcoming week. Make it actionable and actionable (e.g., "Try tackling your hardest subjects around 10:00 AM since that's your peak hour."). Keep this to bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
      });

      const text = response.text || '';
      
      // Split the response
      const splitText = text.split('### 2. Smart Scheduling');
      
      setInsights(splitText[0].replace('### 1. Weekly Insights', '').trim());
      setSchedule(splitText[1] ? splitText[1].trim() : 'Could not generate schedule at this time.');
      setHasGenerated(true);

    } catch (error) {
      console.error('Error generating insights:', error);
      setInsights('Failed to generate insights. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasGenerated && !loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Proactive AI Insights</h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          Let your AI Tutor analyze your study patterns to generate personalized feedback and smart scheduling recommendations.
        </p>
        <button 
          onClick={generateInsights}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Generate Insights
        </button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl flex flex-col items-center justify-center border border-indigo-100">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-sm font-medium text-indigo-900 animate-pulse">Analyzing your study patterns...</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] -z-0" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-2xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Weekly Insights</h3>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed relative z-10 markdown-body prose prose-sm max-w-none">
           <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow hover:shadow-md transition-shadow relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -z-0" />
        <div className="flex items-center gap-3 mb-4 relative z-10">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-2xl">
            <CalendarClock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Smart Scheduling</h3>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed relative z-10 markdown-body prose prose-sm max-w-none">
          <ReactMarkdown>{schedule}</ReactMarkdown>
        </div>
      </div>
      
      {!loading && (
        <div className="md:col-span-2 flex justify-end">
          <button 
            onClick={generateInsights}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <Loader2 className="w-3 h-3" />
            Recalculate
          </button>
        </div>
      )}
    </div>
  );
}
