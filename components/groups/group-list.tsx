'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupDialog } from './group-dialog';
import { GroupItemList } from './group-item-list';
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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const toggleExpand = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleDelete = async (id: number) => {
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

      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">Loading groups...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Groups</h2>
          <p className="text-muted-foreground">
            Manage your key-value configuration groups
          </p>
        </div>
        <GroupDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Group
            </Button>
          }
          onSuccess={fetchGroups}
        />
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No groups yet</p>
          <GroupDialog
            trigger={
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Group
              </Button>
            }
            onSuccess={fetchGroups}
          />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px]">Items</TableHead>
                <TableHead className="w-[150px]">Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                return (
                  <>
                    <TableRow key={group.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleExpand(group.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell
                        className="font-medium"
                        onClick={() => toggleExpand(group.id)}
                      >
                        {group.name}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={() => toggleExpand(group.id)}
                      >
                        {group.description || '-'}
                      </TableCell>
                      <TableCell onClick={() => toggleExpand(group.id)}>
                        {group._count.items}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground"
                        onClick={() => toggleExpand(group.id)}
                      >
                        {new Date(group.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <GroupDialog
                              group={group}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              }
                              onSuccess={fetchGroups}
                            />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(group.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${group.id}-items`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-0">
                          <GroupItemList
                            groupId={group.id}
                            items={group.items}
                            onRefresh={fetchGroups}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
