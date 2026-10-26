import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'signin' | 'register';
  onNavigate?: (path: string) => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSuccess,
}) => {
  const { signInWithCredentials } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your email, username, or phone number and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await signInWithCredentials(identifier.trim(), password);
      if (result.success && result.user) {
        setSuccessMsg(`Signed in as ${result.user.name}`);
        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
          if (onNavigate) {
            if (result.user?.role === 'ibo') onNavigate('/ibo/dashboard');
            else if (result.user?.role === 'merchant') onNavigate('/merchant/dashboard');
            else if (result.user?.role === 'agent') onNavigate('/agent/dashboard');
            else if (result.user?.role === 'founder') onNavigate('/admin');
            else onNavigate('/');
          }
        }, 400);
      } else {
        setErrorMsg(result.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-surface border border-line rounded max-w-[400px] w-full p-6 text-ink space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-dark" strokeWidth={1.75} />
            <h2 className="font-bold text-[16px] text-ink">Sign In to IBO Hub</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-ink"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSignInSubmit} className="space-y-3.5 text-[13px]">
          {errorMsg && (
            <div className="p-2.5 bg-surface border border-sale rounded text-sale text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-primary-tint border border-primary-dark rounded text-primary-dark text-[12px] flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-ink mb-1">
              Email, Username, or Phone
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. @amina_crafts or orders@agrofresh.ng"
              className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 px-3 pr-10 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </div>
  );
};
