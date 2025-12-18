import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// 不需要认证的 API 路由
const PUBLIC_API_ROUTES = [
  '/api/auth/', // Better Auth 处理器
  '/api/shares/*/reject', // 通过 token 验证
];

// 需要特殊处理的路由 (有自己的认证逻辑)
const SPECIAL_API_ROUTES = [
  '/api/shares/*/content', // 公共分享无需登录，私有分享在路由内检查
  '/api/shares/*/accept', // 检查 email 而非 id
];

function matchRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // 将 * 转换为正则表达式匹配任意路径段
    const regex = new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}($|/)`);
    return regex.test(pathname);
  });
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to sign-in page, auth callback routes, and public share pages
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/share/')
  ) {
    return NextResponse.next();
  }

  // API 路由的认证处理
  if (pathname.startsWith('/api/')) {
    // 跳过公共 API 路由
    if (matchRoute(pathname, PUBLIC_API_ROUTES)) {
      return NextResponse.next();
    }

    // 跳过特殊处理的路由 (它们有自己的认证逻辑)
    if (matchRoute(pathname, SPECIAL_API_ROUTES)) {
      return NextResponse.next();
    }

    // 所有其他 API 路由都需要认证
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 认证通过，继续处理
    return NextResponse.next();
  }

  // 页面路由 - 检查有效 session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    const signInUrl = new URL('/auth/signin', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
