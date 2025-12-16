'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Database, Layers, ChevronRight, Settings2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupDialog } from './group-dialog';
import { ShareDialog } from './share-dialog';
import { GroupItemList } from './group-item-list';
import { GlobalTagSearch } from './global-tag-search';
import type { Group, GroupItem, ItemTag } from '@prisma/client';

interface GroupItemWithTags extends GroupItem {
  tags: ItemTag[];
}

interface GroupWithItems extends Group {
  items: GroupItemWithTags[];
  _count: {
    items: number;
  };
}

export function GroupList() {
  const [groups, setGroups] = useState<GroupWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareGroupId, setShareGroupId] = useState<number | null>(null);
  const [shareGroupName, setShareGroupName] = useState('');

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
      // Auto-select first group if none selected and groups exist
      if (!selectedGroupId && data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (id: number) => {
    if (
      !confirm(
        'Are you sure you want to delete this group? All items and tags will be deleted.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete group');

      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      fetchGroups();
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group. Please try again.');
    }
  };

  const handleOpenShareDialog = (groupId: number, groupName: string) => {
    setShareGroupId(groupId);
    setShareGroupName(groupName);
    setShareDialogOpen(true);
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent"></div>
          <div className="text-cyan-600 font-mono text-sm animate-pulse">INITIALIZING_SYSTEM...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <GlobalTagSearch />

      <div className="flex flex-1 min-h-0 bg-slate-950/80 backdrop-blur-xl rounded-xl border border-cyan-800/50 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-cyan-800/50 bg-slate-900/50">
          <div className="p-4 border-b border-cyan-800/50 bg-slate-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-cyan-400 flex items-center gap-2 font-mono tracking-tight shadow-cyan-500/50 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                <Database className="w-4 h-4 text-fuchsia-500" />
                GROUPS
              </h2>
              <GroupDialog
                trigger={
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
                onSuccess={fetchGroups}
              />
            </div>
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-cyan-700 group-hover:text-cyan-500 transition-colors" />
              <Input 
                placeholder="FILTER_NET..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-slate-950/50 border-cyan-900/50 text-cyan-100 placeholder:text-cyan-900/50 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 font-mono text-xs h-9 transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-xs text-cyan-900/50 font-mono animate-pulse">NO_GROUPS_FOUND</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all border group relative overflow-hidden",
                    selectedGroupId === group.id
                      ? "bg-cyan-950/30 border-cyan-500/50 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.15)] z-10"
                      : "border-transparent hover:bg-cyan-950/20 hover:text-cyan-200 text-slate-500 hover:border-cyan-900/50"
                  )}
                >
                  {selectedGroupId === group.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                  )}
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "font-medium truncate font-mono text-sm tracking-wide",
                      selectedGroupId === group.id ? "text-cyan-300 drop-shadow-[0_0_3px_rgba(6,182,212,0.5)]" : "text-slate-500 group-hover:text-cyan-400"
                    )}>
                      {group.name}
                    </span>
                    <Badge variant="secondary" className={cn(
                      "text-[10px] font-mono h-5 px-1.5 border",
                      selectedGroupId === group.id 
                        ? "bg-cyan-950/50 text-cyan-400 border-cyan-500/30" 
                        : "bg-slate-900/50 text-slate-600 border-slate-800 group-hover:border-cyan-900/50 group-hover:text-cyan-600"
                    )}>
                      {group._count.items}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-600 truncate font-mono max-w-[180px] group-hover:text-slate-500 transition-colors">
                      {group.description || '// No description'}
                    </div>
                    {selectedGroupId === group.id && (
                      <ChevronRight className="w-3 h-3 text-fuchsia-500 animate-in fade-in slide-in-from-left-1 drop-shadow-[0_0_5px_rgba(217,70,239,0.8)]" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-slate-950/50 relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-slate-950 to-slate-950">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="px-6 py-4 border-b border-cyan-900/30 bg-slate-900/30 backdrop-blur-sm flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono tracking-tight drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                      {selectedGroup.name}
                    </h1>
                    <Badge variant="outline" className="font-mono text-xs border-cyan-800/50 text-cyan-600 bg-cyan-950/30">
                      ID: {selectedGroup.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-mono flex items-center gap-2">
                    <span className="text-fuchsia-500">{'//'}</span>
                    {selectedGroup.description || 'System configuration node'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 border-cyan-800/50 text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-slate-950/50"
                    onClick={() => handleOpenShareDialog(selectedGroup.id, selectedGroup.name)}
                  >
                    <Share2 className="mr-2 h-3 w-3" />
                    SHARE
                  </Button>
                  <GroupDialog
                    group={selectedGroup}
                    trigger={
                      <Button variant="outline" size="sm" className="h-8 border-cyan-800/50 text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500/50 font-mono text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-slate-950/50">
                        <Settings2 className="mr-2 h-3 w-3" />
                        CONFIG
                      </Button>
                    }
                    onSuccess={fetchGroups}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500/70 hover:text-rose-400 hover:bg-rose-950/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all duration-300"
                    onClick={() => handleDeleteGroup(selectedGroup.id)}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Group Content */}
              <div className="flex-1 overflow-hidden">
                <GroupItemList
                  groupId={selectedGroup.id}
                  items={selectedGroup.items}
                  onRefresh={fetchGroups}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-cyan-900/30 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
                <Database className="w-8 h-8 text-cyan-900" />
              </div>
              <p className="font-mono text-sm text-cyan-900/50 tracking-widest">SELECT_SYSTEM_GROUP</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {shareGroupId && (
        <ShareDialog
          groupId={shareGroupId}
          groupName={shareGroupName}
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          onSuccess={fetchGroups}
        />
      )}
    </div>
  );
}
