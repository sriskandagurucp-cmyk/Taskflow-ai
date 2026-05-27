import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import TaskBoard from './components/TaskBoard';
import AIInsightsHub from './components/AIInsightsHub';
import AIChatDrawer from './components/AIChatDrawer';
import SettingsScreen from './components/SettingsScreen';
import AuthScreen from './components/AuthScreen';
import { Task } from './types';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('taskflow_token'));
  const [user, setUser] = useState<any | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'board' | 'insights' | 'chat' | 'settings'>('board');
  const [errorSync, setErrorSync] = useState<string | null>(null);

  // Synchronize dynamic lists and verify user authenticator validity
  const loadSession = async () => {
    const activeToken = localStorage.getItem('taskflow_token');
    if (!activeToken) {
      setAppLoading(false);
      return;
    }

    try {
      setAppLoading(true);
      setErrorSync(null);

      // Verify and grab user email
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (!userRes.ok) {
        throw new Error('Authorized signature mismatch or expired session.');
      }

      const userData = await userRes.json();
      setUser(userData.user);

      // Fetch active task logs list
      const tasksRes = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const tasksData = await tasksRes.json();
      setTasks(tasksData.tasks || []);
    } catch (err: any) {
      console.warn('Authentication fail fallback:', err);
      // Evict invalid state signatures immediately on crash
      localStorage.removeItem('taskflow_token');
      setToken(null);
      setUser(null);
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [token]);

  const handleAuthSuccess = (newToken: string, userData: any) => {
    localStorage.setItem('taskflow_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('taskflow_token');
    setToken(null);
    setUser(null);
    setTasks([]);
  };

  // --- LOCAL EVENT TRIGGERS (Optimistic list modifiers) ---
  const handleAddTask = (newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const tasksCount = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length
  };

  // Custom Toast or Alert notifications
  const closeErrorPrompt = () => setErrorSync(null);

  if (appLoading) {
    return (
      <div id="loading-terminal" className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative font-mono">
        {/* Subtle grid in background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="flex flex-col items-center gap-4 text-center z-10">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-1">
            <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-sm font-bold tracking-widest text-white uppercase font-display">
            BOOTING TASKFLOW SYSTEM
          </h2>
          <div className="flex gap-1.5 text-zinc-500 text-[10px] items-center">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>CONNECTING PROTOCOL SHIELD INTERFACE...</span>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated? Show the form!
  if (!token || !user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div id="home-root" className="flex h-screen bg-[#050505] overflow-hidden text-[#e0e0e0] font-sans relative">
      {/* Dynamic Ambient Glow overlay effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main navigation Sidebar panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout}
        tasksCount={tasksCount}
      />

      {/* Active screen window frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {errorSync && (
            <div className="p-3.5 bg-red-500/10 border-b border-red-500/25 flex items-center justify-between text-xs text-red-400 font-mono">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorSync}</span>
              </div>
              <button 
                onClick={closeErrorPrompt}
                className="hover:text-white underline cursor-pointer uppercase text-[9px] font-bold"
              >
                Dismiss
              </button>
            </div>
          )}
        </AnimatePresence>

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === 'board' && (
              <motion.div
                key="board"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <TaskBoard 
                  tasks={tasks} 
                  token={token} 
                  onRefresh={loadSession}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              </motion.div>
            )}

            {activeTab === 'insights' && (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <AIInsightsHub 
                  tasks={tasks} 
                  token={token}
                  userStreak={user?.streak || 1} 
                />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <AIChatDrawer token={token} />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <SettingsScreen user={user} token={token} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
