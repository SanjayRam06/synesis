import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatProps {
  transactions: Transaction[];
}

export default function Chat({ transactions }: ChatProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your Synesis AI assistant. I have access to your transaction history. What would you like to know about your spending?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          context: `User transactions: ${JSON.stringify(transactions.slice(-20))}`
        })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
          <Sparkles size={20} />
        </div>
        <div className="text-left">
           <h3 className="font-bold text-slate-800 dark:text-white">Synesis AI</h3>
           <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
           </p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-accent text-white'}`}>
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed text-left ${
                  m.role === 'user' 
                    ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 rounded-tr-none border border-slate-100 dark:border-slate-700' 
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                  <Loader2 className="animate-spin text-accent" size={16} />
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about your budget, trends, or specific transactions..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-6 pr-14 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none transition-all text-sm shadow-sm dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center hover:bg-accent/90 disabled:opacity-50 transition-all shadow-lg shadow-accent/20"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
