import React from 'react';
import { Transaction, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Smartphone, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface DashboardProps {
  transactions: Transaction[];
  userProfile?: UserProfile | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];

export default function Dashboard({ transactions, userProfile }: DashboardProps) {
  console.log("Dashboard transactions:", transactions);
  const totalBalance = transactions.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);

  // Group by category
  const categoryData = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, []);

  // Group by date
  const timelineData = transactions.reduce((acc: any[], t) => {
    try {
      const dateObj = new Date(t.date);
      if (isNaN(dateObj.getTime())) return acc;
      
      const dateKey = format(dateObj, 'MMM dd');
      const existing = acc.find(item => item.date === dateKey);
      if (existing) {
        if (t.type === 'debit') existing.expense += t.amount;
        else existing.income += t.amount;
      } else {
        acc.push({ 
          date: dateKey, 
          fullDate: dateObj, // Keep original for sorting
          expense: t.type === 'debit' ? t.amount : 0, 
          income: t.type === 'credit' ? t.amount : 0 
        });
      }
    } catch (e) {
      console.error("Error formatting date for dashboard:", t.date, e);
    }
    return acc;
  }, []).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Total Balance</span>
            <div className="p-1.5 bg-slate-50 rounded-lg"><DollarSign size={14} className="text-slate-400" /></div>
          </div>
          <p className="text-3xl font-light text-slate-900">₹{totalBalance.toLocaleString()}<span className="text-sm text-slate-400">.00</span></p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Income</span>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Monthly</span>
          </div>
          <p className="text-3xl font-light text-emerald-600">₹{totalIncome.toLocaleString()}<span className="text-sm opacity-50">.00</span></p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Expenses</span>
            <span className="bg-danger/5 text-danger text-[10px] px-2 py-0.5 rounded-full font-bold">Critical</span>
          </div>
          <p className="text-3xl font-light text-slate-900">₹{totalExpense.toLocaleString()}<span className="text-sm text-slate-400">.00</span></p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">UPI Account</span>
            <div className={`p-1.5 rounded-lg ${userProfile?.upiLinked ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <Smartphone size={14} className={userProfile?.upiLinked ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
          </div>
          {userProfile?.upiLinked ? (
            <div className="relative z-10">
              <p className="text-lg font-bold text-slate-800 truncate mb-1">{userProfile.linkedVpa}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                <CheckCircle2 size={10} /> Connected
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-lg font-bold text-slate-300 italic mb-2">Not Linked</p>
              <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">Link Now</button>
            </div>
          )}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-110 transition-transform" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Spending Trends */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Financial Timeline</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Income
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <div className="w-2 h-2 rounded-full bg-danger"></div> Expense
              </span>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontSize: '12px' }}
                />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-4 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-6">Budget Allocation</h3>
            <div className="space-y-5">
              {categoryData.slice(0, 5).map((entry, index) => {
                const percentage = Math.round((entry.value / totalExpense) * 100);
                return (
                  <div key={entry.name}>
                    <div className="flex justify-between text-[10px] mb-2 text-slate-400 font-bold uppercase tracking-wider">
                      <span>{entry.name}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all border border-white/5">
              Refine Budgets
            </button>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, amount, icon: Icon, color, isCount }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-secondary">{title}</p>
        <h4 className="text-2xl font-bold mt-1 tracking-tight">
          {isCount ? amount : `₹${amount.toLocaleString()}`}
        </h4>
      </div>
    </div>
  );
}
