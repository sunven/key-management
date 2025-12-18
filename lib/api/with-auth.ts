import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// 认证后的 session 类型
export interface AuthenticatedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

// 认证后的请求上下文
export interface AuthContext {
  session: AuthenticatedSession;
}

// Handler 类型定义
type AuthenticatedHandler<P = Record<string, string>> = (
  request: NextRequest,
  context: { params: Promise<P> } & AuthContext,
) => Promise<NextResponse>;

// withAuth 高阶函数
export function withAuth<P = Record<string, string>>(
  handler: AuthenticatedHandler<P>,
): (
  request: NextRequest,
  context: { params: Promise<P> },
) => Promise<NextResponse> {
  return async (request, context) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, {
      ...context,
      session: session as AuthenticatedSession,
    });
  };
}
