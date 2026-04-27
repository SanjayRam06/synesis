import React from 'react';
import { Transaction, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Smartphone, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  userProfile?: UserProfile | null;
}

// More vibrant and wide range of colors
const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#1e293b', '#64748b'
];

export default function Dashboard({ transactions, userProfile }: DashboardProps) {
  const totalBalance = transactions.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);

  const categoryData = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc: any[], t) => {
      const catName = t.category || 'Others';
      const existing = acc.find(item => item.name === catName);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: catName, value: t.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value);

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
          fullDate: dateObj, 
          expense: t.type === 'debit' ? t.amount : 0, 
          income: t.type === 'credit' ? t.amount : 0 
        });
      }
    } catch (e) { console.error(e); }
    return acc;
  }, []).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

  return (
    <div className="space-y-8 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString()}`, color: 'text-slate-900 dark:text-white', icon: <DollarSign size={14} className="text-slate-400" /> },
          { label: 'Income', value: `₹${totalIncome.toLocaleString()}`, color: 'text-emerald-600', badge: 'Monthly', badgeColor: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
          { label: 'Expenses', value: `₹${totalExpense.toLocaleString()}`, color: 'text-slate-900 dark:text-white', badge: 'Critical', badgeColor: 'bg-danger/5 text-danger' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 dark:text-slate-500 font-medium text-xs uppercase tracking-wider">{card.label}</span>
              {card.icon ? <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">{card.icon}</div> : 
               <span className={`${card.badgeColor} text-[10px] px-2 py-0.5 rounded-full font-bold`}>{card.badge}</span>}
            </div>
            <p className={`text-3xl font-light ${card.color}`}>{card.value}<span className="text-sm opacity-40">.00</span></p>
          </div>
        ))}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-slate-400 dark:text-slate-500 font-medium text-xs uppercase tracking-wider">UPI Account</span>
            <div className={`p-1.5 rounded-lg ${userProfile?.upiLinked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <Smartphone size={14} className={userProfile?.upiLinked ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
          </div>
          {userProfile?.upiLinked ? (
            <div className="relative z-10">
              <p className="text-lg font-bold text-slate-800 dark:text-white truncate mb-1">{userProfile.linkedVpa}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                <CheckCircle2 size={10} /> Active
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-sm text-slate-400 font-medium leading-tight">No UPI account linked.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-8 text-left">Cash Flow</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#1e293b', color: 'white'}} 
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-8 text-left">Category Split</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie 
                  data={categoryData} 
                  innerRadius={70} 
                  outerRadius={100} 
                  paddingAngle={8} 
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{borderRadius: '16px', border: 'none', background: '#1e293b', color: 'white', fontSize: '12px'}} 
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
