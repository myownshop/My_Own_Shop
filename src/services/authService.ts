import { AppUser, UserRole, UserSession } from '../types';
import { platformStore } from './store';
import { supabase } from './supabase';

const AUTH_USER_KEY = 'ibohub_active_authenticated_user';

/**
 * Normalizes phone numbers (stripping whitespace, hyphens, parentheses, and leading plus)
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalizes username by stripping leading @ and lowercasing
 */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/^@/, '');
}

/**
 * Generate a 6-digit numerical verification token
 */
export function generateVerificationToken(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const code = (array[0] % 900000) + 100000;
  return code.toString();
}

/**
 * Secure SHA-256 hash using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies password against stored password or hash
 */
export async function verifyPassword(plainText: string, storedHashOrPlain: string): Promise<boolean> {
  if (!plainText || !storedHashOrPlain) return false;
  if (plainText === storedHashOrPlain) return true;
  const computedHash = await hashPassword(plainText);
  return computedHash === storedHashOrPlain;
}

/**
 * Lookup a user by Email, Username, or Phone Number
 */
export async function findUserByIdentifier(identifier: string): Promise<AppUser | null> {
  const cleanId = identifier.trim();
  if (!cleanId) return null;

  const lower = cleanId.toLowerCase();
  const cleanUser = normalizeUsername(cleanId);
  const digitsOnly = normalizePhoneNumber(cleanId);

  // 1. Check local PlatformStore user accounts
  const localUsers = platformStore.getUserAccounts();
  const matchedLocal = localUsers.find((u) => {
    if (u.email && u.email.toLowerCase() === lower) return true;
    if (u.username && normalizeUsername(u.username) === cleanUser) return true;
    if (digitsOnly.length >= 7 && u.phone && normalizePhoneNumber(u.phone).endsWith(digitsOnly.slice(-10))) return true;
    return false;
  });

  if (matchedLocal) return matchedLocal;

  // 2. Query Supabase / Database users table if client is configured
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${lower},username.eq.${cleanUser},phone.eq.${cleanId}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.uid || String(data.id),
        name: data.name,
        email: data.email,
        username: data.username || '',
        phone: data.phone || '',
        passwordHash: data.password_hash || '',
        role: data.role as UserRole,
        entityId: data.entity_id,
        tokenVerified: Boolean(data.token_verified),
        createdAt: data.created_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Supabase user lookup note:', err);
  }

  return null;
}

/**
 * Authenticate user with Email, Username, or Phone Number + Password
 */
export async function authenticateWithIdentifierAndPassword(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  if (!identifier.trim()) {
    return { success: false, error: 'Please enter your email, username, or phone number.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return {
      success: false,
      error: 'No account found matching this email, username, or phone number. Please check your spelling or register.',
    };
  }

  const isMatch = await verifyPassword(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, error: 'Incorrect password. Please verify and try again.' };
  }

  // Save authenticated user to session
  setStoredAuthUser(user);

  // Sync to platformStore active session
  platformStore.switchSessionToAccount(user);

  return { success: true, user };
}

/**
 * Save user to local storage, platform store, and Supabase / PostgreSQL backend
 */
export async function registerAndSaveUserAccount(user: AppUser): Promise<void> {
  // 1. Save to local store
  platformStore.createUserAccount(user);

  // 2. Set as currently logged in user
  setStoredAuthUser(user);
  platformStore.switchSessionToAccount(user);

  // 3. Save to Supabase / PostgreSQL via backend sync API
  try {
    await fetch('/api/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        username: normalizeUsername(user.username),
        phone: user.phone,
        role: user.role,
        entityId: user.entityId,
      }),
    });
  } catch (err) {
    console.warn('User saved locally; Supabase sync note:', err);
  }
}

/**
 * Manage cached local authenticated user session
 */
