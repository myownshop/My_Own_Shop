import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: { uid: string; email?: string; role?: string; name?: string };
}

// In-memory harness simulation tokens
const SIMULATION_TOKENS: Record<string, { role: string; userId: string; name: string }> = {
  'founder-session-token-sec-999': { role: 'founder', userId: 'usr-founder', name: 'Founder Admin' },
  'merchant-session-token-agro-01': { role: 'merchant', userId: 'usr-mrc-1', name: 'Kofi Mensah' },
  'ibo-session-token-amina-77': { role: 'ibo', userId: 'usr-ibo-1', name: 'Amina Bello' },
  'agent-session-token-tunde-512': { role: 'agent', userId: 'usr-agt-1', name: 'Tunde Balogun' },
  'customer-session-token-ngozi': { role: 'customer', userId: 'usr-cust-1', name: 'Ngozi Eze' },
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Check for simulation token first
  if (SIMULATION_TOKENS[token]) {
    const sim = SIMULATION_TOKENS[token];
    req.user = { uid: sim.userId, email: `${sim.role}@platform.internal`, role: sim.role, name: sim.name };
    return next();
  }

  // 2. Parse Supabase JWT or bearer token
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      req.user = {
        uid: payload.sub || payload.userId || 'usr-auth',
        email: payload.email || '',
        name: payload.user_metadata?.name || payload.name || 'User',
        role: payload.role || payload.app_metadata?.role || 'customer',
      };
      return next();
    }
  } catch (err) {
    console.warn('Bearer token parse error:', err);
  }

  return res.status(401).json({ error: 'Unauthorized: Invalid token' });
};
