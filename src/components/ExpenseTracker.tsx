/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, Cycle, ExpenseCategory } from '../types';
import { formatUSD, formatSYP, formatDate } from '../utils';
import { PlusCircle, Receipt, Trash2, SlidersHorizontal, Calculator, DollarSign, Wallet } from 'lucide-react';

interface ExpenseTrackerProps {
  activeCycle: Cycle | undefined;
  expenses: Expense[];
  currentExchangeRate: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, { label: string; bg: string; text: string }> = {
  prep: { label: 'تجهيز وتعقيم', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', text: 'text-indigo-455' },
  chicks: { label: 'شراء صيصان', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-455' },
  feed: { label: 'أعلاف وتغذية', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', text: 'text-emerald-455' },
  medicine: { label: 'أدوية وتحصينات', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30', text: 'text-sky-455' },
  fuel: { label: 'مازوت وتدفئة', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/30', text: 'text-orange-455' },
  electricity: { label: 'كهرباء ومياه', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', text: 'text-yellow-455' },
  salaries: { label: 'رواتب وأجور عمال', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', text: 'text-purple-455' },
  other: { label: 'نفقات أخرى', bg: 'bg-slate-500/25 text-slate-305 border-slate-500/30', text: 'text-slate-400' },
};

export default function ExpenseTracker({
  activeCycle,
  expenses,
  currentExchangeRate,
  onAddExpense,
  onDeleteExpense,
}: ExpenseTrackerProps) {
  const [category, setCategory] = useState<ExpenseCategory>('feed');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'USD' | 'SYP'>('USD');
  const [customRate, setCustomRate] = useState<number>(currentExchangeRate);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // استخراج النفقات للدورة النشطة الحالية فحسب
  const filteredExpenses = expenses
    .filter(e => e.cycleId === activeCycle?.id)
    .filter(e => filterCategory === 'all' || e.category === filterCategory);

  // تحديث سعر الصرف التلقائي عند تغيير الدورة
  React.useEffect(() => {
    if (currentExchangeRate) {
      setCustomRate(currentExchangeRate);
    }
  }, [currentExchangeRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;
    if (!description || !amount || amount <= 0) return;

    onAddExpense({
      cycleId: activeCycle.id,
      category,
      description,
      amount: Number(amount),
      currency,
      exchangeRate: customRate || currentExchangeRate,
      date: new Date().toISOString().split('T')[0],
    });

    // تفريغ المدخلات بعد النجاح
    setDescription('');
    setAmount('');
  };

  // احتساب إجمالي الفواتير الظاهرة
  const totalUSD = filteredExpenses.reduce((sum, item) => {
    if (item.currency === 'USD') return sum + item.amount;
    return sum + (item.amount / item.exchangeRate);
  }, 0);

  const totalSYP = filteredExpenses.reduce((sum, item) => {
    if (item.currency === 'SYP') return sum + item.amount;
    return sum + (item.amount * item.exchangeRate);
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="expense-panel">
      {/* قسم نموذج الإضافة للمصاريف */}
      <div className="glass-card rounded-2xl p-6 h-fit text-white">
        <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3" id="add-expense-title">
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          <span>تسجيل فاتورة / مصروف جديد</span>
        </h2>

        {!activeCycle ? (
          <div className="p-4 backdrop-blur-md bg-amber-500/10 border border-amber-550/20 rounded-xl text-amber-205 text-xs">
            يجب أن تكون هناك <strong>دورة تربية نشطة</strong> لتتمكن من تدوين المصاريف الجديدة. يرجى تفعيل أو بدء دورة جديدة.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">مرحلة / نوع المصروف</label>
              <select
                id="select-expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full text-xs font-medium glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                  <option key={key} value={key} className="bg-slate-900 text-white">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5 font-sans">بيان وتفاصيل المصروف</label>
              <input
                id="input-expense-desc"
                type="text"
                required
                placeholder="مثال: شراء طن علف بادئ ممتاز"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">قيمة الفاتورة</label>
                <div className="relative">
                  <input
                    id="input-expense-amount"
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder="امبلغ مالي"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 text-center font-mono transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">عملة الإدخال</label>
                <div className="grid grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1">
                  <button
                    id="btn-currency-usd"
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currency === 'USD' ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    دولار ($)
                  </button>
                  <button
                    id="btn-currency-syp"
                    type="button"
                    onClick={() => setCurrency('SYP')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      currency === 'SYP' ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    ل.س
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                سعر صرف الصيانة أو الفاتورة لمطابقة الصرف (ل.س للدولار)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="input-expense-rate"
                  type="number"
                  min="1"
                  required
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2 transition-colors font-mono"
                />
              </div>
              <p className="text-[10px] text-white/55 mt-1 leading-relaxed">
                * سعر الصرف الافتراضي اليوم يعادل {formatSYP(currentExchangeRate)}. يُمكنك تغييره بحسب قيمة صرف لحظة إصدار هذه الفاتورة.
              </p>
            </div>

            {/* معاينة القيمة بالعملة الأخرى */}
            {amount && amount > 0 && (
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs text-right mt-2 space-y-1">
                <p className="font-bold text-emerald-350 mb-1">المعادلة في الدفاتر لكلا العملتين:</p>
                {currency === 'USD' ? (
                  <>
                    <p className="flex justify-between">
                      <span className="text-white/60">القيمة بالدولار:</span>
                      <span className="font-mono font-bold text-white">{formatUSD(amount)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-white/60">القيمة والتحويل لليرة:</span>
                      <span className="font-mono font-bold text-emerald-300">{formatSYP(amount * customRate)}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="flex justify-between">
                      <span className="text-white/60">القيمة بالليرة:</span>
                      <span className="font-mono font-bold text-white">{formatSYP(amount)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-white/60">التحويل المباشر للدولار:</span>
                      <span className="font-mono font-bold text-emerald-300">{formatUSD(amount / customRate)}</span>
                    </p>
                  </>
                )}
              </div>
            )}

            <button
              id="btn-submit-expense"
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-440 text-emerald-950 border-0 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/20"
            >
              <Calculator className="w-4 h-4" />
              <span>إدخال الفاتورة وحساب النفقات</span>
            </button>
          </form>
        )}
      </div>

      {/* قسم عروض ومراقبة سجل المصاريف */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl">
        <div>
          {/* تصفية الفواتير */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-3 mb-4 gap-4">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <span>سجل الفواتير والمصاريف للدورة الحالية</span>
            </h2>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/50 shrink-0" />
              <select
                id="filter-expense-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 transition-colors text-white"
              >
                <option value="all" className="bg-slate-900 text-white">كل الفئات</option>
                {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                  <option key={key} value={key} className="bg-slate-900 text-white">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ملخص إحصائي سريع للفواتير المصفاة */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-300">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-white/65 font-bold">إجمالي النفقات الحالية بالدولار</p>
                  <p className="text-sm font-extrabold text-emerald-300 font-mono mt-0.5">{formatUSD(totalUSD)}</p>
                </div>
              </div>
              <div className="bg-indigo-500/10 rounded-xl p-3 border border-indigo-500/20 flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-300">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-white/65 font-bold">إجمالي التكلفة بليرات سورية</p>
                  <p className="text-sm font-extrabold text-indigo-300 font-mono mt-0.5">{formatSYP(totalSYP)}</p>
                </div>
              </div>
            </div>
          )}

          {/* محتوى قائمة المصاريف */}
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16 text-white/40 flex flex-col items-center justify-center gap-3">
              <Receipt className="w-12 h-12 text-white/10" />
              <div>
                <p className="text-xs font-bold text-white/70">لا يوجد لديك أي فواتير مسجلة حالياً</p>
                <p className="text-[10px] text-white/40 mt-1">
                  {filterCategory === 'all'
                    ? 'قم بتدوين أول نفقاتك من خلال تعبئة نموذج الإدخال السريع باليمين.'
                    : 'حاول تغيير معايير التصفية لإظهار نفقات مرحلية أخرى.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[360px] space-y-2 pr-1 no-scrollbar">
              {filteredExpenses.map((expense) => {
                const badge = CATEGORY_LABELS[expense.category];
                // الحسابات المقابلة لكل عملية
                const counterValue =
                  expense.currency === 'USD'
                    ? expense.amount * expense.exchangeRate
                    : expense.amount / expense.exchangeRate;

                return (
                  <div
                    key={expense.id}
                    id={`expense-item-${expense.id}`}
                    className="p-3 border border-white/5 rounded-xl flex items-center justify-between gap-4 transition-all hover:bg-white/5"
                  >
                    <div className="flex items-start gap-3 text-right">
                      <div className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border shrink-0 mt-0.5 ${badge.bg}`}>
                        {badge.label}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-snug">{expense.description}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/50 mt-1">
                          <span className="font-mono leading-none">{formatDate(expense.date)}</span>
                          <span className="font-mono">صرف المبيع: {formatSYP(expense.exchangeRate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left font-mono">
                        <p className="text-xs font-extrabold text-white">
                          {expense.currency === 'USD' ? formatUSD(expense.amount) : formatSYP(expense.amount)}
                        </p>
                        <p className="text-[10px] text-emerald-300 font-bold mt-0.5">
                          {expense.currency === 'USD' ? formatSYP(counterValue) : formatUSD(counterValue)}
                        </p>
                      </div>

                      <button
                        id={`btn-delete-expense-${expense.id}`}
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-2 text-white/45 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer border-0"
                        title="حذف هذا البند"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/40 flex justify-between">
          <span>* الفواتير المسجلة بالدولار يتم تقييم معادلها بالليرة لحظة الفاتورة.</span>
          <span>يتضمن كشف الحساب تكلفة شراء الصوص التلقائية البالغة {activeCycle ? formatUSD(activeCycle.initialChicksCount * activeCycle.chickCostUSD) : '$0.00'}.</span>
        </div>
      </div>
    </div>
  );
}
