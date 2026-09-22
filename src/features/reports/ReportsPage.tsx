// ============================================================
// Spendly — Reports & Analytics
// ============================================================
import { useMemo, useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { formatIDR, getCurrentMonth, formatMonthDisplay } from '../../utils/formatters';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ReportsPage() {
  const { transactions, categories } = useStore();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewMonth = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [monthOffset]);

  const monthlyExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(viewMonth))
      .reduce((s, t) => s + t.amount, 0),
    [transactions, viewMonth]
  );

  const monthlyIncome = useMemo(() =>
    transactions
      .filter(t => t.type === 'income' && t.date.startsWith(viewMonth))
      .reduce((s, t) => s + t.amount, 0),
    [transactions, viewMonth]
  );

  // Category donut data
  const categoryData = useMemo(() => {
    const map = new Map<number, number>();
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(viewMonth))
      .forEach(t => map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount));

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat?.name || 'Other',
          value: amount,
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'HelpCircle',
          percentage: monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, viewMonth, monthlyExpenses]);

  // Daily spending trend
  const dailyTrend = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(viewMonth))
      .forEach(t => map.set(t.date, (map.get(t.date) || 0) + t.amount));

    const daysInMonth = new Date(parseInt(viewMonth.split('-')[0]), parseInt(viewMonth.split('-')[1]), 0).getDate();
    const data = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewMonth}-${String(d).padStart(2, '0')}`;
      data.push({
        day: String(d),
        amount: map.get(dateStr) || 0,
      });
    }
    return data;
  }, [transactions, viewMonth]);

  // Top merchants
  const topMerchants = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(viewMonth) && t.merchant)
      .forEach(t => map.set(t.merchant, (map.get(t.merchant) || 0) + t.amount));

    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, viewMonth]);

  return (
    <div className="space-y-6">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reports</h2>
        <div className="flex items-center gap-3">
          <button onClick={() => setMonthOffset(p => p - 1)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">{formatMonthDisplay(viewMonth)}</span>
          <button
            onClick={() => setMonthOffset(p => p + 1)}
            disabled={monthOffset >= 0}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <p className="text-xs text-zinc-500 font-medium">Expenses</p>
          <p className="text-xl font-bold text-rose-500 mt-1">{formatIDR(monthlyExpenses)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-zinc-500 font-medium">Income</p>
          <p className="text-xl font-bold text-emerald-500 mt-1">{formatIDR(monthlyIncome)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Category breakdown donut */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
          {categoryData.length > 0 ? (
            <>
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatIDR(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {categoryData.map(cat => (
                  <div key={cat.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <DynamicIcon name={cat.icon} className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                    <span className="text-sm flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-zinc-400">{cat.percentage}%</span>
                    <span className="text-sm font-semibold">{formatIDR(cat.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-zinc-400 py-8">No expense data for this month</p>
          )}
        </div>

        {/* Daily spending trend */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Daily Spending</h3>
          {dailyTrend.some(d => d.amount > 0) ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => formatIDR(value)}
                    labelFormatter={l => `Day ${l}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-zinc-400 py-8">No expense data for this month</p>
          )}
        </div>
      </div>

      {/* Top merchants */}
      {topMerchants.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Top Merchants</h3>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                  {i + 1}
                </span>
                <span className="text-sm flex-1">{m.name}</span>
                <span className="text-sm font-semibold">{formatIDR(m.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