export function getStoredAuthUser(): AppUser | null {
  try {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as AppUser;
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AppUser | null): void {
  try {
    localStorage.removeItem('activeIboId');
    localStorage.removeItem('activeMerchantId');
    localStorage.removeItem('activeAgentId');

    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      if (user.role === 'ibo') {
        localStorage.setItem('activeIboId', user.entityId || 'ibo-1');
      } else if (user.role === 'merchant') {
        localStorage.setItem('activeMerchantId', user.entityId || 'mrc-1');
      } else if (user.role === 'agent') {
        localStorage.setItem('activeAgentId', user.entityId || 'agt-1');
      }
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // Ignore localStorage write failure
  }
}

const VERIFICATION_STORAGE_KEY = 'ibohub_verification_tokens';

function getStoredTokens(): Record<string, { code: string; timestamp: number }> {
  try {
    const raw = localStorage.getItem(VERIFICATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredTokens(tokens: Record<string, { code: string; timestamp: number }>): void {
  try {
    localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Ignore storage write failure
  }
}

export function sendConfirmationCode(params: { email?: string; phone?: string; name?: string }): { success: boolean; code: string } {
  const code = generateVerificationToken();
  const tokens = getStoredTokens();
  const now = Date.now();

  if (params.phone) {
    const cleanPhone = normalizePhoneNumber(params.phone);
    tokens[cleanPhone] = { code, timestamp: now };
    tokens[params.phone.trim()] = { code, timestamp: now };
  }
  if (params.email) {
    tokens[params.email.trim().toLowerCase()] = { code, timestamp: now };
  }

  tokens['latest'] = { code, timestamp: now };
  saveStoredTokens(tokens);

  return { success: true, code };
}

export function verifyConfirmationCode(destination: string, enteredCode: string): { verified: boolean; error?: string } {
  const cleanCode = enteredCode.trim();
  if (!cleanCode) {
    return { verified: false, error: 'Please enter the 6-digit confirmation code.' };
  }

  // Universal demo testing code
  if (cleanCode === '123456') {
    return { verified: true };
  }

  const tokens = getStoredTokens();
  const destClean = destination.trim().toLowerCase();
  const phoneClean = normalizePhoneNumber(destination);

  const matched =
    tokens[destClean] ||
    (phoneClean ? tokens[phoneClean] : undefined) ||
    tokens['latest'];

  if (matched && matched.code === cleanCode) {
    return { verified: true };
  }

  return { verified: false, error: 'Invalid confirmation code. Please check the code or request a new one.' };
}

export async function registerUserWithCredentials(params: {
  name: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  entityId?: string;
}): Promise<AppUser> {
  const cleanUser = normalizeUsername(params.username);
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPhone = params.phone.trim();

  // Check if email or username already taken
  const existingByEmail = await findUserByIdentifier(cleanEmail);
  if (existingByEmail) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const existingByUsername = await findUserByIdentifier(cleanUser);
  if (existingByUsername) {
    throw new Error('This username is already taken. Please choose another username.');
  }

  const newUserId = `usr-${Date.now()}`;
  const newUser: AppUser = {
    id: newUserId,
    name: params.name.trim(),
    email: cleanEmail,
    username: cleanUser,
    phone: cleanPhone,
    passwordHash: params.password,
    role: params.role,
    entityId: params.entityId,
    tokenVerified: true,
    createdAt: new Date().toISOString(),
  };

  await registerAndSaveUserAccount(newUser);
  return newUser;
}

export function logOutAuthUser(): void {
  setStoredAuthUser(null);
}

export const authService = {
  getActiveSession: getStoredAuthUser,
  setActiveSession: setStoredAuthUser,
  signOut: logOutAuthUser,
  signIn: authenticateWithIdentifierAndPassword,
  syncUserToDatabase: registerAndSaveUserAccount,
  syncUserToFirestore: registerAndSaveUserAccount,
  findUser: findUserByIdentifier,
  generateToken: generateVerificationToken,
  sendConfirmationCode,
  verifyConfirmationCode,
  registerUserWithCredentials,
};
