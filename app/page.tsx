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
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Providers</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProviders.length}</div>
            <p className="text-xs text-muted-foreground">API providers configured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProviders}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens}</div>
            <p className="text-xs text-muted-foreground">API tokens stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupsCount}</div>
            <p className="text-xs text-muted-foreground">Config groups created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Providers</CardTitle>
          </CardHeader>
          <CardContent>
            {userProviders.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">No providers yet</p>
                <Link href="/providers">
                  <Button>Add Your First Provider</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {userProviders.slice(0, 5).map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {provider.baseUrl}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {provider.tokens?.length || 0} tokens
                    </div>
                  </div>
                ))}
                {userProviders.length > 5 && (
                  <Link href="/providers">
                    <Button variant="link" className="w-full">
                      View All Providers
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/providers" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Database className="mr-2 h-4 w-4" />
                Manage Providers & Tokens
              </Button>
            </Link>
            <Link href="/groups" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FolderOpen className="mr-2 h-4 w-4" />
                Manage Groups
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
