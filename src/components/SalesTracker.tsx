/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sale, Cycle } from '../types';
import { formatUSD, formatSYP, formatDate } from '../utils';
import { ShoppingCart, BadgeAlert, PlusSquare, ArrowUpRight, Scale, TrendingUp, Info } from 'lucide-react';

interface SalesTrackerProps {
  activeCycle: Cycle | undefined;
  sales: Sale[];
  currentExchangeRate: number;
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onDeleteSale: (id: string) => void;
  currentLiveBirds: number;
}

export default function SalesTracker({
  activeCycle,
  sales,
  currentExchangeRate,
  onAddSale,
  onDeleteSale,
  currentLiveBirds
}: SalesTrackerProps) {
  const [buyerName, setBuyerName] = useState('');
  const [chickenCount, setChickenCount] = useState<number | ''>('');
  const [totalWeightKg, setTotalWeightKg] = useState<number | ''>('');
  const [pricePerKgSYP, setPricePerKgSYP] = useState<number | ''>('');
  const [customRate, setCustomRate] = useState<number>(currentExchangeRate);

  // تحديث سعر الصرف الافتراضي عند التحميل
  React.useEffect(() => {
    if (currentExchangeRate) {
      setCustomRate(currentExchangeRate);
    }
  }, [currentExchangeRate]);

  // فلترة مبيعات الدورة الحالية فقط
  const cycleSales = sales.filter(s => s.cycleId === activeCycle?.id);

  // حسابات إجمالي مبيعات الدورة الحالية
  const totalSoldCount = cycleSales.reduce((sum, item) => sum + item.chickenCount, 0);
  const totalSoldWeightKg = cycleSales.reduce((sum, item) => sum + item.totalWeightKg, 0);
  const totalReceivedSYP = cycleSales.reduce((sum, item) => sum + (item.totalWeightKg * item.pricePerKgSYP), 0);
  const totalReceivedUSD = cycleSales.reduce((sum, item) => sum + ((item.totalWeightKg * item.pricePerKgSYP) / item.exchangeRate), 0);
  const avgBirdWeight = totalSoldCount > 0 ? (totalSoldWeightKg / totalSoldCount) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;
    if (!buyerName || !chickenCount || !totalWeightKg || !pricePerKgSYP || !customRate) return;

    if (Number(chickenCount) > currentLiveBirds) {
      alert(`عذراً، العدد الحي الحالي المتبقي في المدجنة هو ${currentLiveBirds} دجاجة فقط. لا يمكن تسجيل مبيع لعدد ${chickenCount} دجاجة.`);
      return;
    }

    onAddSale({
      cycleId: activeCycle.id,
      buyerName: buyerName.trim(),
      chickenCount: Number(chickenCount),
      totalWeightKg: Number(totalWeightKg),
      pricePerKgSYP: Number(pricePerKgSYP),
      exchangeRate: Number(customRate),
      date: new Date().toISOString().split('T')[0]
    });

    // إعادة ضبط الحقول
    setBuyerName('');
    setChickenCount('');
    setTotalWeightKg('');
    setPricePerKgSYP('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="sales-panel">
      {/* قسم تسجيل المبيعات الجديد (الجانب اليمين) */}
      <div className="glass-card rounded-2xl p-6 h-fit text-white">
        <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3" id="add-sale-title">
          <PlusSquare className="w-5 h-5 text-emerald-400" />
          <span>مستند عقد مبيعات جديد</span>
        </h2>

        {!activeCycle ? (
          <div className="p-4 backdrop-blur-md bg-amber-550/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
            يجب أن يتوفر لدى الموزّع <strong>دورة دواجن نشطة</strong> لتسجيل حركة المبيعات وتفوير كمية اللحم.
          </div>
        ) : currentLiveBirds <= 0 ? (
          <div className="p-4 backdrop-blur-md bg-orange-550/10 border border-orange-500/20 rounded-xl text-orange-200 text-xs">
            لم يعد يتوفر أي دجاج حي متبقي في حظائر المدجنة <strong>(العدد المتاح الحالي {currentLiveBirds})</strong>. يرجى مراجعة النفوق أو تقفيل الدورة.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">اسم المشتري / تاجر الجملة</label>
              <input
                id="input-sale-buyer"
                type="text"
                required
                placeholder="مثال: تاجر الدواجن أحمد العبدالله"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">عدد الدجاج المباع</label>
                <input
                  id="input-sale-count"
                  type="number"
                  required
                  min="1"
                  max={currentLiveBirds}
                  placeholder={`الحد الأقصى ${currentLiveBirds}`}
                  value={chickenCount}
                  onChange={(e) => setChickenCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">الوزن الإجمالي للكاميون (كغ)</label>
                <input
                  id="input-sale-weight"
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="الوزن الإجمالي كغ"
                  value={totalWeightKg}
                  onChange={(e) => setTotalWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">سعر الكيلو (ل.س)</label>
                <input
                  id="input-sale-price-syp"
                  type="number"
                  required
                  min="1"
                  placeholder="مثال: 28500 ل.س"
                  value={pricePerKgSYP}
                  onChange={(e) => setPricePerKgSYP(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">سعر الصرف المعتمد</label>
                <input
                  id="input-sale-exchange-rate"
                  type="number"
                  required
                  min="1"
                  value={customRate}
                  onChange={(e) => setCustomRate(Number(e.target.value))}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono text-center"
                />
              </div>
            </div>

            {/* معاينة تذكرة البيع */}
            {totalWeightKg && pricePerKgSYP && chickenCount && (
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-xs mt-3 space-y-1 text-white">
                <p className="font-bold text-emerald-300 mb-1">تفاصيل ومؤشرات نقلة البيع الحالية:</p>
                <p className="flex justify-between">
                  <span className="text-white/60">متوسط وزن الدجاجة التقديري:</span>
                  <span className="font-mono font-bold text-white">
                    {((Number(totalWeightKg) / Number(chickenCount))).toFixed(2)} كغ
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">إجمالي فاتورة البيع بالليرة:</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {formatSYP(Number(totalWeightKg) * Number(pricePerKgSYP))}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="text-white/60">ما يعادلها بالدولار:</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {formatUSD((Number(totalWeightKg) * Number(pricePerKgSYP)) / customRate)}
                  </span>
                </p>
              </div>
            )}

            <button
              id="btn-submit-sale"
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-440 border-0 text-emerald-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/20"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>إدخال الفاتورة وتثبيت المبيع</span>
            </button>
          </form>
        )}
      </div>

      {/* لوحة الكشف وعرض عمليات البيع الجارية للمربي (الجانب اليسار) */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl">
        <div>
          <div className="border-b border-white/10 pb-3 mb-5 text-right">
            <h2 className="text-md font-bold text-white flex items-center gap-2 justify-start">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>سجل وعقود مبيعات الدورة الحالية</span>
            </h2>
            <p className="text-[11px] text-white/60 mt-1">تتبع التدفقات النقدية الصادرة من مبيعات اللحم لحواضر التجار والمسالخ الفنية.</p>
          </div>

          {/* لوحة الملخص الكمي لمبيعات المفرخة */}
          {cycleSales.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 text-right">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-white/60 font-bold">إجمالي المباع بالعدد</p>
                <p className="text-sm font-extrabold text-white font-mono mt-0.5">{totalSoldCount.toLocaleString('ar')} طير</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-white/60 font-bold">الوزن الإجمالي للحوم</p>
                <p className="text-sm font-extrabold text-white font-mono mt-0.5">{totalSoldWeightKg.toLocaleString('ar')} كغ</p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] text-white/60 font-bold">متوسط وزن الدجاجة</p>
                <p className="text-sm font-extrabold text-emerald-300 font-mono mt-0.5">{avgBirdWeight.toFixed(2)} كغ</p>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-[10px] text-indigo-300 font-bold">المدخول الكلي بالدولار</p>
                <p className="text-sm font-extrabold text-indigo-300 font-mono mt-0.5">{formatUSD(totalReceivedUSD)}</p>
              </div>
            </div>
          ) : null}

          {/* قائمة المبيعات المدونة */}
          {cycleSales.length === 0 ? (
            <div className="text-center py-16 text-white/40 flex flex-col items-center justify-center gap-3">
              <ShoppingCart className="w-12 h-12 text-white/10" />
              <div>
                <p className="text-xs font-bold text-white/70">لم يتم بيع أي دجاجة في هذه الدورة حتى الآن</p>
                <p className="text-[10px] text-white/40 mt-1">المبيعات تبدأ بعد وصول الطيور للسن والوزن المناسب (الأسبوع الخامس أو السادس).</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {cycleSales.slice().reverse().map((sale) => (
                <div
                  key={sale.id}
                  className="p-4 border border-white/5 rounded-xl hover:bg-white/5 transition-all text-right flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <p className="text-xs font-bold text-white">{sale.buyerName}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/50 mt-1">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-white/40" />
                        العدد: {sale.chickenCount} طير
                      </span>
                      <span>•</span>
                      <span>الوزن: {sale.totalWeightKg} كغ</span>
                      <span>•</span>
                      <span>متوسط الوزن: {(sale.totalWeightKg / sale.chickenCount).toFixed(2)} كغ</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                    <div className="text-left font-mono">
                      <p className="text-xs font-bold text-white/40 leading-none mb-1">
                        السعر: {formatSYP(sale.pricePerKgSYP)} / كغ
                      </p>
                      <p className="text-xs font-extrabold text-emerald-300 leading-tight">
                        {formatSYP(sale.totalWeightKg * sale.pricePerKgSYP)}
                      </p>
                      <p className="text-[10px] text-indigo-300 font-bold mt-0.5">
                        {formatUSD((sale.totalWeightKg * sale.pricePerKgSYP) / sale.exchangeRate)}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteSale(sale.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer border-0"
                      title="حذف حركة البيع"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* تلميح دقة العملية */}
        <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 leading-relaxed text-right">
          * تظهر عقود المبيعات القيمة الحقيقية للوزن المباع بالعملة السورية مع تحويل معادلها الفوري بعملة المقاصاة (الدولار) لتوفير أية لوحات لمراقبة صافي أرباح الدورة.
        </div>
      </div>
    </div>
  );
}
