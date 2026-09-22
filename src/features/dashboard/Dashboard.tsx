// ============================================================
// Spendly — Dashboard Feature
// ============================================================
import { useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import {
  formatIDR, getGreeting, getCurrentMonth, formatMonthDisplay,
  getPercentage, getBudgetStatus, getTodayStr,
} from '../../utils/formatters';
import {
  TrendingDown, TrendingUp, ArrowUpDown, Zap, Plus,
  ArrowRight, CalendarDays,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function Dashboard() {
  const { transactions, categories, budgets, wallets, setActiveTab, setShowAddModal } = useStore();
  const currentMonth = getCurrentMonth();
  const todayStr = getTodayStr();

  // Monthly metrics — exclude transfers
  const monthlyExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0),
    [transactions, currentMonth]
  );

  const monthlyIncome = useMemo(() =>
    transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0),
    [transactions, currentMonth]
  );

  const todaySpend = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense' && t.date === todayStr)
      .reduce((s, t) => s + t.amount, 0),
    [transactions, todayStr]
  );

  const netCashFlow = monthlyIncome - monthlyExpenses;

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = new Map<number, number>();
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .forEach(t => {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Other',
          color: cat?.color || '#94A3B8',
          icon: cat?.icon || 'HelpCircle',
          amount,
          percentage: monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, categories, currentMonth, monthlyExpenses]);

  // Budget progress
  const budgetProgress = useMemo(() => {
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + t.amount, 0);
      const cat = categories.find(c => c.id === b.categoryId);
      const percentage = getPercentage(spent, b.allocatedAmount);
      const status = getBudgetStatus(percentage);
      return {
        ...b,
        spent,
        remaining: Math.max(0, b.allocatedAmount - spent),
        percentage,
        status,
        categoryName: cat?.name || 'Unknown',
        categoryColor: cat?.color || '#94A3B8',
        categoryIcon: cat?.icon || 'HelpCircle',
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions, categories, currentMonth]);

  // Insights
  const insights = useMemo(() => {
    const msgs: string[] = [];
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      msgs.push(`${top.name} represents ${top.percentage}% of your monthly spending`);
    }
    if (netCashFlow > 0) {
      msgs.push(`You've saved ${formatIDR(netCashFlow)} this month. Keep it up! 🎉`);
    } else if (netCashFlow < 0) {
      msgs.push(`You're overspending by ${formatIDR(Math.abs(netCashFlow))} this month`);
    }
    const overBudget = budgetProgress.filter(b => b.percentage >= 100);
    if (overBudget.length > 0) {
      msgs.push(`${overBudget.length} budget${overBudget.length > 1 ? 's' : ''} exceeded — review your spending`);
    }
    return msgs;
  }, [categoryBreakdown, netCashFlow, budgetProgress]);

  // Total wallet balance
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  // Recent transactions (last 5)
  const recentTransactions = transactions.slice(0, 5);

  const kpiCards = [
    { label: 'Monthly Expense', value: monthlyExpenses, icon: <TrendingDown className="w-5 h-5" />, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
    { label: 'Monthly Income', value: monthlyIncome, icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
    { label: 'Net Cash Flow', value: netCashFlow, icon: <ArrowUpDown className="w-5 h-5" />, color: netCashFlow >= 0 ? 'text-emerald-500' : 'text-rose-500', bgColor: netCashFlow >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10' },
    { label: "Today's Spend", value: todaySpend, icon: <Zap className="w-5 h-5" />, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + Month */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()} 👋</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
            <CalendarDays className="w-4 h-4" />
            {formatMonthDisplay(currentMonth)}
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="hidden md:flex items-center gap-2 btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Total Balance Banner */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
        <p className="text-emerald-100 text-sm font-medium">Total Balance</p>
        <p className="text-3xl font-bold mt-1">{formatIDR(totalBalance)}</p>
        <div className="flex gap-4 mt-4">
          {wallets.slice(0, 3).map(w => (
            <div key={w.id} className="flex items-center gap-2 text-emerald-100 text-sm">
              <DynamicIcon name={w.icon} className="w-4 h-4" />
              <span>{w.name}: {formatIDR(w.balance)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(kpi => (
          <div key={kpi.label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 font-medium">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.bgColor} ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <p className={`text-lg font-bold ${kpi.color}`}>
              {kpi.label === 'Net Cash Flow' && kpi.value >= 0 ? '+' : ''}{formatIDR(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card p-4 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" /> Quick Insights
          </h3>
          {insights.map((msg, i) => (
            <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400 pl-6">• {msg}</p>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Category Donut */}
        {categoryBreakdown.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Spending by Category</h3>
              <button onClick={() => setActiveTab('reports')} className="text-xs text-primary-500 font-medium flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      dataKey="amount"
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatIDR(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {categoryBreakdown.slice(0, 4).map(cat => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-semibold">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Budget Progress */}
        {budgetProgress.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Budget Progress</h3>
              <button onClick={() => setActiveTab('budget')} className="text-xs text-primary-500 font-medium flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {budgetProgress.slice(0, 4).map(b => (
                <div key={b.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={b.categoryIcon} className="w-3.5 h-3.5" style={{ color: b.categoryColor }} />
                      <span className="font-medium">{b.categoryName}</span>
                    </div>
                    <span className={b.status.textClass}>{b.percentage}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${b.status.bgClass}`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
                    <span>{formatIDR(b.spent)}</span>
                    <span>{formatIDR(b.allocatedAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      {recentTransactions.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="text-sm font-semibold">Recent Transactions</h3>
            <button onClick={() => setActiveTab('transactions')} className="text-xs text-primary-500 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTransactions.map(txn => {
              const cat = categories.find(c => c.id === txn.categoryId);
              return (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat?.color || '#6366F1'}15` }}
                  >
                    <DynamicIcon
                      name={txn.type === 'transfer' ? 'ArrowRightLeft' : cat?.icon || 'HelpCircle'}
                      className="w-4 h-4"
                      style={{ color: cat?.color || '#6366F1' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{txn.merchant || cat?.name || 'Transfer'}</p>
                    <p className="text-[11px] text-zinc-400">{cat?.name || 'Transfer'}</p>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ${
                    txn.type === 'expense' ? 'text-rose-500' :
                    txn.type === 'income' ? 'text-emerald-500' : 'text-indigo-500'
                  }`}>
                    {txn.type === 'expense' ? '-' : txn.type === 'income' ? '+' : ''}{formatIDR(txn.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
