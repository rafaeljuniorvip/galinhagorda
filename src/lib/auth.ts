import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { jwtVerify } from 'jose';
import { getOne } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me'
);

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

/**
 * Get authenticated admin user from NextAuth session OR mobile Bearer token.
 * Returns null if not authenticated or not admin/superadmin.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  // 1. Try Bearer token first (mobile app)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const user = await getOne<{ id: string; name: string; email: string; role: string; active: boolean }>(
        'SELECT id, name, email, role, active FROM admin_users WHERE id = $1',
        [payload.sub]
      );
      if (user && user.active && (user.role === 'admin' || user.role === 'superadmin')) {
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      }
    } catch {
      // Token invalid, fall through to NextAuth session
    }
  }

  // 2. Fall back to NextAuth session (web app)
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = session.user as any;
  const role = user.role as string;

  if (role !== 'admin' && role !== 'superadmin') return null;

  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role,
    avatar_url: user.avatar_url || user.image,
  };
}

/**
 * Get authenticated admin user from NextAuth session (server components).
 * Returns null if not authenticated or not admin/superadmin.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = session.user as any;
  const role = user.role as string;

  if (role !== 'admin' && role !== 'superadmin') return null;

  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    role,
    avatar_url: user.avatar_url || user.image,
  };
}
