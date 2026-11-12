import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  MessageSquareText,
  ShieldCheck,
  ImageIcon,
  GraduationCap,
  Users,
  FileCode2,
  BookMarked,
  Presentation,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const navItems: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'qa_auditor', 'admin'],
  },
  {
    to: '/student',
    label: 'Student Portal',
    icon: <GraduationCap className="w-4 h-4" />,
    allowedRoles: ['student', 'teacher', 'admin'],
  },
  {
    to: '/books',
    label: 'Storybooks',
    icon: <BookOpen className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'admin'],
  },
  {
    to: '/lessons',
    label: 'Lesson AI',
    icon: <Sparkles className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'admin'],
  },
  {
    to: '/presentations',
    label: 'Presentation Studio',
    icon: <Presentation className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'admin'],
  },
  {
    to: '/copilot',
    label: 'Teacher Copilot',
    icon: <MessageSquareText className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'admin'],
  },
  {
    to: '/qa',
    label: 'QA Auditor',
    icon: <ShieldCheck className="w-4 h-4" />,
    allowedRoles: ['qa_auditor', 'curriculum_lead', 'admin'],
  },
  {
    to: '/images',
    label: 'Image AI',
    icon: <ImageIcon className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'admin'],
  },
  {
    to: '/admin',
    label: 'Admin Console',
    icon: <Users className="w-4 h-4" />,
    allowedRoles: ['admin'],
  },
  {
    to: '/specs',
    label: 'Docs & Specs',
    icon: <FileCode2 className="w-4 h-4" />,
    allowedRoles: ['teacher', 'curriculum_lead', 'qa_auditor', 'admin', 'student'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const currentRole = user?.role || 'student';

  const visibleNavItems = navItems.filter((item) => item.allowedRoles.includes(currentRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md font-bold text-lg">
          <BookMarked className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-tight">Lectio Engine</h1>
          <p className="text-[10px] text-indigo-300 font-medium tracking-wide uppercase">
            Enterprise AI Curriculum
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-800/80 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-medium">Role Perspective</span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          {currentRole.replace('_', ' ')}
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        Lectio Platform v2.4 • Cloud Run
      </div>
    </aside>
  );
};
