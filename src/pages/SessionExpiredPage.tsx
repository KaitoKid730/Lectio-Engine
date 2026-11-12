import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SessionExpiredPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
      <div className="max-w-md w-full text-center bg-white text-slate-900 p-8 rounded-3xl shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Session Expired</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Your active session token has expired due to inactivity or TTL limit. Please re-authenticate to continue safely.
        </p>

        <div className="mt-6 flex justify-center">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            icon={<LogIn className="w-4 h-4" />}
          >
            Log In Again
          </Button>
        </div>
      </div>
    </div>
  );
};
