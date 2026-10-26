import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  supabase,
  SupabaseUser,
  testSupabaseConnection,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  signOutSupabase,
} from '../services/supabase';
import { UserRole, AppUser } from '../types';
import { authService } from '../services/authService';
import { platformStore } from '../services/store';

export interface UserProfile {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
  username?: string;
  phone?: string;
  entityId?: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: SupabaseUser | null;
  currentAppUser: AppUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  signIn: () => Promise<void>;
  signInWithCredentials: (identifier: string, password: string) => Promise<{ success: boolean; user?: AppUser; error?: string }>;
  signOutUser: () => Promise<void>;
  switchActiveRole: (newRole: UserRole) => Promise<void>;
  setSessionUser: (user: AppUser | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'afolayanchampion@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentAppUser, setCurrentAppUser] = useState<AppUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Hydrate local session if available on startup
  useEffect(() => {
    const active = authService.getActiveSession();
    if (active) {
      setCurrentAppUser(active);
      setUserProfile({
        userId: active.id,
        email: active.email,
        role: active.role,
        displayName: active.name,
        username: active.username,
        phone: active.phone,
        entityId: active.entityId,
        createdAt: active.createdAt,
      });
    }
  }, []);

  // Test Supabase / Database connectivity on boot
  useEffect(() => {
    testSupabaseConnection().then((connected) => {
      setIsSupabaseConnected(connected);
    });
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        const defaultRole: UserRole =
          user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'founder' : 'customer';

        const profile: UserProfile = {
          userId: user.id,
          email: user.email || '',
          role: defaultRole,
          displayName: user.user_metadata?.name || (user.email ? user.email.split('@')[0] : '') || 'User',
          createdAt: user.created_at || new Date().toISOString(),
        };

        setUserProfile(profile);

        // Synchronize user to PostgreSQL database
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.id,
            email: user.email || '',
            name: profile.displayName,
            role: defaultRole,
          }),
        }).catch((syncErr) => console.warn('SQL user sync note:', syncErr));
      } else {
        // Fallback to active local session if present
        const active = authService.getActiveSession();
        if (active) {
          setCurrentAppUser(active);
          setUserProfile({
            userId: active.id,
            email: active.email,
            role: active.role,
            displayName: active.name,
            username: active.username,
            phone: active.phone,
            entityId: active.entityId,
            createdAt: active.createdAt,
          });
        } else {
          setUserProfile(null);
          setCurrentAppUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      // In development or when using email/password, authenticate via demo or credentials
      const founderUser = await authService.findUser('founder@platform.internal');
      if (founderUser) {
        setSessionUser(founderUser);
      }
    } catch (error) {
      console.error('Sign In error:', error);
      throw error;
    }
  };

  const handleSignInWithCredentials = async (identifier: string, plainPassword: string) => {
    const res = await authService.signIn(identifier, plainPassword);
    if (res.success && res.user) {
      setCurrentAppUser(res.user);
      setUserProfile({
        userId: res.user.id,
        email: res.user.email,
        role: res.user.role,
        displayName: res.user.name,
        username: res.user.username,
        phone: res.user.phone,
        entityId: res.user.entityId,
        createdAt: res.user.createdAt,
      });

      // Synchronize to PostgreSQL database
      fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: res.user.id,
          email: res.user.email,
          name: res.user.name,
          role: res.user.role,
        }),
      }).catch(() => {});
    }
    return res;
  };

  const setSessionUser = (user: AppUser | null) => {
    if (user) {
      authService.setActiveSession(user);
      platformStore.switchSessionToAccount(user);
      setCurrentAppUser(user);
      setUserProfile({
        userId: user.id,
        email: user.email,
        role: user.role,
        displayName: user.name,
        username: user.username,
        phone: user.phone,
        entityId: user.entityId,
        createdAt: user.createdAt,
      });
    } else {
      authService.signOut();
      setCurrentAppUser(null);
      setUserProfile(null);
    }
  };

  const handleSignOut = async () => {
    try {
      authService.signOut();
      setCurrentAppUser(null);
      setUserProfile(null);
      if (currentUser) {
        await signOutSupabase();
      }
    } catch (error) {
      console.error('Sign Out failed:', error);
    }
  };

  const switchActiveRole = async (newRole: UserRole) => {
    if (!userProfile) return;
    const updated = { ...userProfile, role: newRole };
    setUserProfile(updated);
    if (currentAppUser) {
      const updatedAppUser: AppUser = { ...currentAppUser, role: newRole };
      setCurrentAppUser(updatedAppUser);
      authService.setActiveSession(updatedAppUser);
      authService.syncUserToDatabase(updatedAppUser).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAppUser,
        userProfile,
        loading,
        isSupabaseConnected,
        signIn: handleSignIn,
        signInWithCredentials: handleSignInWithCredentials,
        signOutUser: handleSignOut,
        switchActiveRole,
        setSessionUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
