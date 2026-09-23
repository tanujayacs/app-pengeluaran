// ============================================================
// Spendly v2 — Rekap Page (Realtime Chart, Bulanan, Custom Cards)
// ============================================================
import { useState, useMemo } from 'react';
import { useStore } from '../../hooks/useStore';
import { formatIDR, formatMonthIndo, getWeekRange, getTodayStr, formatDateIndo } from '../../utils/formatters';
import { Settings as SettingsIcon, ChevronLeft, ChevronRight, ArrowRight, Plus, Trash2, Calendar } from 'lucide-react';
import { Modal, ConfirmDialog } from '../../components/Modal';
import type { Transaction, CustomRekapCard } from '../../types';

type SubTab = 'realtime' | 'bulanan' | 'custom';
type RealtimePeriod = 'today' | 'week';

const categoryColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#84CC16',
];

export function RekapPage() {
  const {
    transactions,
    categories,
    settings,
    updateSettings,
    customRekapCards,
    addRekapCard,
    deleteRekapCard,
  } = useStore();

  const [subTab, setSubTab] = useState<SubTab>('realtime');
  const [realtimePeriod, setRealtimePeriod] = useState<RealtimePeriod>('today');
  const [showSettings, setShowSettings] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);

  // Custom Rekap Card form state
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardStart, setNewCardStart] = useState(getTodayStr());
  const [newCardEnd, setNewCardEnd] = useState(getTodayStr());
  const [deleteTargetCard, setDeleteTargetCard] = useState<CustomRekapCard | null>(null);

  // Settings form state
  const [startDate, setStartDate] = useState(settings.monthStartDate);
  const [accum, setAccum] = useState(settings.showAccumulatedBalance);

  const saveRekapSettings = () => {
    updateSettings({ monthStartDate: startDate, showAccumulatedBalance: accum });
    setShowSettings(false);
  };

  // Current month key
  const getMonthKey = (offset: number) => {
    const now = new Date();
    now.setMonth(now.getMonth() + offset);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentMonthKey = getMonthKey(monthOffset);

  // Filter helpers
  const filterByRange = (start: string, end: string) =>
    transactions.filter(t => t.date >= start && t.date <= end);

  const filterByMonth = (monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number);
    const sd = settings.monthStartDate;
    let sDate: Date, eDate: Date;
    if (sd === 1) {
      sDate = new Date(y, m - 1, 1);
      eDate = new Date(y, m, 0);
    } else {
      sDate = new Date(y, m - 2, sd);
      eDate = new Date(y, m - 1, sd - 1);
    }
    const s = sDate.toISOString().split('T')[0];
    const e = eDate.toISOString().split('T')[0];
    return transactions.filter(t => t.date >= s && t.date <= e);
  };

  const computeSummary = (txns: Transaction[]) => {
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, selisih: income - expense };
  };

  const getCategoryBreakdown = (txns: Transaction[]) => {
    const map = new Map<number, number>();
    txns.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([catId, amount], idx) => ({
        category: categories.find(c => c.id === catId),
        amount,
        color: categoryColors[idx % categoryColors.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  // Previous month carry-over
  const prevMonthTxns = useMemo(
    () => filterByMonth(getMonthKey(monthOffset - 1)),
    [transactions, monthOffset, settings.monthStartDate]
  );
  const prevSummary = computeSummary(prevMonthTxns);
  const carryOver = prevSummary.selisih;

  // Realtime data
  const today = getTodayStr();
  const weekRange = getWeekRange(today);
  const realtimeTxns = useMemo(() => {
    if (realtimePeriod === 'today') {
      return filterByRange(today, today);
    }
    return filterByRange(weekRange.start, weekRange.end);
  }, [realtimePeriod, today, weekRange.start, weekRange.end, transactions]);

  const realtimeSummary = useMemo(() => computeSummary(realtimeTxns), [realtimeTxns]);
  const realtimeBreakdown = useMemo(() => getCategoryBreakdown(realtimeTxns), [realtimeTxns, categories]);

  // Bulanan data
  const monthTxns = useMemo(
    () => filterByMonth(currentMonthKey),
    [transactions, currentMonthKey, settings.monthStartDate]
  );
  const monthSummary = useMemo(() => computeSummary(monthTxns), [monthTxns]);
  const monthBreakdown = useMemo(() => getCategoryBreakdown(monthTxns), [monthTxns, categories]);

  // Handle Add Custom Card
  const handleSaveCard = async () => {
    const name = newCardName.trim();
    if (!name) return;
    await addRekapCard({
      name,
      startDate: newCardStart,
      endDate: newCardEnd,
    });
    setShowAddCardModal(false);
    setNewCardName('');
  };

  // SVG Donut Chart Component
  const DonutChart = ({ data, total }: { data: { category?: { name: string }; amount: number; color: string }[]; total: number }) => {
    if (total === 0 || data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-zinc-200 flex items-center justify-center mb-2">
            <span className="text-[10px] text-zinc-400">Rp 0</span>
          </div>
          <p className="text-xs">Belum ada pengeluaran</p>
        </div>
      );
    }

    const size = 150;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    let accumulated = 0;

    return (
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {data.map((item, idx) => {
              const percent = item.amount / total;
              const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
              const strokeDashoffset = -circumference * accumulated;
              accumulated += percent;
              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span className="text-[10px] text-zinc-400 font-medium">Pengeluaran</span>
            <span className="text-xs font-bold text-rose-500 truncate max-w-[100px]">Rp {formatIDR(total)}</span>
          </div>
        </div>
      </div>
    );
  };

  const SummaryBlock = ({ label, summary }: { label: string; summary: { income: number; expense: number; selisih: number } }) => (
    <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm">
      <p className="text-xs font-semibold text-zinc-500 mb-3">{label}</p>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-xs text-zinc-400">Pemasukan</span>
          <span className="text-sm font-bold text-emerald-500">+ Rp {formatIDR(summary.income)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-zinc-400">Pengeluaran</span>
          <span className="text-sm font-bold text-rose-500">- Rp {formatIDR(summary.expense)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-zinc-100">
          <span className="text-xs font-medium text-zinc-600">Selisih</span>
          <span className={`text-sm font-bold ${summary.selisih >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {summary.selisih >= 0 ? '+' : '-'} Rp {formatIDR(Math.abs(summary.selisih))}
          </span>
        </div>
      </div>
    </div>
  );

  const BreakdownList = ({ data }: { data: ReturnType<typeof getCategoryBreakdown> }) => {
    const total = data.reduce((s, d) => s + d.amount, 0);
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500 mb-3">Pengeluaran per Kategori</p>
        {data.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">Belum ada pengeluaran</p>
        ) : (
          <div className="space-y-3">
            {data.map(({ category, amount, color }, i) => {
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium text-zinc-700">{category?.name || 'Lainnya'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-800">Rp {formatIDR(amount)}</span>
                      <span className="text-[10px] text-zinc-400 w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="header-bar">
        <span className="text-sm font-semibold">Rekap Pengeluaran</span>
        <button onClick={() => setShowSettings(true)} className="p-2 -mr-2 active:opacity-70">
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex bg-white border-b border-zinc-100">
        {(['realtime', 'bulanan', 'custom'] as SubTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
              subTab === tab ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-zinc-400'
            }`}
          >
            {tab === 'realtime' ? 'Realtime' : tab === 'bulanan' ? 'Bulanan' : 'Custom Rekap'}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3 pb-safe">
        {/* ================= REALTIME SUB-TAB ================= */}
        {subTab === 'realtime' && (
          <>
            {/* Period Switcher */}
            <div className="flex bg-zinc-200/70 p-1 rounded-xl">
              <button
                onClick={() => setRealtimePeriod('today')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  realtimePeriod === 'today' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setRealtimePeriod('week')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  realtimePeriod === 'week' ? 'bg-white text-zinc-800 shadow-sm' : 'text-zinc-500'
                }`}
              >
                Minggu Ini
              </button>
            </div>

            {/* Summary */}
            <SummaryBlock
              label={realtimePeriod === 'today' ? formatDateIndo(today) : `${formatDateIndo(weekRange.start)} - ${formatDateIndo(weekRange.end)}`}
              summary={realtimeSummary}
            />

            {/* Donut Chart Card */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm text-center">
              <p className="text-xs font-semibold text-zinc-500 mb-1">Visualisasi Kategori</p>
              <DonutChart data={realtimeBreakdown} total={realtimeSummary.expense} />
            </div>

            {/* Category Breakdown */}
            <BreakdownList data={realtimeBreakdown} />
          </>
        )}

        {/* ================= BULANAN SUB-TAB ================= */}
        {subTab === 'bulanan' && (
          <>
            {/* Month navigator */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-zinc-100 shadow-sm">
              <button onClick={() => setMonthOffset(o => o - 1)} className="p-1.5 rounded-lg active:bg-zinc-100">
                <ChevronLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <span className="text-sm font-bold text-zinc-800">{formatMonthIndo(currentMonthKey)}</span>
              <button onClick={() => setMonthOffset(o => o + 1)} className="p-1.5 rounded-lg active:bg-zinc-100">
                <ChevronRight className="w-5 h-5 text-zinc-600" />
              </button>
            </div>

            {/* Carry-over from previous month */}
            {settings.showAccumulatedBalance && monthOffset <= 0 && carryOver !== 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800">Sisa Saldo Bulan Lalu</p>
                  <p className={`text-sm font-bold ${carryOver >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {carryOver >= 0 ? '+' : '-'} Rp {formatIDR(Math.abs(carryOver))}
                  </p>
                </div>
              </div>
            )}

            <SummaryBlock label={formatMonthIndo(currentMonthKey)} summary={monthSummary} />

            <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm text-center">
              <p className="text-xs font-semibold text-zinc-500 mb-1">Visualisasi Kategori Bulanan</p>
              <DonutChart data={monthBreakdown} total={monthSummary.expense} />
            </div>

            <BreakdownList data={monthBreakdown} />
          </>
        )}

        {/* ================= CUSTOM CARDS SUB-TAB ================= */}
        {subTab === 'custom' && (
          <>
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-bold text-zinc-700">Kartu Rekap Kustom</p>
                <p className="text-[10px] text-zinc-400">Buat card mingguan, event, atau periode bebas</p>
              </div>
              <button
                onClick={() => setShowAddCardModal(true)}
                className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Buat Card
              </button>
            </div>

            {customRekapCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
                <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-700">Belum Ada Rekap Kustom</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Buat kartu seperti "Minggu 1 Sep", "Minggu 2 Sep", atau rekap proyek liburan.
                </p>
                <button
                  onClick={() => setShowAddCardModal(true)}
                  className="mt-4 px-4 py-2 btn-primary text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Buat Rekap Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customRekapCards.map(card => {
                  const cardTxns = filterByRange(card.startDate, card.endDate);
                  const cardSummary = computeSummary(cardTxns);
                  const cardBreakdown = getCategoryBreakdown(cardTxns);

                  return (
                    <div key={card.id} className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-zinc-800">{card.name}</h3>
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{card.startDate} s/d {card.endDate}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setDeleteTargetCard(card)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-500 active:scale-90 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Card Numbers */}
                      <div className="grid grid-cols-3 gap-2 bg-zinc-50 rounded-xl p-2.5 text-center">
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-medium">Masuk</span>
                          <span className="text-xs font-bold text-emerald-500">+Rp {formatIDR(cardSummary.income)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-medium">Keluar</span>
                          <span className="text-xs font-bold text-rose-500">-Rp {formatIDR(cardSummary.expense)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 block font-medium">Selisih</span>
                          <span className={`text-xs font-bold ${cardSummary.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            Rp {formatIDR(Math.abs(cardSummary.selisih))}
                          </span>
                        </div>
                      </div>

                      {/* Mini Breakdown */}
                      {cardBreakdown.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-zinc-100">
                          <p className="text-[10px] text-zinc-400 font-medium">Kategori Teratas:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cardBreakdown.slice(0, 3).map((cb, idx) => (
                              <span key={idx} className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md">
                                {cb.category?.name || 'Lainnya'}: Rp {formatIDR(cb.amount)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Pengaturan Rekap">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Tanggal Mulai Periode Bulanan</label>
            <input
              type="number" min={1} max={31}
              value={startDate}
              onChange={e => setStartDate(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
              className="input-field"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Tanggal 1 = periode 1-31, Tanggal 25 = periode 25-24</p>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Saldo Akumulasi</p>
              <p className="text-[10px] text-zinc-400">Tampilkan sisa bulan lalu di rekap bulanan</p>
            </div>
            <button
              onClick={() => setAccum(!accum)}
              className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${accum ? 'bg-[var(--color-primary)]' : 'bg-zinc-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${accum ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <button onClick={saveRekapSettings} className="w-full btn-primary py-3 text-sm font-semibold">
            Simpan
          </button>
        </div>
      </Modal>

      {/* Add Custom Rekap Card Modal */}
      <Modal open={showAddCardModal} onClose={() => setShowAddCardModal(false)} title="Buat Card Rekap">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Nama Card</label>
            <input
              type="text"
              value={newCardName}
              onChange={e => setNewCardName(e.target.value)}
              placeholder="Contoh: Minggu 1 Sep, Liburan Bali, dll"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={newCardStart}
                onChange={e => setNewCardStart(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 font-medium mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={newCardEnd}
                onChange={e => setNewCardEnd(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleSaveCard}
            disabled={!newCardName.trim()}
            className="w-full btn-primary py-3 text-sm font-semibold shadow-md disabled:opacity-40"
          >
            Simpan Card Rekap
          </button>
        </div>
      </Modal>

      {/* Delete Custom Card Confirm */}
      <ConfirmDialog
        open={!!deleteTargetCard}
        onClose={() => setDeleteTargetCard(null)}
        onConfirm={async () => {
          if (deleteTargetCard?.id) {
            await deleteRekapCard(deleteTargetCard.id);
            setDeleteTargetCard(null);
          }
        }}
        title="Hapus Card Rekap"
        message={`Yakin ingin menghapus kartu rekap "${deleteTargetCard?.name}"?`}
        confirmText="Hapus"
        danger
      />
    </div>
  );
}
