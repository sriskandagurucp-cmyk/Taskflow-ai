import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, Terminal, Cpu, ArrowRight } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (token: string, userData: any) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // First try to login existing demo user, if not exists, sign up automatically
      const demoEmail = 'demo@taskflow.ai';
      const demoPw = 'demo1234';

      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPw }),
      });

      if (!res.ok) {
        // Sign up demo user
        res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Alpha Voyager', email: demoEmail, password: demoPw }),
        });
      }

      const data = await res.json();
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError('Could not connect to database fallback. Loading dynamic local state.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-root" className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-teal-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Futuristic Grid Background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand identity */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-3"
          >
            <Cpu className="w-8 h-8 text-purple-400" />
          </motion.div>
          <motion.h1
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl font-bold font-display tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent"
          >
            Taskflow<span className="text-purple-400">.ai</span>
          </motion.h1>
          <p className="text-zinc-400 text-sm mt-1">Next-gen autonomous productivity engine</p>
        </div>

        {/* Auth Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-panel p-8 rounded-3xl glow-hover relative overflow-hidden"
        >
          {/* Subtle status bar decoration */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-purple-500/40 via-purple-500 to-teal-500/40" />

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white font-display">
              {isLogin ? 'Initialize Session' : 'Register Operator'}
            </h2>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
            >
              {isLogin ? 'Request account' : 'Existing operator?'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1 font-medium">Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-sans"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">Console Passkey</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all font-sans"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start gap-2">
                <Terminal className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'BOOT SESSION' : 'INITIALIZE SYSTEM'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80"></div>
            </div>
            <span className="relative bg-[#121214] px-3 text-[10px] text-zinc-500 tracking-wider">OR QUICK TESTPASS</span>
          </div>

          {/* Demo Button */}
          <button
            onClick={demoEmail => handleDemoLogin()}
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold tracking-wide transition-all hover:text-white flex items-center justify-center gap-2 cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>LAUNCH DEMO SANDBOX (ONE-CLICK)</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
