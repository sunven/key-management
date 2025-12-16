import Link from 'next/link';
import { auth } from '@/auth';
import { UserMenu } from './user-menu';

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-cyan-800/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-bold text-xl mr-8 font-mono tracking-tight text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
          KEY_MANAGEMENT
        </Link>
        <div className="flex gap-6 mr-auto">
          <Link
            href="/"
            className="text-sm font-medium transition-all duration-300 font-mono text-slate-400 hover:text-cyan-400 hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
          >
            DASHBOARD
          </Link>
          <Link
            href="/providers"
            className="text-sm font-medium transition-all duration-300 font-mono text-slate-400 hover:text-cyan-400 hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
          >
            PROVIDERS
          </Link>
          <Link
            href="/groups"
            className="text-sm font-medium transition-all duration-300 font-mono text-slate-400 hover:text-cyan-400 hover:drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
          >
            GROUPS
          </Link>
        </div>
        {session?.user && <UserMenu user={session.user} />}
      </div>
    </nav>
  );
}
