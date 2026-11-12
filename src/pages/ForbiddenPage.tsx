import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
          <ShieldX className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-rose-100 text-rose-800">
          HTTP 403 Forbidden
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-3">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your current role (<span className="font-semibold text-slate-700">{user?.role || 'Guest'}</span>) does not have authorization to view this module.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Return to Dashboard
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
};
