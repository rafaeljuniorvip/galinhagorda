import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

/**
 * Get authenticated admin user from NextAuth session (API routes).
 * Returns null if not authenticated or not admin/superadmin.
 */
export async function getAuthUser(_request: NextRequest): Promise<AuthUser | null> {
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
