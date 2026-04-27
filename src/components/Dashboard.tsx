import React from 'react';
import { Transaction, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Smartphone, CheckCircle2, ListFilter } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  userProfile?: UserProfile | null;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#1e293b', '#64748b'
];

export default function Dashboard({ transactions, userProfile }: DashboardProps) {
  const totalBalance = transactions.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'debit').reduce((acc, t) => acc + t.amount, 0);

  // Category data for Pie Chart
  const categoryData = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc: any[], t) => {
      const catName = t.category || 'Others';
      const existing = acc.find(item => item.name === catName);
      if (existing) {
        existing.value += t.amount;
        existing.count += 1;
      } else {
        acc.push({ name: catName, value: t.amount, count: 1 });
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
      {/* Top Stats */}
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

      {/* Charts Section */}
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

      {/* DETAILED CATEGORY TABLE */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
           <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <ListFilter className="text-accent" size={20} />
           </div>
           <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-widest">Category Segregation</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Category Section</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Transactions</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Total Spent</th>
                <th className="pb-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">% of Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {categoryData.map((cat, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-8 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Detailed breakdown</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold">
                      {cat.count} items
                    </span>
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900 dark:text-white">
                    ₹{cat.value.toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-accent">{((cat.value / totalExpense) * 100).toFixed(1)}%</span>
                      <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${(cat.value / totalExpense) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {categoryData.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm italic">
              No data available for segregation. Upload a statement to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
