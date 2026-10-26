import React, { useState } from 'react';
import {
  Globe,
  Store,
  LayoutDashboard,
  Building2,
  Bike,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { platformStore, SEED_USER_ACCOUNTS } from '../services/store';
import { UserRole } from '../types';

interface SurfaceHarnessBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const SurfaceHarnessBar: React.FC<SurfaceHarnessBarProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { currentAppUser, setSessionUser, signOutUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const state = platformStore.getState();
  const ibos = Object.values(state.iboProfiles);
  const cleanPath = currentPath.split('?')[0] || '/';

  const switchRoleAndNavigate = (role: UserRole, targetPath: string) => {
    const accounts = platformStore.getUserAccounts();
    const matchedAccount =
      accounts.find((u) => u.role === role) ||
      SEED_USER_ACCOUNTS.find((u) => u.role === role);
    if (matchedAccount) {
      setSessionUser(matchedAccount);
    }
    onNavigate(targetPath);
  };

  if (collapsed) {
    return (
      <div className="bg-dark text-white border-b border-white/15 px-3 py-1 flex items-center justify-between text-[11px] z-50">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
            DEMO HARNESS
          </span>
          <span className="text-white/70">
            Active Role:{' '}
            <strong className="text-white uppercase">
              {currentAppUser ? `${currentAppUser.role} (${currentAppUser.name})` : 'Guest / Public'}
            </strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="text-primary hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Expand Role Switcher</span>
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  const isStorefront = cleanPath.startsWith('/shop/');
  const isIboDash = cleanPath.startsWith('/ibo/dashboard') || cleanPath === '/dashboard';
  const isMerchantDash = cleanPath.startsWith('/merchant/dashboard') || cleanPath === '/merchant';
  const isAgentDash = cleanPath.startsWith('/agent/dashboard') || cleanPath === '/agent';
  const isAdminDash = cleanPath.startsWith('/admin');
  const isFounderMarket =
    !isStorefront && !isIboDash && !isMerchantDash && !isAgentDash && !isAdminDash;

  return (
    <div className="bg-dark text-white border-b border-white/15 px-3 py-1.5 z-50">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold uppercase tracking-wide">
            Surface Switcher
          </span>

          {/* 1. Founder Public Marketplace */}
          <button
            type="button"
            onClick={() => {
              switchRoleAndNavigate('customer', '/');
            }}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isFounderMarket
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Founder Marketplace (/)</span>
          </button>

          {/* 2. White-Label IBO Storefront (/shop/:slug) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                const activeSlug = localStorage.getItem('attributedIboSlug') || ibos[0]?.slug || 'amina-crafts';
                switchRoleAndNavigate('customer', `/shop/${activeSlug}`);
              }}
              className={`h-7 px-2.5 rounded-l flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                isStorefront
                  ? 'bg-primary text-on-primary font-bold'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Store className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>IBO Storefront</span>
            </button>
            <select
              aria-label="Select IBO Storefront"
              value={
                isStorefront
                  ? cleanPath.replace('/shop/', '')
                  : ibos[0]?.slug || 'amina-crafts'
              }
              onChange={(e) => {
                localStorage.setItem('attributedIboSlug', e.target.value);
                switchRoleAndNavigate('customer', `/shop/${e.target.value}`);
              }}
              className="h-7 px-1.5 bg-white/15 text-white border-l border-white/20 rounded-r text-[11px] focus:outline-none cursor-pointer"
            >
              {ibos.map((i) => (
                <option key={i.id} value={i.slug} className="bg-dark text-white">
                  /shop/{i.slug}
                </option>
              ))}
            </select>
          </div>

          {/* 3. IBO Dashboard */}
          <button
            type="button"
            onClick={() => switchRoleAndNavigate('ibo', '/ibo/dashboard')}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isIboDash
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>IBO Dashboard</span>
          </button>

          {/* 4. Merchant Portal */}
          <button
            type="button"
            onClick={() => switchRoleAndNavigate('merchant', '/merchant/dashboard')}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isMerchantDash
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Merchant Portal</span>
          </button>

          {/* 5. Delivery Agent App */}
          <button
            type="button"
            onClick={() => switchRoleAndNavigate('agent', '/agent/dashboard')}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isAgentDash
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Bike className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Delivery Agent</span>
          </button>

          {/* 6. Founder Admin */}
          <button
            type="button"
            onClick={() => switchRoleAndNavigate('founder', '/admin')}
            className={`h-7 px-2.5 rounded flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
              isAdminDash
                ? 'bg-primary text-on-primary font-bold'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Founder Admin</span>
          </button>
        </div>

        {/* Active Session Indicator + Collapse */}
        <div className="flex items-center gap-2.5">
          {currentAppUser ? (
            <div className="flex items-center gap-2 text-white/80">
              <span>
                Signed in: <strong className="text-white">{currentAppUser.name}</strong> (
                <span className="text-primary uppercase font-bold">{currentAppUser.role}</span>)
              </span>
              <button
                type="button"
                onClick={() => {
                  signOutUser();
                  onNavigate('/login');
                }}
                title="Sign out"
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" strokeWidth={1.75} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="Minimize harness bar"
            className="p-1 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
};
