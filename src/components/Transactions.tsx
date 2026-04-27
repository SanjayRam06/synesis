import React, { useState } from 'react';
import { Transaction } from '../types';
import { Search, ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionsProps {
  transactions: Transaction[];
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export default function Transactions({ transactions, onUpload, isUploading }: TransactionsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'debit' | 'credit'>('all');

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search merchants or categories..." 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] py-3 pl-10 pr-4 focus:ring-2 focus:ring-accent/10 focus:border-accent outline-none transition-all text-sm shadow-sm text-slate-800 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.25rem] shadow-sm">
          {(['all', 'debit', 'credit'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filterType === type 
                  ? 'bg-slate-900 dark:bg-accent text-white shadow-md' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-8 py-5 font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Merchant</th>
              <th className="px-8 py-5 font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Category</th>
              <th className="px-8 py-5 font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest">Date</th>
              <th className="px-8 py-5 font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px] tracking-widest text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((t, idx) => (
                <motion.tr 
                  key={t.id || idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        t.type === 'credit' 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700'
                      }`}>
                        {t.type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{t.merchant}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{t.type === 'credit' ? 'Inward Transfer' : 'Direct Payment'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-slate-500 dark:text-slate-400 font-medium">
                    {format(new Date(t.date), 'MMM dd, yyyy')}
                  </td>
                  <td className={`px-8 py-4 text-right font-bold tabular-nums ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
              <FileText className="text-slate-200 dark:text-slate-700" size={32} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 font-medium">No results match your current search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
