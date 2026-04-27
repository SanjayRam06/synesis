import React, { useState } from 'react';
import { Smartphone, Check, Loader2, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UPILinkProps {
  onLink: (vpa: string) => Promise<void>;
  isLinking: boolean;
  linkedVpa?: string;
}

export default function UPILink({ onLink, isLinking, linkedVpa }: UPILinkProps) {
  const [vpa, setVpa] = useState(linkedVpa || '');
  const [step, setStep] = useState(linkedVpa ? 'success' : 'input');

  const handleLink = async () => {
    if (!vpa.includes('@')) return;
    setStep('connecting');
    try {
      await onLink(vpa);
      setStep('success');
    } catch (err) {
      setStep('input');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Connect UPI</h2>
        <p className="text-slate-500 mt-1">Directly link your UPI for real-time analysis and automatic categorization.</p>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <Zap size={24} className="text-accent" />
                <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                  Fast & Secure connection via Account Aggregator. No passwords required.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Your VPA / UPI ID</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="username@bank" 
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none transition-all font-medium"
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleLink}
                disabled={!vpa.includes('@')}
                className="w-full py-4 bg-accent text-white rounded-xl font-bold hover:shadow-xl hover:shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Connect to Bank <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 'connecting' && (
            <motion.div 
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center"
            >
              <div className="relative w-20 h-20 mb-6">
                <Loader2 className="w-full h-full text-accent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Smartphone size={24} className="text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Verifying Identity</h3>
              <p className="text-slate-500 mt-2">Connecting with your bank securely...</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-100/50">
                <Check size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">UPI Linked Successfully</h3>
              <p className="text-slate-500 mt-2 mb-8">Your account <span className="font-bold text-slate-800">{vpa}</span> is now connected to Synesis.</p>
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className="text-emerald-600 font-bold">Active Syncing</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Frequency</p>
                  <p className="text-slate-800 font-bold">Real-time</p>
                </div>
              </div>

              <button 
                onClick={() => setStep('input')}
                className="mt-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Disconnect Account
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-10 flex items-center justify-center gap-6 text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium">PCI DSS Compliant</span>
        </div>
        <div className="w-1 h-1 bg-slate-200 rounded-full" />
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          <span className="text-xs font-medium">256-bit AES Encryption</span>
        </div>
      </div>
    </div>
  );
}
