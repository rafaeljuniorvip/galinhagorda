import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/userService';

export async function GET(_request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(userId),
    getUnreadNotificationCount(userId),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user || !(session.user as any).id) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsRead(userId);
    } else if (notificationId) {
      await markNotificationRead(notificationId, userId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API] Error marking notification:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
