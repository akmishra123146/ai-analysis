import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'crm_ai_analytics_super_secret_jwt_key_2026';

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
}

export function signToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

/**
 * Extracts authenticated user session identity directly from HTTP cookies or Authorization header.
 * NEVER trusts request bodies for user identity.
 */
export async function getAuthenticatedSession(req?: NextRequest): Promise<UserSession | null> {
  // 1. Check HTTP-only cookie first
  const cookieStore = cookies();
  const tokenFromCookie = cookieStore.get('crm_session')?.value;

  if (tokenFromCookie) {
    const session = verifyToken(tokenFromCookie);
    if (session) return session;
  }

  // 2. Check Authorization Header (Bearer token)
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = verifyToken(token);
      if (session) return session;
    }
  }

  return null;
}
