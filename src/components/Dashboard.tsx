import React, { useState } from 'react';
import { Transaction, UserProfile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePie, Pie, Cell, Legend, Sector
} from 'recharts';
import { DollarSign, Smartphone, CheckCircle2, ListFilter, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  transactions: Transaction[];
  userProfile?: UserProfile | null;
  dateRange: '7d' | '30d' | '90d' | 'all';
  setDateRange: (range: '7d' | '30d' | '90d' | 'all') => void;
}

const COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#e11d48', 
  '#dc2626', '#ea580c', '#d97706', '#059669', 
  '#0891b2', '#2563eb', '#0f172a', '#475569'
];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg dark:fill-white">
        {payload.name}
      </text>
      <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill="#94a3b8" className="text-xs font-semibold">
        {`₹${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function Dashboard({ transactions, userProfile }: DashboardProps) {
  const [activeIndex, setActiveIndex] = useState(0);

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
      {/* Date Filter */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <TrendingUp size={16} className="text-accent" />
           </div>
           <p className="text-sm font-bold text-slate-800 dark:text-white">Time Range</p>
        </div>
        <div className="flex gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                dateRange === range 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString()}`, color: 'text-slate-900 dark:text-white', icon: <DollarSign size={14} className="text-slate-400" /> },
          { label: 'Income', value: `₹${totalIncome.toLocaleString()}`, color: 'text-emerald-600', badge: 'Monthly', badgeColor: 'bg-emerald-600 text-white' },
          { label: 'Expenses', value: `₹${totalExpense.toLocaleString()}`, color: 'text-slate-900 dark:text-white', badge: 'Critical', badgeColor: 'bg-danger text-white' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">{card.label}</span>
              {card.icon ? <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">{card.icon}</div> : 
               <span className={`${card.badgeColor} text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wide`}>{card.badge}</span>}
            </div>
            <p className={`text-3xl font-bold tracking-tight ${card.color}`}>{card.value}<span className="text-sm opacity-30">.00</span></p>
          </div>
        ))}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">UPI Account</span>
            <div className={`p-1.5 rounded-lg ${userProfile?.upiLinked ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-50 dark:bg-slate-800'} border border-slate-100 dark:border-slate-700`}>
              <Smartphone size={14} className={userProfile?.upiLinked ? 'text-emerald-600' : 'text-slate-400'} />
            </div>
          </div>
          {userProfile?.upiLinked ? (
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-white truncate mb-1">{userProfile.linkedVpa}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                <CheckCircle2 size={10} strokeWidth={3} /> Verified
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 font-bold">Link Account</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Cash Flow Analysis</h3>
             <TrendingUp size={18} className="text-accent" />
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: 700}} 
                  itemStyle={{fontSize: '12px'}}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-8">Category Segregation</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie 
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={categoryData} 
                  innerRadius={80} 
                  outerRadius={110} 
                  paddingAngle={5} 
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8 text-left">
           <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <ListFilter className="text-slate-800 dark:text-white" size={20} />
           </div>
           <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Sectioned Transactions</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 font-black text-slate-400 uppercase text-[9px] tracking-widest">Category Section</th>
                <th className="pb-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Volume</th>
                <th className="pb-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Total Amount</th>
                <th className="pb-4 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Budget %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {categoryData.map((cat, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <p className="font-bold text-slate-800 dark:text-white">{cat.name}</p>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{cat.count} txns</span>
                  </td>
                  <td className="py-4 text-right font-bold text-slate-900 dark:text-white">
                    ₹{cat.value.toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-[10px] font-black text-slate-400">{((cat.value / totalExpense) * 100).toFixed(1)}%</span>
                      <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-800 dark:bg-white" style={{ width: `${(cat.value / totalExpense) * 100}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
