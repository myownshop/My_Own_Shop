import React, { useState, useEffect } from 'react';
import {
  User,
  Store,
  Building2,
  Bike,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { UserRole } from '../../types';

interface LoginScreenProps {
  onNavigate: (path: string) => void;
  mode?: 'login' | 'signup';
  initialMode?: 'login' | 'signup';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigate,
  mode: propMode,
  initialMode = 'login',
}) => {
  const { signInWithCredentials, setSessionUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(propMode || initialMode);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (propMode) {
      setMode(propMode);
    } else if (window.location.pathname.startsWith('/signup')) {
      setMode('signup');
    } else if (window.location.pathname.startsWith('/login')) {
      setMode('login');
    }
  }, [propMode, initialMode]);

  const demoAccounts: {
    role: UserRole;
    label: string;
    demoId: string;
    icon: React.ComponentType<any>;
  }[] = [
    { role: 'customer', label: 'Customer (Ngozi)', demoId: 'ngozi_eze', icon: User },
    { role: 'ibo', label: 'IBO (Amina)', demoId: 'amina_crafts', icon: Store },
    { role: 'merchant', label: 'Merchant (AgroFresh)', demoId: 'kofi@agrofresh.ng', icon: Building2 },
    { role: 'agent', label: 'Courier (Tunde)', demoId: 'tunde_rider', icon: Bike },
    { role: 'founder', label: 'Founder Admin', demoId: 'champion', icon: ShieldCheck },
  ];

  const redirectForRole = (role?: UserRole) => {
    const params = new URLSearchParams(window.location.search);
    const redirectTarget = params.get('redirect');
    if (redirectTarget && redirectTarget.startsWith('/')) {
      onNavigate(redirectTarget);
      return;
    }

    if (role === 'merchant') {
      onNavigate('/merchant/dashboard');
    } else if (role === 'ibo') {
      onNavigate('/ibo/dashboard');
    } else if (role === 'agent') {
      onNavigate('/agent/dashboard');
    } else if (role === 'founder') {
      onNavigate('/admin');
    } else {
      const attributedSlug = localStorage.getItem('attributedIboSlug');
      if (attributedSlug) {
        onNavigate(`/shop/${attributedSlug}`);
      } else {
        onNavigate('/');
      }
    }
  };

  const handleQuickFillDemo = (demoId: string) => {
    setErrorMsg(null);
    setIdentifier(demoId);
    setPassword('password123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'login') {
      if (!identifier.trim() || !password) {
        setErrorMsg('Enter your email, username, or phone number and password.');
        return;
      }

      setIsLoading(true);
      try {
        const result = await signInWithCredentials(identifier.trim(), password);
        if (result.success && result.user) {
          setSuccessMsg(`Signed in as ${result.user.name} (${result.user.role.toUpperCase()}). Redirecting...`);
          setTimeout(() => redirectForRole(result.user?.role), 350);
        } else {
          setErrorMsg(result.error || 'Invalid credentials. Check your details and try again.');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Sign in failed.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Customer Signup mode ONLY (Partner roles onboard via dedicated KYC/verification flows)
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
        setErrorMsg('Complete all required fields to create your customer account.');
        return;
      }

      setIsLoading(true);
      try {
        const autoUsername =
          username.trim() ||
          email
            .trim()
            .split('@')[0]
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase();

        const created = await authService.registerUserWithCredentials({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          username: autoUsername,
          password,
          role: 'customer',
          entityId: `cust-${Date.now()}`,
        });
        setSessionUser(created);
        setSuccessMsg(`Customer account created for ${created.name}. Redirecting...`);
        setTimeout(() => redirectForRole('customer'), 350);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Could not create account.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="py-10 px-4 bg-page">
      <div className="max-w-[420px] w-full mx-auto bg-surface border border-line rounded p-6 space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 border border-line rounded overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              window.history.replaceState({}, '', '/login');
            }}
            className={`h-10 text-[14px] font-bold cursor-pointer ${
              mode === 'login'
                ? 'bg-primary text-on-primary'
                : 'bg-page text-muted hover:text-ink'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              window.history.replaceState({}, '', '/signup');
            }}
            className={`h-10 text-[14px] font-bold border-l border-line cursor-pointer ${
              mode === 'signup'
                ? 'bg-primary text-on-primary'
                : 'bg-page text-muted hover:text-ink'
            }`}
          >
            Customer Sign Up
          </button>
        </div>

        <div>
          <h1 className="page-title">
            {mode === 'login' ? 'Sign in to your account' : 'Create a Shopper Account'}
          </h1>
          <p className="text-[12px] text-muted mt-1">
            {mode === 'login'
              ? 'Sign in with your email, username, or phone number.'
              : 'Sign up as a shopper to buy items and track your deliveries. Want to sell, open an online shop, or deliver packages? Use the links at the bottom.'}
          </p>
        </div>

        {/* Quick Demo Credentials helper on Login tab only */}
        {mode === 'login' && (
          <div className="p-3 bg-page border border-line rounded space-y-2">
            <div className="text-[11px] font-bold text-muted uppercase">
              Quick Demo Credentials (1-Click Fill)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acct) => {
                const Icon = acct.icon;
                const isSelected = identifier === acct.demoId;
                return (
                  <button
                    key={acct.role}
                    type="button"
                    onClick={() => handleQuickFillDemo(acct.demoId)}
                    className={`h-9 px-2.5 rounded border text-left text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary-tint border-primary-dark text-on-primary font-bold'
                        : 'bg-surface border-line text-ink hover:bg-primary-tint/50 font-medium'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-primary-dark shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{acct.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-page border border-sale rounded flex items-start gap-2 text-[12px] text-sale">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-primary-tint border border-primary-dark rounded flex items-center gap-2 text-[12px] text-on-primary font-bold">
            <CheckCircle2
              className="w-4 h-4 text-primary-dark shrink-0"
              strokeWidth={1.75}
            />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-[14px]">
          {mode === 'signup' ? (
            <>
              <div>
                <label className="block text-[12px] font-bold text-ink mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ngozi Eze"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-ink mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ngozi@example.ng"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-ink mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 802 334 4556"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-ink mb-1">
                  Username (optional)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ngozi_shopper"
                  className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-[12px] font-bold text-ink mb-1">
                Email, Username, or Phone Number
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. amina_crafts, kofi@agrofresh.ng, or tunde_rider"
                className="w-full h-10 px-3 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold text-ink mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 pl-3 pr-10 bg-surface border border-line rounded text-ink focus:outline-none focus:border-primary-dark"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 text-muted hover:text-ink cursor-pointer"
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
            disabled={isLoading}
            className="w-full h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold text-[14px] rounded transition-colors cursor-pointer"
          >
            {isLoading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Customer Account'}
          </button>
        </form>

        {/* Partner Onboarding Flows (Dedicated KYC & Verification Pages) */}
        <div className="pt-4 border-t border-line space-y-2.5">
          <div className="text-[12px] font-bold text-ink">
            Want to partner with IBO Hub? Register via dedicated partner onboarding:
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/ibo/signup')}
              className="w-full h-10 px-3 bg-page hover:bg-primary-tint border border-line rounded flex items-center justify-between text-[12px] font-bold text-ink cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Store className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>Become an IBO (Launch White-Label Storefront)</span>
              </span>
              <ArrowRight className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/merchant/signup')}
              className="w-full h-10 px-3 bg-page hover:bg-primary-tint border border-line rounded flex items-center justify-between text-[12px] font-bold text-ink cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>Sell on IBO Hub (Verified Wholesale Merchant)</span>
              </span>
              <ArrowRight className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/agent/signup')}
              className="w-full h-10 px-3 bg-page hover:bg-primary-tint border border-line rounded flex items-center justify-between text-[12px] font-bold text-ink cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bike className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
                <span>Become a Delivery Agent (Logistics Courier)</span>
              </span>
              <ArrowRight className="w-4 h-4 text-primary-dark" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
