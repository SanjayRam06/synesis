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
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#ef4444', '#f97316', '#f59e0b', '#10b981', 
  '#06b6d4', '#3b82f6', '#1e293b', '#64748b'
];

// Custom Active Shape for the Donut Chart
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  return (
    <g>
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg dark:fill-white">
        {payload.name}
      </text>
      <text x={cx} y={cy + 20} dy={8} textAnchor="middle" fill="#94a3b8" className="text-xs font-medium">
        {`₹${value.toLocaleString()} (${(percent * 100).toFixed(1)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
      />
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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-8 text-left">
      {/* Top Stats - Glassy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Balance', value: `₹${totalBalance.toLocaleString()}`, color: 'text-slate-900 dark:text-white', icon: <DollarSign size={14} className="text-slate-400" /> },
          { label: 'Income', value: `₹${totalIncome.toLocaleString()}`, color: 'text-emerald-500', badge: 'Monthly', badgeColor: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
          { label: 'Expenses', value: `₹${totalExpense.toLocaleString()}`, color: 'text-slate-900 dark:text-white', badge: 'Critical', badgeColor: 'bg-danger/10 text-danger border border-danger/20' },
        ].map((card, i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">{card.label}</span>
              {card.icon ? <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg">{card.icon}</div> : 
               <span className={`${card.badgeColor} text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter`}>{card.badge}</span>}
            </div>
            <p className={`text-3xl font-black tracking-tight ${card.color}`}>{card.value}<span className="text-sm opacity-30 font-medium">.00</span></p>
          </div>
        ))}

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">UPI Account</span>
            <div className={`p-1.5 rounded-lg ${userProfile?.upiLinked ? 'bg-emerald-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <Smartphone size={14} className={userProfile?.upiLinked ? 'text-emerald-500' : 'text-slate-400'} />
            </div>
          </div>
          {userProfile?.upiLinked ? (
            <div className="relative z-10">
              <p className="text-lg font-black text-slate-800 dark:text-white truncate mb-1">{userProfile.linkedVpa}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase tracking-widest">
                <CheckCircle2 size={10} strokeWidth={3} /> Active
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <p className="text-sm text-slate-400 font-bold leading-tight">Link your UPI Account</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cash Flow Chart */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
             <div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cash Flow</h3>
               <p className="text-xl font-black text-slate-800 dark:text-white">Monthly Analytics</p>
             </div>
             <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                <TrendingUp size={20} />
             </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={15} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', background: 'rgba(30, 41, 59, 0.9)', backdropFilter: 'blur(10px)', color: 'white', padding: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                  cursor={{fill: 'rgba(0,0,0,0.02)'}}
                />
                <Bar dataKey="income" fill="#10b981" radius={[10, 10, 10, 10]} barSize={6} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[10, 10, 10, 10]} barSize={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KILLER DONUT CHART */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl overflow-hidden relative">
          <div className="mb-8">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Category Split</h3>
             <p className="text-xl font-black text-slate-800 dark:text-white">Smart Segregation</p>
          </div>
          
          <div className="h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie 
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={categoryData} 
                  innerRadius={85} 
                  outerRadius={115} 
                  paddingAngle={10} 
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={onPieEnter}
                >
                  {categoryData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      className="hover:opacity-80 transition-opacity cursor-pointer shadow-lg"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                  contentStyle={{display: 'none'}} 
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '30px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
           <div className="p-3 bg-indigo-500/10 rounded-2xl">
              <ListFilter className="text-indigo-500" size={24} />
           </div>
           <div className="text-left">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Detailed Breakdown</h3>
              <p className="text-xl font-black text-slate-800 dark:text-white">Category Segregation</p>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-6 font-black text-slate-400 uppercase text-[9px] tracking-widest">Category</th>
                <th className="pb-6 font-black text-slate-400 uppercase text-[9px] tracking-widest text-center">Volume</th>
                <th className="pb-6 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Amount</th>
                <th className="pb-6 font-black text-slate-400 uppercase text-[9px] tracking-widest text-right">Weightage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {categoryData.map((cat, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                  <td className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length], boxShadow: `0 0 15px ${COLORS[idx % COLORS.length]}50` }} />
                      <div>
                        <p className="font-black text-slate-800 dark:text-white tracking-tight">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Verified Section</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 text-center">
                    <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-[10px] font-black uppercase">
                      {cat.count} txns
                    </span>
                  </td>
                  <td className="py-6 text-right font-black text-slate-900 dark:text-white tabular-nums text-lg">
                    ₹{cat.value.toLocaleString()}
                  </td>
                  <td className="py-6 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] font-black text-indigo-500 uppercase">{((cat.value / totalExpense) * 100).toFixed(1)}%</span>
                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                          style={{ width: `${(cat.value / totalExpense) * 100}%` }}
                        />
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
