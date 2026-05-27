import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BrainCircuit, Flame, CheckCircle, Clock, TrendingUp, AlertCircle, 
  Lightbulb, ShieldCheck, HelpCircle, Sparkles, RefreshCw, Calendar, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Task, AIInsights } from '../types';

interface AIInsightsHubProps {
  tasks: Task[];
  token: string;
  userStreak: number;
}

export default function AIInsightsHub({ tasks, token, userStreak }: AIInsightsHubProps) {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setInsights(data.insights);
    } catch (err) {
      console.error('Failure fetching smart insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [tasks]); // Re-fetch on any tasks mutate

  // --- STATS COMPUTING ---
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const highPriorityTotal = tasks.filter(t => t.priority === 'high').length;
  const highCompleted = tasks.filter(t => t.priority === 'high' && t.status === 'completed').length;

  const scoreValue = insights?.productivityScore ?? (total === 0 ? 0 : Math.round((completed / total) * 100));

  // Generate dynamic 7-day completion chart data based on tasks registry
  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    // Pre-fill last 7 days metrics
    const chartMap = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return {
        day: days[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        completed: 0,
        pending: 0
      };
    });

    tasks.forEach(task => {
      const taskCreatedDate = task.createdAt.split('T')[0];
      const matchIndex = chartMap.findIndex(c => c.dateStr === taskCreatedDate);
      if (matchIndex !== -1) {
        if (task.status === 'completed') {
          chartMap[matchIndex].completed += 1;
        } else {
          chartMap[matchIndex].pending += 1;
        }
      }
    });

    // Handle initial state empty roadmap with smooth demo parameters
    const totalCompletions = chartMap.reduce((acc, curr) => acc + curr.completed, 0);
    if (totalCompletions === 0) {
      // Return a beautiful healthy progress curve for demo tracking
      return [
        { day: 'Mon', completed: 1, pending: 3 },
        { day: 'Tue', completed: 2, pending: 2 },
        { day: 'Wed', completed: 3, pending: 4 },
        { day: 'Thu', completed: 3, pending: 3 },
        { day: 'Fri', completed: 4, pending: 2 },
        { day: 'Sat', completed: 5, pending: 1 },
        { day: 'Sun', completed: completed || 6, pending: inProgress || 2 }
      ];
    }

    return chartMap.map(c => ({
      day: c.day,
      completed: c.completed,
      pending: c.pending
    }));
  };

  const chartData = getChartData();

  // Upcoming deadlines calculation
  const upcomingDeadlines = tasks
    .filter(t => t.status !== 'completed' && t.dueDate)
    .map(t => ({
      ...t,
      daysLeft: Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }))
    .filter(t => t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  return (
    <div id="insights-root" className="flex-1 overflow-y-auto bg-transparent p-6 font-sans">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            AI Performance Hub
          </h1>
          <p className="text-xs text-zinc-400">Continuous AI diagnostics and performance forecasting</p>
        </div>

        <button
          onClick={fetchInsights}
          disabled={loading}
          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-50 text-white rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Synchronize Core</span>
        </button>
      </header>

      {/* Grid containing primary circular metrics and numerical summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Score indicator circular card (gauge) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
          <h2 className="text-xs font-bold font-mono text-zinc-405 uppercase tracking-widest mb-4">Productivity Level</h2>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                strokeWidth="7"
                stroke="rgba(255, 255, 255, 0.03)"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                strokeWidth="7.5"
                stroke="url(#colorGlow)"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - scoreValue / 100)}`}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
              <defs>
                <linearGradient id="colorGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Centered digits */}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-bold font-mono text-white tracking-tighter">
                {scoreValue}
              </span>
              <span className="text-[10px] text-indigo-400 font-mono tracking-widest font-semibold">FLOW SCORE</span>
            </div>
          </div>

          <p className="text-[11px] text-zinc-450 text-center mt-4 max-w-[200px]">
            {scoreValue > 75 
              ? 'Excellent performance! Solid completion output ratios secured.' 
              : scoreValue > 40 
              ? 'Moderate workflow pace. Action roadmap completions recommended.' 
              : 'Initialization phase active. Complete pending queue cards.'}
          </p>
        </div>

        {/* Heuristic Numeric Grid Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Deploy status</span>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono text-white tracking-widest">{completed}</span>
              <span className="text-zinc-500 text-xs ml-1.5">/ {total} tasks</span>
            </div>
            <p className="text-[11px] text-zinc-450 mt-2">Verified completed and deployed action items.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Active Stream</span>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono text-indigo-400 tracking-widest">{inProgress}</span>
              <span className="text-zinc-500 text-xs ml-1.5">tasks run</span>
            </div>
            <p className="text-[11px] text-zinc-450 mt-2">Current cards locked into execution phase.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Concentric Streak</span>
            <div className="mt-4 flex items-center gap-1.5">
              <Flame className="w-7 h-7 text-orange-400 animate-pulse fill-orange-500/10" />
              <span className="text-3xl font-bold font-mono text-red-400 tracking-wider">
                {userStreak || 1}D
              </span>
            </div>
            <p className="text-[11px] text-zinc-450 mt-2">Active logins tracking velocity multiplier.</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Critical Core Resolve</span>
            <div className="mt-4">
              <span className="text-3xl font-bold font-mono text-emerald-400 tracking-widest">
                {highPriorityTotal > 0 ? Math.round((highCompleted / highPriorityTotal) * 100) : 100}%
              </span>
            </div>
            <p className="text-[11px] text-zinc-450 mt-2">Ratio of completed high urgency action items.</p>
          </div>
        </div>
      </div>

      {/* Grid containing historical progress charts & up-coming deadlines list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Recharts progress chart */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 relative">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-cyan-500/20 via-indigo-500 to-cyan-500/20" />
          <h2 className="text-xs font-bold font-mono text-zinc-420 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Productivity Progression Rate</span>
          </h2>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="completedGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="#52525b" fontSize={10} fontStyle="mono" tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} fontStyle="mono" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050505', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#06b6d4', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#completedGlow)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming action deadlines section */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xs font-bold font-mono text-zinc-420 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Upcoming Milestones</span>
          </h2>

          <div className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-8 text-center text-zinc-550 flex flex-col items-center justify-center gap-1.5">
                <ShieldCheck className="w-6 h-6 text-zinc-700" />
                <span className="text-[10px] tracking-widest uppercase text-zinc-400">Safe Horizon</span>
                <span className="text-[10px] text-zinc-500">No looming deadlines logged.</span>
              </div>
            ) : (
              upcomingDeadlines.map((task, i) => (
                <div key={i} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex justify-between items-center hover:border-white/10 transition-colors">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200 truncate max-w-[150px]">{task.title}</h4>
                    <span className="text-[9px] font-mono text-indigo-400 uppercase block mt-0.5">{task.category}</span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase ${
                    task.daysLeft <= 1 ? 'bg-red-500/10 text-red-400' : 'bg-white/5 border border-white/5 text-zinc-400'
                  }`}>
                    {task.daysLeft === 0 ? 'TODAY' : task.daysLeft === 1 ? 'TOMORROW' : `${task.daysLeft}D LEFT`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Structured Diagnostics Powered by Gemini Client API */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-505" />
        
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
          <BrainCircuit className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-widest">Autonomous Smart Diagnostic</h3>
            <span className="text-[9.5px] font-mono text-zinc-450">Generated server-side utilizing Neural Models</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-zinc-500">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest animate-pulse">Running telemetry calculation matrix...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1.5">
            
            {/* Summary */}
            <div className="md:col-span-2 space-y-2">
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Diagnostics Synopsis</span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans mt-1">
                {insights?.summary || "Active telemetry engine compiling baseline roadmap logs. Maintain checkins to initialize personalized insight grids."}
              </p>
            </div>

            {/* Strengths & Recommendations */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1.5">Key Focus Strengths</span>
                <ul className="space-y-1">
                  {insights?.strengths.map((str, i) => (
                    <li key={i} className="text-[11px] text-zinc-300 flex items-start gap-1.5">
                      <span className="text-cyan-400 mt-0.5">•</span>
                      <span>{str}</span>
                    </li>
                  )) || (
                    <li className="text-[11px] text-zinc-500">Mapping logs...</li>
                  )}
                </ul>
              </div>

              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block mb-1.5">Remediation Roadmap</span>
                <ul className="space-y-1">
                  {insights?.recommendations.map((rec, i) => (
                    <li key={i} className="text-[11px] text-zinc-300 flex items-start gap-2 leading-relaxed font-sans">
                      <span className="text-indigo-400 mt-0.5 font-bold">»</span>
                      <span>{rec}</span>
                    </li>
                  )) || (
                    <li className="text-[11px] text-zinc-500">Mapping logs...</li>
                  )}
                </ul>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
