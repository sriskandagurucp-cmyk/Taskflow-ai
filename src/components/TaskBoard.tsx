import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Calendar, Clock, AlertTriangle, CheckSquare, 
  Trash2, Edit2, Sparkles, ChevronDown, Check, Folder, HelpCircle, 
  RefreshCw, CheckCircle2, AlertCircle, X, ChevronRight, PlayCircle
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskCategory, AISuggestion } from '../types';

interface TaskBoardProps {
  tasks: Task[];
  token: string;
  onRefresh: () => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: 'todo', label: 'Todo Queue', color: 'text-zinc-400', border: 'border-white/5', bg: 'bg-white/[0.01]' },
  { id: 'in_progress', label: 'Active Run', color: 'text-indigo-400', border: 'border-indigo-500/10', bg: 'bg-indigo-500/5' },
  { id: 'review', label: 'Validation', color: 'text-cyan-400', border: 'border-cyan-500/10', bg: 'bg-cyan-500/5' },
  { id: 'completed', label: 'Deployed', color: 'text-emerald-400', border: 'border-emerald-500/10', bg: 'bg-emerald-500/5' }
];

export default function TaskBoard({ tasks, token, onRefresh, onAddTask, onUpdateTask, onDeleteTask }: TaskBoardProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Modal active states
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Task form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [dueDate, setDueDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(30);

  // AI Suggester Tool States
  const [isAISuggesterOpen, setIsAISuggesterOpen] = useState(false);
  const [aiMood, setAiMood] = useState('focused & execution-ready');
  const [aiCategory, setAiCategory] = useState<TaskCategory>('work');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  // Filtering Logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Drag and Drop Logic (Native standard HTML5 drag)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggingTaskId) return;

    const taskToMove = tasks.find(t => t.id === draggingTaskId);
    if (taskToMove && taskToMove.status !== status) {
      // Optimistic state change
      const updatedTask = { ...taskToMove, status, updatedAt: new Date().toISOString() };
      onUpdateTask(updatedTask);

      try {
        const res = await fetch(`/api/tasks/${draggingTaskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Failed writing sync status');
      } catch (err) {
        console.error('State rewrite error:', err);
        // Rollback on absolute failure
        onUpdateTask(taskToMove);
      }
    }
    setDraggingTaskId(null);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = { title, description, priority, category, dueDate, estimatedTime };

    try {
      if (editingTask) {
        // Edit flow
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        onUpdateTask(data.task);
      } else {
        // Create flow
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        onAddTask(data.task);
      }

      // Reset state
      setIsNewTaskOpen(false);
      setEditingTask(null);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setCategory('work');
      setDueDate('');
      setEstimatedTime(30);
    } catch (err) {
      console.error('Submission failed:', err);
    }
  };

  const triggerEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate || '');
    setEstimatedTime(task.estimatedTime || 30);
    setIsNewTaskOpen(true);
  };

  const handleTaskDelete = async (id: string) => {
    if (!window.confirm('Confirm discarding this action item?')) return;
    try {
      onDeleteTask(id);
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const generateAISuggestions = async () => {
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood: aiMood, promptCategory: aiCategory })
      });
      const data = await res.json();
      setAiSuggestions(data.suggestions || []);
    } catch (err) {
      console.error('Suggestions call failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const addAISuggestedTask = async (sug: AISuggestion) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: sug.title,
          description: sug.description,
          priority: sug.priority,
          category: sug.category,
          estimatedTime: sug.estimatedTime || 30,
          status: 'todo'
        })
      });
      const data = await res.json();
      onAddTask(data.task);
      // Remove suggestion from listed
      setAiSuggestions(prev => prev.filter(item => item.title !== sug.title));
    } catch (err) {
      console.error('Failed appending AI item:', err);
    }
  };

  // Helper mapping colors
  const getPriorityColors = (p: TaskPriority) => {
    switch (p) {
      case 'high': return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
      case 'medium': return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      default: return { text: 'text-zinc-400', bg: 'bg-zinc-800/60', border: 'border-zinc-800' };
    }
  };

  const getCategoryColors = (c: TaskCategory) => {
    switch (c) {
      case 'work': return 'border-l-indigo-500';
      case 'personal': return 'border-l-cyan-400';
      case 'growth': return 'border-l-purple-500';
      case 'finance': return 'border-l-emerald-400';
      default: return 'border-l-zinc-500';
    }
  };

  return (
    <div id="board-root" className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]/40 backdrop-blur-md">
      {/* Top action control menu */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/50 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-white font-display">
              Execution Board
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider uppercase">Pro</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5">Drag items to coordinate active workloads</p>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-3">
          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 w-48 md:w-56 text-xs focus:outline-none focus:border-indigo-500/50 transition-all text-white placeholder-white/30"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/30" />
          </div>

          {/* Filtering category */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white/80 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="all">All Arenas</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="growth">Growth</option>
            <option value="finance">Finance</option>
            <option value="other">Other</option>
          </select>

          {/* AI Task Generator Quick Button */}
          <button
            onClick={() => {
              setIsAISuggesterOpen(true);
              setAiSuggestions([]);
            }}
            className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:border-indigo-500/30 text-white/70 hover:text-white rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Suggest</span>
          </button>

          {/* Main create task */}
          <button
            onClick={() => {
              setEditingTask(null);
              setTitle('');
              setDescription('');
              setPriority('medium');
              setCategory('work');
              setEstimatedTime(30);
              setDueDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
              setIsNewTaskOpen(true);
            }}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-medium shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </header>

      {/* Kanban Board Fields */}
      <main className="flex-1 overflow-x-auto p-6 flex gap-4 items-start select-none">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, col.id)}
              className={`w-80 h-full max-h-[calc(100vh-160px)] flex flex-col rounded-2xl border ${col.border} ${col.bg} p-4 shrink-0 overflow-hidden transition-all duration-300`}
            >
              {/* Column Stats Area */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold font-display uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="px-2 py-0.5 bg-white/5 text-zinc-405 text-[10px] font-mono rounded-md border border-white/5">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Stackable card item list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <AnimatePresence>
                  {colTasks.length === 0 ? (
                    <div className="h-28 rounded-xl border border-dashed border-zinc-800/50 flex flex-col items-center justify-center text-center p-4">
                      <HelpCircle className="w-5 h-5 text-zinc-600 mb-1" />
                      <span className="text-[10px] text-zinc-500/80 uppercase tracking-widest leading-normal">Empty Lane</span>
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const prio = getPriorityColors(task.priority);
                      return (
                        <motion.div
                          key={task.id}
                          layoutId={task.id}
                          draggable
                          onDragStart={e => handleDragStart(e, task.id)}
                          className={`glass-panel p-4 rounded-xl border-l-3 ${getCategoryColors(task.category)} transform active:scale-95 cursor-grab active:cursor-grabbing hover:border-zinc-700/80 transition-shadow duration-200 block space-y-3 relative group`}
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-xs font-semibold text-zinc-100 line-clamp-1 leading-normal group-hover:text-indigo-400 transition-colors">
                              {task.title}
                            </h3>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/5 border border-white/10 text-zinc-400 font-mono rounded uppercase tracking-wider shrink-0">
                              {task.category}
                            </span>
                          </div>

                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {task.description || 'No focus specifications logged.'}
                          </p>

                          {/* Task properties footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-zinc-500 font-mono">
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center gap-1 font-semibold uppercase tracking-wider ${prio.text}`}>
                                <AlertTriangle className="w-3 h-3" />
                                {task.priority}
                              </span>
                              
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-zinc-500" />
                                {task.estimatedTime}m
                              </span>
                            </div>

                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Quick action controls on hovered states */}
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#050505]/95 border border-white/10 pl-2 pr-1 rounded-lg py-0.5">
                            <button
                              onClick={() => triggerEdit(task)}
                              className="p-1 hover:text-indigo-400 text-zinc-400 transition-colors cursor-pointer"
                              title="Modify info"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleTaskDelete(task.id)}
                              className="p-1 hover:text-red-400 text-zinc-400 transition-colors cursor-pointer"
                              title="Discard card"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </main>

      {/* 1. TASK INFO CREATOR/EDITOR OVERLAY */}
      <AnimatePresence>
        {isNewTaskOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTaskOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Content modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel w-full max-w-lg rounded-2xl p-6 relative z-10 overflow-hidden font-sans border border-zinc-800"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 to-teal-400" />
              
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-base font-bold font-display text-white">
                  {editingTask ? 'Edit Action Card' : 'Log New Action Item'}
                </h2>
                <button
                  onClick={() => setIsNewTaskOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Task Topic/Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Build API Integration Service"
                    className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1 font-medium">Specifications / Scope Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide specific outcomes or requirements for completion..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-all resize-none"
                  />
                </div>

                {/* Properties in grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-medium">Category Arena</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as TaskCategory)}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-purple-500/60"
                    >
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="growth">Growth</option>
                      <option value="finance">Finance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-medium">Urgency/Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as TaskPriority)}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-purple-500/60"
                    >
                      <option value="high">❌ High Urgency</option>
                      <option value="medium">⚡ Medium Urgency</option>
                      <option value="low">⚙️ Low Urgency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-medium">Target Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-purple-500/60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1 font-medium">Estimated Focus Time (min)</label>
                    <input
                      type="number"
                      value={estimatedTime}
                      onChange={e => setEstimatedTime(Number(e.target.value))}
                      min={5}
                      className="w-full px-3 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-purple-500/60"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsNewTaskOpen(false)}
                    className="px-4 py-2 bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-850 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-bold rounded-xl tracking-wider uppercase cursor-pointer"
                  >
                    {editingTask ? 'SAVE CHANGES' : 'DEPLOY ACTION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DYNAMIC AI TASK SUGGESTER WIZARD OVERLAY */}
      <AnimatePresence>
        {isAISuggesterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAISuggesterOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="glass-panel w-full max-w-xl rounded-2xl p-6 relative z-10 overflow-hidden font-sans border border-zinc-800"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-400 to-teal-400" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                  <h2 className="text-base font-bold font-display text-white">
                    AI Task Generator Assistant
                  </h2>
                </div>
                <button
                  onClick={() => setIsAISuggesterOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Formulation Parameters */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl space-y-4 mb-5">
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">AId-Focus Configuration</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Target Dimension</label>
                    <select
                      value={aiCategory}
                      onChange={e => setAiCategory(e.target.value as TaskCategory)}
                      className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-xs text-white font-medium"
                    >
                      <option value="work">💼 Professional Work</option>
                      <option value="personal">🧩 Mindset & Wellness</option>
                      <option value="growth">🚀 Skill Growth & Study</option>
                      <option value="finance">💳 Budget & Finance</option>
                      <option value="other">⚙️ Maintenance/Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Mindset Heuristic/Mood</label>
                    <select
                      value={aiMood}
                      onChange={e => setAiMood(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121214] border border-zinc-800 rounded-xl text-xs text-white font-medium"
                    >
                      <option value="highly-energetic-and-focused">⚡ High Energy & Blitz</option>
                      <option value="deep-work-uninterrupted">🔭 Deep Work / Uninterrupted</option>
                      <option value="low-energy-small-wins">🧩 Lean Wins / Low Energy</option>
                      <option value="creative-thinking-and-brainstorming">🧠 Ideation / Brainstorming</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateAISuggestions}
                  disabled={aiLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/10"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>QUERYING HYPERPLANE MODALITIES...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>GENERATE SMART TASKS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Suggestions results block */}
              <div className="max-h-64 overflow-y-auto space-y-3">
                {aiSuggestions.length === 0 && !aiLoading && (
                  <div className="h-28 text-center flex flex-col items-center justify-center text-zinc-500 text-xs">
                    <Sparkles className="w-7 h-7 text-zinc-700 mb-2" />
                    <span>Configure your target dimension and click Generate.</span>
                  </div>
                )}

                {aiLoading && (
                  <div className="py-6 flex flex-col items-center justify-center text-zinc-500 gap-3">
                    <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-mono uppercase tracking-wider animate-pulse">Consulting Gemini Neural Assistant...</span>
                  </div>
                )}

                {aiSuggestions.map((sug, i) => (
                  <div key={i} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl relative hover:border-zinc-700/60 transition-colors flex items-start gap-4 justify-between group">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-zinc-200">{sug.title}</h4>
                        <span className="px-1.5 py-0.25 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-mono rounded">
                          {sug.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal">{sug.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                        <span className="capitalize">Category: {sug.category}</span>
                        <span>•</span>
                        <span>Duration: {sug.estimatedTime} min</span>
                      </div>
                    </div>

                    <button
                      onClick={() => addAISuggestedTask(sug)}
                      className="px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/20 hover:border-transparent text-purple-300 hover:text-white rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>ACCEPT</span>
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
