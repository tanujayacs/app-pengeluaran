// ============================================================
// Spendly — Budget Management
// ============================================================
import { useState, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { DynamicIcon } from '../../components/DynamicIcon';
import { Modal } from '../../components/Modal';
import { formatIDR, getCurrentMonth, formatMonthDisplay, getPercentage, getBudgetStatus, formatAmountInput, parseFormattedAmount } from '../../utils/formatters';
import { Plus, Edit } from 'lucide-react';

export function BudgetPage() {
  const { budgets, transactions, categories, saveBudget } = useStore();
  const currentMonth = getCurrentMonth();
  const [showModal, setShowModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number>(0);
  const [allocatedStr, setAllocatedStr] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const budgetData = useMemo(() => {
    return expenseCategories.map(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id);
      const spent = transactions
        .filter(t => t.type === 'expense' && t.categoryId === cat.id && t.date.startsWith(currentMonth))
        .reduce((s, t) => s + t.amount, 0);
      const allocated = budget?.allocatedAmount || 0;
      const percentage = getPercentage(spent, allocated);
      const status = getBudgetStatus(percentage);

      return {
        categoryId: cat.id!,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        allocated,
        spent,
        remaining: Math.max(0, allocated - spent),
        percentage,
        status,
        hasBudget: !!budget,
      };
    }).sort((a, b) => {
      if (a.hasBudget && !b.hasBudget) return -1;
      if (!a.hasBudget && b.hasBudget) return 1;
      return b.percentage - a.percentage;
    });
  }, [expenseCategories, budgets, transactions, currentMonth]);

  const totalAllocated = budgetData.reduce((s, b) => s + b.allocated, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const totalPercentage = getPercentage(totalSpent, totalAllocated);

  const openEditBudget = (catId: number) => {
    const existing = budgets.find(b => b.categoryId === catId);
    setEditCategoryId(catId);
    setAllocatedStr(existing ? formatAmountInput(String(existing.allocatedAmount)) : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    const amount = parseFormattedAmount(allocatedStr);
    if (amount <= 0 || editCategoryId === 0) return;
    await saveBudget({ month: currentMonth, categoryId: editCategoryId, allocatedAmount: amount });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Budget</h2>
          <p className="text-sm text-zinc-500">{formatMonthDisplay(currentMonth)}</p>
        </div>
      </div>

      {/* Overall budget summary */}
      {totalAllocated > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Overall Budget</span>
            <span className={`text-sm font-bold ${getBudgetStatus(totalPercentage).textClass}`}>
              {totalPercentage}%
            </span>
          </div>
          <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getBudgetStatus(totalPercentage).bgClass}`}
              style={{ width: `${Math.min(100, totalPercentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-400 mt-2">
            <span>Spent: {formatIDR(totalSpent)}</span>
            <span>Budget: {formatIDR(totalAllocated)}</span>
          </div>
        </div>
      )}

      {/* Category budgets */}
      <div className="space-y-3">
        {budgetData.map(b => (
          <div key={b.categoryId} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${b.categoryColor}15` }}>
                  <DynamicIcon name={b.categoryIcon} className="w-4 h-4" style={{ color: b.categoryColor }} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.categoryName}</p>
                  {b.hasBudget ? (
                    <p className="text-xs text-zinc-400">{formatIDR(b.spent)} of {formatIDR(b.allocated)}</p>
                  ) : (
                    <p className="text-xs text-zinc-400">No budget set · Spent {formatIDR(b.spent)}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEditBudget(b.categoryId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {b.hasBudget ? <Edit className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {b.hasBudget ? 'Edit' : 'Set'}
              </button>
            </div>
            {b.hasBudget && (
              <>
                <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${b.status.bgClass}`}
                    style={{ width: `${Math.min(100, b.percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-xs font-medium ${b.status.textClass}`}>{b.status.label} · {b.percentage}%</span>
                  <span className="text-xs text-zinc-400">Remaining: {formatIDR(b.remaining)}</span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Set budget modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Set Budget" size="sm">
        <div className="space-y-4">
          <div className="text-center py-2">
            <DynamicIcon
              name={categories.find(c => c.id === editCategoryId)?.icon || 'HelpCircle'}
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: categories.find(c => c.id === editCategoryId)?.color }}
            />
            <p className="font-semibold">{categories.find(c => c.id === editCategoryId)?.name}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-2 block">Monthly Budget</label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-400">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={allocatedStr}
                onChange={e => setAllocatedStr(formatAmountInput(e.target.value))}
                placeholder="0"
                className="input-field text-xl font-bold"
                autoFocus
              />
            </div>
          </div>
          <button onClick={handleSave} className="w-full btn-primary py-3 font-semibold">Save Budget</button>
        </div>
      </Modal>
    </div>
  );
}
