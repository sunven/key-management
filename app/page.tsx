import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Key, Activity, CheckCircle2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch stats
  const userId = parseInt(session.user.id);

  console.time('provider:find')
  const userProviders = await prisma.provider.findMany({
    where: {
      userId,
    },
    include: {
      tokens: true,
    },
  });
  console.timeEnd('provider:find')

  // Fetch groups count
  const groupsCount = await prisma.group.count({
    where: {
      userId,
    },
  });

  const activeProviders = userProviders.filter((p) => p.active).length;
  const totalTokens = userProviders.reduce((sum, p) => sum + (p.tokens?.length || 0), 0);

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">DASHBOARD</h1>
        <p className="text-slate-400 font-mono text-sm mt-1">WELCOME_BACK :: {session.user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Total Providers</CardTitle>
            <Database className="h-4 w-4 text-fuchsia-500 drop-shadow-[0_0_3px_rgba(232,121,249,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-cyan-100">{userProviders.length}</div>
            <p className="text-xs text-slate-500 font-mono">API providers configured</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Active Providers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-cyan-100">{activeProviders}</div>
            <p className="text-xs text-slate-500 font-mono">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Total Tokens</CardTitle>
            <Key className="h-4 w-4 text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-cyan-100">{totalTokens}</div>
            <p className="text-xs text-slate-500 font-mono">API tokens stored</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Total Groups</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-400 drop-shadow-[0_0_3px_rgba(96,165,250,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-cyan-100">{groupsCount}</div>
            <p className="text-xs text-slate-500 font-mono">Config groups created</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:bg-slate-900/80 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-rose-400 drop-shadow-[0_0_3px_rgba(251,113,133,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">Active</div>
            <p className="text-xs text-slate-500 font-mono">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-500 font-mono tracking-wider uppercase text-sm drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Recent Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {userProviders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-cyan-900/50 font-mono mb-4 animate-pulse">NO_PROVIDERS_YET</p>
                <Link href="/providers">
                  <Button className="bg-slate-900/50 text-cyan-500 border border-cyan-800/50 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500 font-mono text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    INIT_FIRST_PROVIDER
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userProviders.slice(0, 5).map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between border-b border-cyan-900/30 pb-2 last:border-0 hover:bg-cyan-950/10 transition-colors rounded px-2"
                  >
                    <div>
                      <p className="font-medium font-mono text-cyan-300 text-sm">{provider.name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate max-w-xs">
                        {provider.baseUrl}
                      </p>
                    </div>
                    <div className="text-xs text-fuchsia-400 font-mono">
                      {provider.tokens?.length || 0} TOKENS
                    </div>
                  </div>
                ))}
                {userProviders.length > 5 && (
                  <Link href="/providers">
                    <Button variant="link" className="w-full text-cyan-600 hover:text-cyan-400 font-mono text-xs">
                      VIEW_ALL_PROVIDERS
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-500 font-mono tracking-wider uppercase text-sm drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/providers" className="block">
              <Button variant="outline" className="w-full justify-start bg-slate-900/30 border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 group">
                <Database className="mr-2 h-4 w-4 text-fuchsia-500 group-hover:drop-shadow-[0_0_5px_rgba(232,121,249,0.5)] transition-all" />
                MANAGE_PROVIDERS_TOKENS
              </Button>
            </Link>
            <Link href="/groups" className="block">
              <Button variant="outline" className="w-full justify-start bg-slate-900/30 border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 group">
                <FolderOpen className="mr-2 h-4 w-4 text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-all" />
                MANAGE_GROUPS
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
