import { Activity, FolderOpen, Share2 } from 'lucide-react';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  const t = await getTranslations('dashboard');

  // Fetch stats
  const userId = session.user.id;

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
        <h1 className="text-3xl font-bold tracking-tight font-mono text-primary">
          {t('title')}
        </h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          {t('welcomeBack', { name: session.user.name })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="backdrop-blur-sm transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-primary/70 uppercase tracking-wider">
              {t('totalGroups')}
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{groupsCount}</div>
            <p className="text-xs text-muted-foreground font-mono">
              {t('configGroupsCreated')}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-primary/70 uppercase tracking-wider">
              {t('totalShares')}
            </CardTitle>
            <Share2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{sharesCount}</div>
            <p className="text-xs text-muted-foreground font-mono">
              {t('activeShares')}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-mono text-primary/70 uppercase tracking-wider">
              {t('accountStatus')}
            </CardTitle>
            <Activity className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {t('active')}
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {t('allSystemsOperational')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card className="backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-primary font-mono tracking-wider uppercase text-sm">
              {t('quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/groups" className="block">
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-xs transition-all duration-300 group"
              >
                <FolderOpen className="mr-2 h-4 w-4 text-blue-500 transition-all" />
                {t('manageGroups')}
              </Button>
            </Link>
            <Link href="/shares" className="block">
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-xs transition-all duration-300 group"
              >
                <Share2 className="mr-2 h-4 w-4 text-purple-500 transition-all" />
                {t('manageShares')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
