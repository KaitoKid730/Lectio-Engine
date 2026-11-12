import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { UserCheck, ChevronDown } from 'lucide-react';

const PERSONAS: { role: UserRole; label: string; desc: string; color: string }[] = [
  { role: 'teacher', label: 'Sara Jenkins (Teacher)', desc: '3rd Grade Educator', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { role: 'curriculum_lead', label: 'Marcus Vance (Curriculum Lead)', desc: 'K-8 Literacy Lead', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { role: 'qa_auditor', label: 'Elena Rostova (QA Auditor)', desc: 'Standards Auditor', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { role: 'admin', label: 'Dr. Arthur Vance (Admin)', desc: 'System Administrator', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { role: 'student', label: 'Alex Rivera (Student)', desc: '3rd Grade Learner', color: 'bg-sky-50 text-sky-700 border-sky-200' },
];

export const PersonaSwitcher: React.FC = () => {
  const { user, switchPersona, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Hide in production unless explicitly enabled
  if (import.meta.env.PROD && !import.meta.env.VITE_ENABLE_PERSONA_SWITCHER) {
    return null;
  }

  const currentPersona = PERSONAS.find((p) => p.role === user?.role) || PERSONAS[0];

  const handleSelect = async (role: UserRole) => {
    setIsOpen(false);
    await switchPersona(role);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${currentPersona.color} hover:shadow-xs`}
        title="Dev Persona Switcher"
      >
        <UserCheck className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline font-semibold">{currentPersona.label}</span>
        <span className="sm:hidden font-semibold">{currentPersona.role}</span>
        <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dev Persona Switcher
              </p>
            </div>
            {PERSONAS.map((p) => {
              const isSelected = user?.role === p.role;
              return (
                <button
                  key={p.role}
                  onClick={() => handleSelect(p.role)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-indigo-50/60 text-indigo-900 font-semibold' : 'text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-[10px] text-slate-400">{p.desc}</div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
