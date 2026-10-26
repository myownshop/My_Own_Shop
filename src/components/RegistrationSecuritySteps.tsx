import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  AtSign,
  UserCheck,
} from 'lucide-react';
import { authService } from '../services/authService';
import { UserRole, AppUser } from '../types';
import { useAuth } from '../context/AuthContext';

interface RegistrationSecurityStepsProps {
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  suggestedUsername?: string;
  entityId?: string;
  onCompleted: (user: AppUser) => void;
  onCancel?: () => void;
}

export const RegistrationSecuritySteps: React.FC<RegistrationSecurityStepsProps> = ({
  role,
  fullName,
  email,
  phone,
  suggestedUsername,
  entityId,
  onCompleted,
  onCancel,
}) => {
  const { setSessionUser } = useAuth();

  const [step, setStep] = useState<'verify_code' | 'create_credentials' | 'finalizing'>('verify_code');
  const [activeCode, setActiveCode] = useState<string>('');
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(30);

  const [username, setUsername] = useState<string>(
    suggestedUsername ||
      fullName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 18) ||
      email.split('@')[0].replace(/[^a-z0-9]/g, '_')
  );
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [credError, setCredError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    sendNewCode();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendNewCode = () => {
    const res = authService.sendConfirmationCode({ email, phone, name: fullName });
    setActiveCode(res.code);
    setResendCooldown(30);
    setCodeError(null);
  };

  const handleVerifyCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!enteredCode.trim()) {
      setCodeError('Please enter the 6-digit confirmation code.');
      return;
    }

    const verification = authService.verifyConfirmationCode(
      phone.trim() || email.trim(),
      enteredCode.trim()
    );

    if (verification.verified) {
      setCodeError(null);
      setStep('create_credentials');
    } else {
      setCodeError(verification.error || 'Invalid confirmation code. Please check and try again.');
    }
  };

  const handleCreateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setCredError('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
      setCredError('Username can only contain letters, numbers, underscores, or hyphens.');
      return;
    }

    if (!password || password.length < 6) {
      setCredError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setCredError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    setStep('finalizing');

    try {
      const newUser = await authService.registerUserWithCredentials({
        name: fullName,
        email,
        phone,
        username: cleanUsername,
        password,
        role,
        entityId,
      });

      setSessionUser(newUser);

      setTimeout(() => {
        onCompleted(newUser);
      }, 400);
    } catch (err: any) {
      setCredError(err?.message || 'Failed to complete registration.');
      setStep('create_credentials');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded p-5 space-y-4 text-ink">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary-dark shrink-0" strokeWidth={1.75} />
          <div>
            <div className="text-[13px] font-bold text-ink">
              Account Security Verification
            </div>
            <div className="text-[12px] text-muted">
              Step {step === 'verify_code' ? '1 of 2: Verify Code' : '2 of 2: Set Password'}
            </div>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] font-bold text-muted hover:text-ink transition-colors"
          >
            Back
          </button>
        )}
      </div>

      {step === 'verify_code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-bold text-[15px] text-ink flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
              <span>Enter 6-Digit Verification Code</span>
            </h3>
            <p className="text-[12px] text-muted">
              Sent to <span className="text-ink font-bold">{phone}</span> and <span className="text-ink font-bold">{email}</span>.
            </p>
          </div>

          <div className="p-3 bg-primary-tint border border-primary-dark rounded space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-primary-dark font-bold">Verification Dispatch</span>
              <span className="text-[11px] text-muted">Active code</span>
            </div>
            <div className="text-[13px] text-ink bg-surface p-2.5 rounded border border-line flex items-center justify-between">
              <div>
                IBO Hub verification code:{' '}
                <span className="text-primary-dark font-bold tracking-widest">{activeCode}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEnteredCode(activeCode);
                  setCodeError(null);
                }}
                className="px-2.5 h-8 bg-primary text-on-primary rounded text-[12px] font-bold shrink-0 ml-2"
              >
                Auto-fill
              </button>
            </div>
          </div>

          {codeError && (
            <div className="p-2.5 bg-surface border border-sale rounded text-sale text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sale shrink-0" strokeWidth={1.75} />
              <span>{codeError}</span>
            </div>
          )}

          <div>
            <label className="text-[12px] font-bold text-ink block mb-1">
              6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={enteredCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setEnteredCode(val);
                if (val.length === 6) setCodeError(null);
              }}
              placeholder="000000"
              autoFocus
              className="w-full text-center text-[18px] tracking-[0.3em] font-bold bg-surface border border-line rounded h-10 text-ink focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div className="flex items-center justify-between text-[12px]">
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={sendNewCode}
              className="text-primary-dark font-bold disabled:opacity-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}</span>
            </button>
            <span className="text-muted">Expires in 15 mins</span>
          </div>

          <button
            type="submit"
            disabled={enteredCode.length !== 6}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>Verify & Continue</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </form>
      )}

      {step === 'create_credentials' && (
        <form onSubmit={handleCreateCredentials} className="space-y-3.5">
          <div className="space-y-1">
            <h3 className="font-bold text-[15px] text-ink flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
              <span>Create Account Credentials</span>
            </h3>
            <p className="text-[12px] text-muted">
              Sign in anytime using your email, username, or phone number.
            </p>
          </div>

          {credError && (
            <div className="p-2.5 bg-surface border border-sale rounded text-sale text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sale shrink-0" strokeWidth={1.75} />
              <span>{credError}</span>
            </div>
          )}

          <div>
            <label className="text-[12px] font-bold text-ink flex items-center gap-1 mb-1">
              <AtSign className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
              <span>Username</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="username"
              className="w-full bg-surface border border-line rounded px-3 h-10 text-[13px] text-ink focus:outline-none focus:border-primary-dark"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-ink flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                <span>Password</span>
              </span>
              <span className="text-[11px] text-muted font-normal">Min. 6 chars</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-surface border border-line rounded px-3 pr-10 h-10 text-[13px] text-ink focus:outline-none focus:border-primary-dark"
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

          <div>
            <label className="text-[12px] font-bold text-ink block mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-surface border border-line rounded px-3 h-10 text-[13px] text-ink focus:outline-none focus:border-primary-dark"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !username || !password || password !== confirmPassword}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>Complete & Open Dashboard</span>
            <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </form>
      )}

      {step === 'finalizing' && (
        <div className="py-6 text-center space-y-2">
          <CheckCircle2 className="w-6 h-6 text-primary-dark mx-auto" strokeWidth={1.75} />
          <h3 className="font-bold text-[15px] text-ink">Activating Account...</h3>
          <p className="text-[12px] text-muted">Redirecting to your dashboard.</p>
        </div>
      )}
    </div>
  );
};
