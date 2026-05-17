import React from 'react';
import { Book, Calculator, Atom, Landmark, Globe, Languages, Code, Palette, Music, Activity, TrendingUp } from 'lucide-react';

interface Props {
  name: string;
  color: string;
}

export const getSubjectIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('math') || lowerName.includes('algebra') || lowerName.includes('calculus') || lowerName.includes('geometry')) return Calculator;
  if (lowerName.includes('science') || lowerName.includes('physics') || lowerName.includes('chemistry') || lowerName.includes('biology')) return Atom;
  if (lowerName.includes('history')) return Landmark;
  if (lowerName.includes('geography')) return Globe;
  if (lowerName.includes('language') || lowerName.includes('english') || lowerName.includes('spanish') || lowerName.includes('french')) return Languages;
  if (lowerName.includes('computer') || lowerName.includes('programming') || lowerName.includes('coding') || lowerName.includes('it')) return Code;
  if (lowerName.includes('art') || lowerName.includes('design')) return Palette;
  if (lowerName.includes('music')) return Music;
  if (lowerName.includes('pe') || lowerName.includes('physical')) return Activity;
  if (lowerName.includes('econ') || lowerName.includes('business')) return TrendingUp;
  return Book;
};

export default function SubjectBadge({ name, color }: Props) {
  const Icon = getSubjectIcon(name);
  
  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
        color: color
      }}
    >
      <Icon className="w-3 h-3" />
      {name}
    </div>
  );
}
