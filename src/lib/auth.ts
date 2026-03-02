import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
// Auth utilities

export async function getSession(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });

  if (!session || session.expires < new Date()) return null;

  return {
    userId: session.user.id,
    user: session.user,
    sessionToken: session.sessionToken
  };
}

export async function getCurrentUser(request: NextRequest) {
  const session = await getSession(request);
  return session?.user || null;
}
