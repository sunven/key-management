import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, FolderOpen, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch stats
  const userId = parseInt(session.user.id);

  // Fetch groups count
  const groupsCount = await prisma.group.count({
    where: {
      userId,
    },
  });

  // Fetch shares count
  const sharesCount = await prisma.share.count({
    where: {
      userId,
    },
  });

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">DASHBOARD</h1>
        <p className="text-slate-400 font-mono text-sm mt-1">WELCOME_BACK :: {session.user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
            <CardTitle className="text-sm font-medium font-mono text-cyan-500/70 uppercase tracking-wider">Total Shares</CardTitle>
            <Share2 className="h-4 w-4 text-purple-400 drop-shadow-[0_0_3px_rgba(192,132,252,0.5)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-cyan-100">{sharesCount}</div>
            <p className="text-xs text-slate-500 font-mono">Active shares</p>
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

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-slate-900/50 border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <CardHeader>
            <CardTitle className="text-cyan-500 font-mono tracking-wider uppercase text-sm drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/groups" className="block">
              <Button variant="outline" className="w-full justify-start bg-slate-900/30 border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 group">
                <FolderOpen className="mr-2 h-4 w-4 text-blue-500 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.5)] transition-all" />
                MANAGE_GROUPS
              </Button>
            </Link>
            <Link href="/shares" className="block">
              <Button variant="outline" className="w-full justify-start bg-slate-900/30 border-cyan-800/50 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-200 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 group">
                <Share2 className="mr-2 h-4 w-4 text-purple-500 group-hover:drop-shadow-[0_0_5px_rgba(192,132,252,0.5)] transition-all" />
                MANAGE_SHARES
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
