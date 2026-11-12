import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { UserCheck, Shield, GraduationCap, Award, BookOpen, Key, X, Check, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
}

const roleBadges: Record<UserRole, { label: string; bg: string; text: string; icon: any; description: string }> = {
  teacher: {
    label: 'Educator / Teacher',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: GraduationCap,
    description: 'Generates lesson plans, uses Teacher Copilot, adapts materials for ELL/IEP students.',
  },
  curriculum_lead: {
    label: 'Curriculum Specialist',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-800',
    icon: BookOpen,
    description: 'Processes books, structures chapter NLP breakdowns, designs district learning objectives.',
  },
  qa_auditor: {
    label: 'QA & Compliance Auditor',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: Shield,
    description: 'Evaluates readability scores, safety guidelines, and Bloom\'s taxonomy depth.',
  },
  admin: {
    label: 'District Administrator',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    icon: Key,
    description: 'Full system authorization, manages user roles, configures platform security.',
  },
  student: {
    label: 'Student Learner',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-800',
    icon: Award,
    description: 'Dedicated Student Portal: interactive story reader, vocab flashcards, and quizzes.',
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'personas' | 'custom'>('personas');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('teacher');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              L
            </div>
            <div>
              <h2 className="text-lg font-bold">Lectio Identity & Access Management</h2>
              <p className="text-xs text-slate-400">Switch user persona or sign in with custom district account</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-4">
          <button
            onClick={() => setActiveTab('personas')}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'personas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1-Click Demo Personas ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'custom'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Custom Account Login
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {activeTab === 'personas' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Select a persona to test role-based access control, specialized dashboards, and permission boundaries:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {users.map((usr) => {
                  const isCurrent = usr.id === currentUser.id;
                  const badge = roleBadges[usr.role];
                  const IconComp = badge.icon;

                  return (
                    <div
                      key={usr.id}
                      onClick={() => {
                        onSelectUser(usr);
                        onClose();
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between group ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5">
                        <img
                          src={usr.avatarUrl}
                          alt={usr.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">{usr.name}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center space-x-1 ${badge.bg} ${badge.text}`}>
                              <IconComp className="w-3 h-3 mr-1" />
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-700">{usr.title}</p>
                          <p className="text-[11px] text-slate-500">{usr.schoolDistrict} • {usr.email}</p>
                          <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">{badge.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isCurrent ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                            Switch <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter custom credentials to simulate single sign-on (SSO) with district directory:
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    District Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="educator@school.edu"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select System Role
                  </label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as UserRole)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="teacher">Educator / Teacher</option>
                    <option value="curriculum_lead">Curriculum Specialist</option>
                    <option value="qa_auditor">QA & Compliance Auditor</option>
                    <option value="admin">District Administrator</option>
                    <option value="student">Student Learner</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    const matchedUser = users.find((u) => u.role === customRole) || {
                      id: `usr_custom_${Date.now()}`,
                      name: customEmail.split('@')[0] || 'Custom User',
                      email: customEmail || 'user@district.edu',
                      role: customRole,
                      title: 'District Personnel',
                      schoolDistrict: 'Metropolitan Educational District',
                      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    };
                    onSelectUser(matchedUser);
                    onClose();
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Authenticate & Launch Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
