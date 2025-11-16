import Link from 'next/link';
import { auth } from '@/auth';
import { UserMenu } from './user-menu';

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-bold text-xl mr-8">
          Key Management
        </Link>
        <div className="flex gap-6 mr-auto">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Dashboard
          </Link>
          <Link
            href="/providers"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Providers
          </Link>
          <Link
            href="/tokens"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Tokens
          </Link>
        </div>
        {session?.user && <UserMenu user={session.user} />}
      </div>
    </nav>
  );
}
