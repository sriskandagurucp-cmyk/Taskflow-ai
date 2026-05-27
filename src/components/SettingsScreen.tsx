import React, { useState } from 'react';
import { 
  Settings2, User, Cpu, Shield, Clock, HardDrive, Bell, CheckCircle2, 
  Terminal, Server, Globe
} from 'lucide-react';

interface SettingsScreenProps {
  user: any;
  token: string;
}

export default function SettingsScreen({ user, token }: SettingsScreenProps) {
  const [pomodoroLength, setPomodoroLength] = useState(25);
  const [breakLength, setBreakLength] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div id="settings-root" className="flex-1 overflow-y-auto bg-[#09090b] p-6 font-sans">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
          System Control Center
        </h1>
        <p className="text-xs text-zinc-400">Configure core node execution habits and profile parameters</p>
      </header>

      <div className="max-w-3xl space-y-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-purple-500/20 to-transparent" />
          
          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <span>Operator Information</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] text-zinc-500 mb-1">Operator Alias</span>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-medium">
                {user?.name || 'Alpha Voyager'}
              </div>
            </div>

            <div>
              <span className="block text-[11px] text-zinc-500 mb-1">Authenticated Account</span>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-purple-300 font-mono">
                {user?.email || 'console@flow.ai'}
              </div>
            </div>
          </div>
        </div>

        {/* Focus Engine Pomodoro Configurations */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-teal-500/20 to-transparent" />

          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Focus Interval Configuration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>POMODORO SPRINT LENGTH</span>
                <span className="font-bold text-teal-400 font-mono">{pomodoroLength} min</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={pomodoroLength}
                onChange={e => setPomodoroLength(Number(e.target.value))}
                className="w-full accent-teal-400 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>COGNITIVE RESET LENGTH (BREAK)</span>
                <span className="font-bold text-teal-400 font-mono">{breakLength} min</span>
              </div>
              <input
                type="range"
                min={2}
                max={25}
                step={1}
                value={breakLength}
                onChange={e => setBreakLength(Number(e.target.value))}
                className="w-full accent-teal-400 bg-zinc-900 rounded-lg appearance-none h-1.5 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Preferences Switches */}
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-400" />
            <span>Telemetry Alerts</span>
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Terminal Notifications</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Toggle browser diagnostic push updates for finished pomodoros.</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
                  notificationsEnabled ? 'bg-purple-600' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all ${
                  notificationsEnabled ? 'right-0.75' : 'left-0.75'
                }`} />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Splat Haptic Sound effects</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Mute/unmute chime alert on milestone deployments.</p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
                  soundEnabled ? 'bg-purple-600' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 transition-all ${
                  soundEnabled ? 'right-0.75' : 'left-0.75'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Database / Core Diagnostics Environment parameter logs */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-zinc-950">
          <h3 className="text-xs font-bold font-mono text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <span>Cloud Deployment Spec Logs</span>
          </h3>

          <div className="font-mono text-[9px] text-zinc-400 space-y-2 leading-relaxed bg-[#121214] p-4 rounded-xl border border-zinc-900 select-all">
            <div className="flex items-center gap-2 text-zinc-500 mb-1.5 pb-1 border-b border-zinc-900">
              <Server className="w-3.5 h-3.5 text-purple-400" />
              <span>TERMINAL REPORT</span>
            </div>
            <div>[NODE_STATUS]    ONLINE (Port 3000)</div>
            <div>[COMPACT_DB]     ACTIVE / Persistent file-based store initialized</div>
            <div>[JWT_ALGORITHM]  HS256 HMAC encryption standard and auth verification</div>
            <div>[VITE_ENGINE]    Vite bundled assets loaded under environment proxy</div>
            <div>[GEMINI_CLIENT]  Connected to Server Mode GoogleGenAI Neural Link</div>
            <div>[AUTH_SECRET]    Verified HS256 crypto token sign keys generated</div>
          </div>
        </div>

      </div>
    </div>
  );
}
