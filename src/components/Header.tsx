import React from 'react';
import { BookOpen, Sparkles, UserCheck, ShieldCheck, Image, FileText, LayoutDashboard, Cpu, Award, Key, LogIn, ChevronDown } from 'lucide-react';
import { SystemStats, User } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: SystemStats;
  currentUser: User;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  currentUser,
  onOpenAuthModal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'student', label: 'Student Portal', icon: Award, roleBadge: 'Student' },
    { id: 'books', label: 'Book Processing', icon: BookOpen },
    { id: 'lessons', label: 'Lesson AI', icon: Sparkles },
    { id: 'copilot', label: 'Teacher Copilot', icon: UserCheck },
    { id: 'qa', label: 'QA Auditor', icon: ShieldCheck },
    { id: 'images', label: 'Image AI', icon: Image },
    { id: 'admin', label: 'Admin & Users', icon: Key, roleBadge: 'Admin' },
    { id: 'specs', label: 'Architecture Docs', icon: FileText },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base tracking-tight">Lectio Engine</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  v1.0 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Curriculum AI & Storybook Processing</p>
            </div>
          </div>

          {/* User Session & Quick Role Switcher */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenAuthModal}
              className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 p-1.5 pr-3 rounded-xl transition-all cursor-pointer group"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover border border-slate-300 shrink-0"
              />
              <div className="text-left hidden sm:block">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-slate-900 text-xs">{currentUser.name}</span>
                  <span className="text-[9px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{currentUser.schoolDistrict}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
            </button>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2 -mb-px border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.roleBadge && (
                  <span className="text-[9px] font-extrabold bg-amber-400/20 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300/40">
                    {item.roleBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

