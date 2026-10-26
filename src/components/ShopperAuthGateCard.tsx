import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { AppUser } from '../types';

interface ShopperAuthGateCardProps {
  /** Optional custom brand accent hex color (used inside IBO white-label storefronts) */
  accentColor?: string;
  /** Optional store name for contextual copy */
  storeName?: string;
  /** Compact mode for slide-over drawers */
  compact?: boolean;
  /** Optional callback invoked right after successful sign in or account creation */
  onAuthenticated?: (user: AppUser) => void;
}

export const ShopperAuthGateCard: React.FC<ShopperAuthGateCardProps> = ({
  accentColor,
  storeName,
  compact = false,
  onAuthenticated,
}) => {
  const { signInWithCredentials, setSessionUser } = useAuth();
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  // Sign In fields
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Create Account fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Please enter your username or email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signInWithCredentials(identifier.trim(), loginPassword);
      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Invalid login details. Please try again.');
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      onAuthenticated?.(res.user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sign in failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter your phone number for delivery updates.');
      return;
    }
    const cleanUsername =
      username.trim() ||
      email
        .trim()
        .split('@')[0]
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase();

    if (signupPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = authService.registerUserWithCredentials({
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        username: cleanUsername,
        password: signupPassword,
        role: 'customer',
        entityId: `cust-${Date.now()}`,
      });
      setSessionUser(created);
      setIsSubmitting(false);
      onAuthenticated?.(created);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create your account. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoCustomer = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const res = await signInWithCredentials('ngozi_eze', 'password123');
    setIsSubmitting(false);
    if (res.success && res.user) {
      onAuthenticated?.(res.user);
    } else {
      setIdentifier('ngozi_eze');
      setLoginPassword('password123');
    }
  };

  const activeButtonStyle: React.CSSProperties | undefined = accentColor
    ? { backgroundColor: accentColor, color: '#FFFFFF' }
    : undefined;

  return (
    <div className="bg-surface border border-line rounded overflow-hidden">
      {/* Header Banner */}
      <div className="px-4 py-3 bg-page border-b border-line flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${accentColor ? '' : 'text-primary-dark'}`}
              style={accentColor ? { color: accentColor } : undefined}
              strokeWidth={1.75}
            />
            <h2 className="text-[14px] font-bold text-ink">
              Account Required to Checkout
            </h2>
          </div>
          <p className="text-[12px] text-muted">
            {storeName
              ? `Please sign in or create an account to place your order at ${storeName} and track your delivery.`
              : 'Please sign in or create a free shopper account so you can place your order and track your delivery in real time.'}
          </p>
        </div>
      </div>

      {/* Sign In / Create Account Toggle Tabs */}
      <div className="grid grid-cols-2 border-b border-line bg-page">
        <button
          type="button"
          onClick={() => {
            setAuthTab('login');
            setErrorMsg(null);
          }}
          style={
            authTab === 'login' && accentColor
              ? { borderBottomColor: accentColor, color: accentColor }
              : undefined
          }
          className={`h-10 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${
            authTab === 'login'
              ? accentColor
                ? 'bg-surface'
                : 'bg-surface border-primary-dark text-primary-dark'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthTab('signup');
            setErrorMsg(null);
          }}
          style={
            authTab === 'signup' && accentColor
              ? { borderBottomColor: accentColor, color: accentColor }
              : undefined
          }
          className={`h-10 text-[13px] font-bold border-b-2 transition-colors cursor-pointer ${
            authTab === 'signup'
              ? accentColor
                ? 'bg-surface'
                : 'bg-surface border-primary-dark text-primary-dark'
              : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Create Account
        </button>
      </div>

      <div className={compact ? 'p-3.5 space-y-3.5' : 'p-4 sm:p-5 space-y-4'}>
        {errorMsg && (
          <div className="p-2.5 bg-sale-tint border border-sale rounded flex items-start gap-2 text-[12px] text-sale">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        {authTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3" noValidate>
            <div className="space-y-1">
              <label className="block text-[12px] font-bold text-ink">
                Email or Username <span className="text-sale">*</span>
              </label>
              <div className="relative">
                <User
                  className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or username"
                  className="w-full h-10 pl-9 pr-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] font-bold text-ink">
                Password <span className="text-sale">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                  strokeWidth={1.75}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-10 pl-9 pr-9 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={activeButtonStyle}
              className={`w-full h-10 font-bold text-[13px] rounded flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-60 ${
                accentColor
                  ? 'text-white hover:opacity-95'
                  : 'bg-primary hover:bg-primary-dark text-on-primary'
              }`}
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In & Continue to Checkout'}</span>
            </button>

            <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-muted">Testing checkout?</span>
              <button
                type="button"
                onClick={handleQuickDemoCustomer}
                className="font-bold underline cursor-pointer text-ink hover:opacity-80"
                style={accentColor ? { color: accentColor } : undefined}
              >
                Use Demo Shopper Account (Ngozi Eze)
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Full Name <span className="text-sale">*</span>
                </label>
                <div className="relative">
                  <User
                    className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ngozi Eze"
                    className="w-full h-10 pl-9 pr-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Phone Number <span className="text-sale">*</span>
                </label>
                <div className="relative">
                  <Phone
                    className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full h-10 pl-9 pr-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Email Address <span className="text-sale">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
                    strokeWidth={1.75}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-10 pl-9 pr-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ngozi_eze"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Password <span className="text-sale">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[12px] font-bold text-ink">
                  Confirm Password <span className="text-sale">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-[13px] text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={activeButtonStyle}
              className={`w-full h-10 font-bold text-[13px] rounded flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-60 ${
                accentColor
                  ? 'text-white hover:opacity-95'
                  : 'bg-primary hover:bg-primary-dark text-on-primary'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
              <span>
                {isSubmitting ? 'Creating Account...' : 'Create Account & Continue to Checkout'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
