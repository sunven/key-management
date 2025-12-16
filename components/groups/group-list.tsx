'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Database, Layers, ChevronRight, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GroupDialog } from './group-dialog';
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

      <div className="flex flex-1 min-h-0 bg-white/80 backdrop-blur-xl rounded-xl border border-cyan-200 overflow-hidden shadow-2xl shadow-cyan-900/5 ring-1 ring-cyan-900/5">
        {/* Sidebar */}
        <div className="w-80 flex flex-col border-r border-cyan-200 bg-slate-50/50">
          <div className="p-4 border-b border-cyan-100 bg-white/50 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 font-mono tracking-tight">
                <Database className="w-4 h-4 text-cyan-600" />
                GROUPS
              </h2>
              <GroupDialog
                trigger={
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
                onSuccess={fetchGroups}
              />
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Filter groups..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white border-cyan-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-cyan-400 focus-visible:border-cyan-400 font-mono text-xs h-9" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-xs text-slate-400 font-mono">NO_GROUPS_FOUND</p>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all border group relative",
                    selectedGroupId === group.id
                      ? "bg-white border-cyan-200 shadow-sm text-cyan-900 z-10"
                      : "border-transparent hover:bg-white/60 hover:text-slate-900 text-slate-600 hover:border-cyan-100"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "font-medium truncate font-mono text-sm",
                      selectedGroupId === group.id ? "text-cyan-700" : "text-slate-700"
                    )}>
                      {group.name}
                    </span>
                    <Badge variant="secondary" className={cn(
                      "text-[10px] font-mono h-5 px-1.5",
                      selectedGroupId === group.id ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500 group-hover:bg-white"
                    )}>
                      {group._count.items}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 truncate font-mono max-w-[180px]">
                      {group.description || '// No description'}
                    </div>
                    {selectedGroupId === group.id && (
                      <ChevronRight className="w-3 h-3 text-cyan-400 animate-in fade-in slide-in-from-left-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white/30 relative">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="px-6 py-4 border-b border-cyan-100 bg-white/50 backdrop-blur-sm flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-slate-800 font-mono tracking-tight">
                      {selectedGroup.name}
                    </h1>
                    <Badge variant="outline" className="font-mono text-xs border-cyan-200 text-cyan-600 bg-cyan-50">
                      ID: {selectedGroup.id}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 font-mono flex items-center gap-2">
                    <span className="text-cyan-300">{'//'}</span>
                    {selectedGroup.description || 'System configuration node'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <GroupDialog
                    group={selectedGroup}
                    trigger={
                      <Button variant="outline" size="sm" className="h-8 border-cyan-200 text-cyan-600 hover:bg-cyan-50 font-mono text-xs">
                        <Settings2 className="mr-2 h-3 w-3" />
                        CONFIG
                      </Button>
                    }
                    onSuccess={fetchGroups}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
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
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-mono text-sm">SELECT_SYSTEM_GROUP</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
