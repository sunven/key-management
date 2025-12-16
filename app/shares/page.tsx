import { Share2 } from 'lucide-react';
import { ShareList } from '@/components/shares/share-list';

export default function SharesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-cyan-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-800/50">
              <Share2 className="h-6 w-6 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono tracking-tight">
              MY_SHARES
            </h1>
          </div>
          <p className="text-cyan-600/70 font-mono text-sm">
            // Manage your shared groups and invitations
          </p>
        </div>

        <ShareList />
      </div>
    </div>
  );
}
