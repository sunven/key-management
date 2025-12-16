import { GroupList } from '@/components/groups/group-list';

export default function GroupsPage() {
  return (
    <div className="h-screen bg-slate-50 text-slate-900 selection:bg-cyan-200/50 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-400/5 blur-[100px]" />
      </div>
      <div className="relative z-10 h-full p-6">
        <GroupList />
      </div>
    </div>
  );
}
