import { Share2 } from 'lucide-react';
import { ShareList } from '@/components/shares/share-list';

export default function SharesPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-muted border">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 font-mono tracking-tight">
              MY_SHARES
            </h1>
          </div>
          <p className="text-muted-foreground font-mono text-sm">
            // Manage your shared groups and invitations
          </p>
        </div>

        <ShareList />
      </div>
    </div>
  );
}
