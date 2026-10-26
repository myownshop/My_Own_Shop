import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

// Configuration from environment variables or sensible development defaults
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://mock-project.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-anon-key';

export const isConfigured = Boolean(
  (import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
);

// Create Supabase client singleton
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type { SupabaseUser };

// Test connection to Supabase / Backend database
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      return Boolean(data.status === 'ok');
    }
    return false;
  } catch (err) {
    console.warn('Supabase/Database health check note:', err);
    return false;
  }
}

// Authentication Helpers
export async function signInWithEmailPassword(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return data.user;
  } catch (error) {
    console.warn('Supabase sign-in note (falling back to local credentials):', error);
    throw error;
  }
}

export async function signUpWithEmailPassword(email: string, password: string, userData?: Record<string, any>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    if (error) {
      throw error;
    }
    return data.user;
  } catch (error) {
    console.warn('Supabase sign-up note:', error);
    throw error;
  }
}

export async function signOutSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn('Supabase signOut note:', error);
  }
}
