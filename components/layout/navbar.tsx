import { headers } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/lib/auth';
import { UserMenu } from './user-menu';

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const t = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  return (
    <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link
          href="/"
          className="font-bold text-xl mr-8 font-mono tracking-tight text-primary"
        >
          {tCommon('appName')}
        </Link>
        <div className="flex gap-6 mr-auto">
          <Link
            href="/"
            className="text-sm font-medium transition-all duration-300 font-mono text-muted-foreground hover:text-primary"
          >
            {t('dashboard')}
          </Link>
          <Link
            href="/groups"
            className="text-sm font-medium transition-all duration-300 font-mono text-muted-foreground hover:text-primary"
          >
            {t('groups')}
          </Link>
          <Link
            href="/shares"
            className="text-sm font-medium transition-all duration-300 font-mono text-muted-foreground hover:text-primary"
          >
            {t('shares')}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {session?.user && <UserMenu user={session.user} />}
        </div>
      </div>
    </nav>
  );
}
