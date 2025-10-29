import { cookies } from 'next/headers';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { verifySessionToken, SessionPayload } from './jwt-session';

export interface Session {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Get current session from JWT cookie
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  try {
    // Verify JWT token
    const decoded = verifySessionToken(token);

    if (!decoded) {
      return null;
    }

    // Return session data
    return {
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role as UserRole,
      },
    };
  } catch {
    return null;
  }
}

// Verify user credentials and return user data
export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
    },
  });

  if (!user || !user.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

// RBAC helpers
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  if (session.user.role !== role) {
    throw new Error(`${role} access required`);
  }
  return session;
}