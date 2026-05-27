import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BrainCircuit, MessageSquareCode, Settings2, LogOut, Cpu, Flame, CheckCircle, Clock } from 'lucide-react';

interface SidebarProps {
  activeTab: 'board' | 'insights' | 'chat' | 'settings';
  setActiveTab: (tab: 'board' | 'insights' | 'chat' | 'settings') => void;
  user: any;
  onLogout: () => void;
  tasksCount: { total: number; completed: number };
}

export default function Sidebar({ activeTab, setActiveTab, user, onLogout, tasksCount }: SidebarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const menuItems = [
    { id: 'board', label: 'Task Board', icon: LayoutDashboard },
    { id: 'insights', label: 'AI Insights', icon: BrainCircuit },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquareCode },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ] as const;

  const progressPercent = tasksCount.total > 0 
    ? Math.round((tasksCount.completed / tasksCount.total) * 100) 
    : 0;

  return (
    <div id="app-sidebar" className="w-64 bg-white/[0.02] backdrop-blur-2xl border-r border-white/5 flex flex-col h-screen font-sans shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-[#050505]/50 backdrop-blur-md">
        <div className="w-8.5 h-8.5 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Cpu className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <span className="font-display font-bold text-base tracking-wide text-white">Taskflow<span className="text-indigo-400">-ai</span></span>
          <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-mono mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>OPERATIONAL v1.0.4</span>
          </div>
        </div>
      </div>

      {/* Futuristic Systems Clock */}
      <div className="mx-4 mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center">
        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-wider mb-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>UTC Digital Clock</span>
        </div>
        <span className="text-xl font-bold font-mono text-white tracking-wider glow-text select-all">
          {formattedTime}
        </span>
        <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
          {formattedDate} — 2026
        </span>
      </div>

      {/* Operator Details / Metrics */}
      <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
        <div className="flex justify-between items-center text-xs mb-3">
          <span className="text-zinc-400 font-medium">Streak Multiplier</span>
          <div className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full font-bold font-mono">
            <Flame className="w-3.5 h-3.5" />
            <span>{user?.streak || 1}D</span>
          </div>
        </div>
        
        {/* Dynamic completion bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-500">
            <span>DAILY QUOTA</span>
            <span className="font-semibold text-zinc-300 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            />
          </div>
          <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
            <span>{tasksCount.completed} done</span>
            <span>{tasksCount.total - tasksCount.completed} pending</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                isActive
                  ? 'bg-indigo-500/10 border-l-2 border-indigo-400 text-white'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'chat' && (
                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-[9px] text-indigo-400 rounded-md font-bold uppercase tracking-wide border border-indigo-500/20">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Active User info Footer */}
      <div className="p-4 border-t border-white/5 mt-auto flex flex-col gap-3 bg-[#050505]/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1.5px] shadow-sm">
            <div className="w-full h-full rounded-full bg-[#050505] flex items-center justify-center font-bold text-xs text-white uppercase tracking-wider font-display">
              {user?.name?.slice(0, 2) || 'OP'}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name || 'Operator'}</p>
            <p className="text-[10px] text-indigo-400 font-mono truncate">{user?.email || 'console@flow.ai'}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 bg-white/5 border border-white/5 hover:bg-red-950/25 hover:border-red-500/20 hover:text-red-400 text-white/60 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </div>
  );
}
