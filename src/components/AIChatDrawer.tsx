import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquareCode, Send, Sparkles, User, Cpu, Trash2, 
  HelpCircle, ChevronRight, PlayCircle, Terminal, HelpCircle as HelpIcon
} from 'lucide-react';

interface AIChatDrawerProps {
  token: string;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AIChatDrawer({ token }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: "Developer session established. I am your Gemini-powered Taskflow Coach. Formulate questions about organizing backlog items, structuring dynamic sprint goals, or sustaining consecutive daily streaks.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Append user message
    const userMsg: Message = { sender: 'user', text: textToSend, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      const data = await res.json();
      const assistantMsg: Message = { 
        sender: 'assistant', 
        text: data.reply || 'Apologies. Unable to compile neural response at this moment.',
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat routing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What are some simple tactics to build consecutive focus habits?",
    "Review balance guidelines for Work vs Personal arenas.",
    "Draft a milestone outline for completing a high-priority web launch.",
  ];

  return (
    <div id="chat-root" className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
      {/* Top Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-[#050505]/50 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold text-white font-display flex items-center gap-2">
            AI Productivity Assistant
          </h1>
          <p className="text-xs text-zinc-400">Co-pilot discussion channel for strategic execution planning</p>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          title="Clear Terminal Log"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
          <span>Reset Output</span>
        </button>
      </header>

      {/* Primary chat scroll container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Quick Help Hints Card if chat is new */}
        {messages.length === 1 && (
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 max-w-xl mx-auto space-y-3">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Recommended Quick Queries</span>
            <div className="grid grid-cols-1 gap-2.5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="p-3 bg-white/[0.01] border border-white/5 hover:border-indigo-500/30 text-zinc-350 hover:text-white rounded-2xl text-left text-xs transition-all flex justify-between items-center group cursor-pointer"
                >
                  <span>{prompt}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-indigo-400 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Bubble Render */}
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Icon */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                {/* Bubble card content */}
                <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed font-sans border shadow-md relative group ${
                  isUser 
                    ? 'bg-indigo-600 border-indigo-500/10 text-white rounded-tr-none' 
                    : 'glass-panel text-zinc-350 rounded-tl-none border-white/5'
                }`}>
                  {/* Message body */}
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  
                  {/* Time notation */}
                  <span className={`text-[8.5px] font-mono block mt-2 text-right ${isUser ? 'text-indigo-300/80' : 'text-zinc-500'}`}>
                    {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                </div>

                {/* User Icon */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Prompt responding spinner */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3.5 justify-start"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
              </div>
              
              <div className="glass-panel p-4 rounded-2xl rounded-tl-none border-white/5 flex items-center gap-3">
                <div className="flex gap-1" id="typing-indicators">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                </div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider animate-pulse font-bold">Formulating cognitive response...</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Form area */}
      <footer className="p-6 border-t border-white/5 bg-[#050505]/60 backdrop-blur-md">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend(input);
          }}
          className="max-w-3xl mx-auto flex gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Query productivity co-pilot..."
              className="w-full pl-4 pr-24 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-white/30 focus:outline-[#6366f1]/40"
            />
            
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-zinc-500">
              <span className="text-[8.5px] font-mono bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-widest text-zinc-400">GEMINI CLOUD</span>
            </div>
          </div>

          <button
            type="submit"
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-600/20 select-none shrink-0 transition-all flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </footer>
    </div>
  );
}
