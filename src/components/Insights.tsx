import React from 'react';
import { Lightbulb, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface InsightsProps {
  insights: string[];
  prediction: string;
  healthScore: number;
}

export default function Insights({ insights, prediction, healthScore }: InsightsProps) {
  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <Lightbulb className="text-amber-500" size={20} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Smart Insights</h3>
          </div>
          
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700"
              >
                <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{insight}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-accent p-8 rounded-[2.5rem] shadow-xl shadow-accent/20 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="text-white" size={20} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest opacity-80">AI Prediction</h3>
            </div>
            <p className="text-lg text-white font-medium leading-relaxed italic">"{prediction}"</p>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mb-2">Confidence Level</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white w-[92%]"></div>
              </div>
              <span className="text-xs font-bold text-white">92%</span>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-emerald-500 p-10 rounded-[3rem] shadow-xl shadow-emerald-500/20 relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
           <ShieldCheck size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="text-center md:text-left flex-1">
            <h3 className="text-white font-bold text-4xl mb-4">Your Financial Health</h3>
            <p className="text-emerald-100 text-lg max-w-xl">
              Based on your recent transactions, your spending profile is looking robust. Keep it up to reach your savings goals!
            </p>
          </div>
          <div className="relative">
            <svg className="w-48 h-48">
              <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.1)" strokeWidth="16" fill="transparent" />
              <circle cx="96" cy="96" r="88" stroke="white" strokeWidth="16" fill="transparent" 
                strokeDasharray="552" strokeDashoffset={552 - (552 * healthScore) / 100}
                strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-light text-white">{healthScore}</span>
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Score</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
