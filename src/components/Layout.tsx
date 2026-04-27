import React from 'react';
import { auth } from '../lib/firebase';
import { LogOut, Home, PieChart, Upload, Settings, Wallet, Bot, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  healthScore: number;
}

export default function Layout({ children, activeTab, setActiveTab, healthScore }: LayoutProps) {
  const user = auth.currentUser;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'transactions', label: 'Transactions', icon: Wallet },
    { id: 'upi', label: 'Link UPI', icon: Smartphone },
    { id: 'insights', label: 'AI Insights', icon: PieChart },
    { id: 'chat', label: 'Ask AI', icon: Bot },
    { id: 'upload', label: 'Upload Statements', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10 text-left">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <Wallet className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">Synesis</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  activeTab === item.id
                    ? 'bg-slate-100 dark:bg-slate-800 text-accent'
                    : 'text-secondary dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <item.icon size={18} />
                <span className="text-left flex-1">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1 text-left">AI Engine v2.4</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-tight text-left">Advanced Predictions</p>
          </div>

          <div className="flex items-center gap-3 group px-2 text-left">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold border-2 border-white dark:border-slate-700 shadow-sm text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user?.displayName || 'Active User'}</p>
              <button 
                onClick={() => auth.signOut()}
                className="text-[10px] text-slate-400 dark:text-slate-500 font-medium hover:text-danger flex items-center gap-1 transition-colors"
              >
                Sign out <LogOut size={10} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#f8fafc] dark:bg-[#0f172a]">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
            {activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Health Score</p>
                <div className="flex items-center gap-2">
                   <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${healthScore > 70 ? 'bg-emerald-500' : healthScore > 40 ? 'bg-amber-500' : 'bg-danger'}`} 
                        style={{ width: `${healthScore}%` }}
                      ></div>
                   </div>
                   <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{healthScore}%</span>
                </div>
             </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
