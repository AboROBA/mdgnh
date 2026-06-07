/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mortality, Cycle } from '../types';
import { formatDate } from '../utils';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FilePlus2, Skull, HeartPulse, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface MortalityTrackerProps {
  activeCycle: Cycle | undefined;
  mortalities: Mortality[];
  onAddMortality: (mortality: Omit<Mortality, 'id'>) => void;
  onDeleteMortality: (id: string) => void;
}

export default function MortalityTracker({
  activeCycle,
  mortalities,
  onAddMortality,
  onDeleteMortality
}: MortalityTrackerProps) {
  const [count, setCount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // فلترة سجل الوفيات للدورة النشطة فقط
  const activeCycleMortalities = mortalities
    .filter(m => m.cycleId === activeCycle?.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // إجمالي أعداد الوفيات لتلك الدورة
  const totalMortalityCount = activeCycleMortalities.reduce((sum, item) => sum + item.count, 0);

  // حساب النسبة المئوية للنفوق ومستوى الخطر البرمجي
  const initialChicks = activeCycle?.initialChicksCount || 0;
  const mortalityPercent = initialChicks > 0 ? (totalMortalityCount / initialChicks) * 100 : 0;
  const currentLiveStock = Math.max(0, initialChicks - totalMortalityCount);

  // تصنيف مستوى الخطر (مظهر تفاعلي مميز)
  let riskStatus = { text: 'طبيعي وممتاز', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-400' };
  if (mortalityPercent >= 5 && mortalityPercent < 8) {
    riskStatus = { text: 'مقبول (انتباه وتحسين الرعاية)', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20', dot: 'bg-amber-400' };
  } else if (mortalityPercent >= 8) {
    riskStatus = { text: 'مرتفع وحرِج (خطر خسائر طبية)', color: 'bg-rose-500/15 text-rose-300 border-rose-500/20', dot: 'bg-rose-400' };
  }

  // مواءمة البيانات للرسم البياني
  const chartData = activeCycleMortalities.map(m => ({
    التاريخ: m.date.slice(5), // قص اليوم والشهر
    النافق: m.count,
    السبب: m.reason || 'غير محدد'
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !count || count <= 0) return;

    onAddMortality({
      cycleId: activeCycle.id,
      count: Number(count),
      date,
      reason: reason.trim() || undefined
    });

    setCount('');
    setReason('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="mortality-panel">
      {/* القسم الجانبي لتدوين وفيات الدواجن الحية */}
      <div className="glass-card rounded-2xl p-6 h-fit text-white">
        <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3" id="add-mortality-title">
          <FilePlus2 className="w-5 h-5 text-rose-400" />
          <span>سجل النفوق اليومي السريع</span>
        </h2>

        {!activeCycle ? (
          <div className="p-4 backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-xs">
            يجب أن تكون هناك <strong>دورة نشطة جارية</strong> لتسجيل الوفيات والتحكم بالنفوق بدقة.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5 animate-pulse">عدد الطيور النافقة (اليوم)</label>
              <input
                id="input-mortality-count"
                type="number"
                required
                min="1"
                placeholder="عدد الطيور بالرموز"
                value={count}
                onChange={(e) => setCount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-rose-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">تاريخ رصد الحادثة</label>
              <input
                id="input-mortality-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-rose-400 rounded-xl px-3.5 py-2.5 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-300 mb-1.5">السبب المحتمل / الأعراض المصاحبة</label>
              <input
                id="input-mortality-reason"
                type="text"
                placeholder="مثال: ارتفاع مباغت في الحرارة، اختناق طبيعي"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs glass-input focus:ring-1 focus:ring-rose-400 rounded-xl px-3.5 py-2.5 transition-colors"
              />
            </div>

            <button
              id="btn-submit-mortality"
              type="submit"
              className="w-full py-3 bg-rose-550 hover:bg-rose-500 text-white font-bold text-xs rounded-xl border-0 transition-all shadow-lg shadow-rose-550/20 cursor-pointer flex items-center justify-center gap-2 mt-4"
            >
              <Skull className="w-4 h-4 text-rose-300" />
              <span>إدخل التقرير ومزامنة المخزون</span>
            </button>
          </form>
        )}

        {/* عرض تفاعلي لمؤشرات الصحة ومعدل الخلو بالدورة */}
        {activeCycle && (
          <div className="mt-6 pt-5 border-t border-white/10 space-y-3 text-right">
            <h3 className="text-xs font-extrabold text-white/80">مؤشرات الكفاءة الطبية المباشرة:</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-[10px] text-white/60 font-bold">الدجاج الحي الحالي</p>
                <p className="text-base font-extrabold text-emerald-350 font-mono mt-0.5">{currentLiveStock.toLocaleString('ar')}</p>
              </div>
              <div className="p-3 bg-rose-500/10 border border-rose-550/20 rounded-xl">
                <p className="text-[10px] text-white/60 font-bold">إجمالي النافق العام</p>
                <p className="text-base font-extrabold text-rose-350 font-mono mt-0.5">{totalMortalityCount.toLocaleString('ar')}</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 mt-2 leading-tight ${riskStatus.color}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${riskStatus.dot}`} />
                <span className="text-xs font-bold">الحالة الصحية: {riskStatus.text}</span>
              </div>
              <span className="text-xs font-mono font-extrabold">{mortalityPercent.toFixed(2)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* قسم اللوحة التحليلية والخط البياني للوفيات */}
      <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col justify-between text-white shadow-xl">
        <div>
          <div className="border-b border-white/10 pb-3 mb-5">
            <h2 className="text-md font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-rose-400" />
              <span>منحنى الوفيات اليومي وتحليل مخاطر القطيع</span>
            </h2>
            <p className="text-[11px] text-white/60 mt-1">تتبع مستويات الوفيات اليومية للطيور لتجنب تفشي الأوبئة وضمان الاستجابة السريعة.</p>
          </div>

          {/* لوحة الرسم البياني لـ Recharts */}
          {activeCycleMortalities.length > 0 ? (
            <div className="h-[230px] rounded-xl overflow-hidden bg-white/5 p-4 border border-white/10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMortality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="التاريخ" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', textAlign: 'right', backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                    labelFormatter={(label) => `التاريخ: ${label}`}
                  />
                  <Area type="monotone" dataKey="النافق" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMortality)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[230px] flex flex-col items-center justify-center text-white/40 border border-dashed border-white/10 rounded-xl gap-2 py-8 bg-white/5">
              <HeartPulse className="w-10 h-10 text-white/20 animate-pulse" />
              <p className="text-xs font-bold text-white/70">منحنى الرسم البياني غير كافٍ</p>
              <p className="text-[10px] text-white/40 pl-4 pr-4">يرجى رصد وفيات يومين على الأقل لرسم المخطط البياني وتحليل الارتفاع والنفوق.</p>
            </div>
          )}

          {/* قائمة الوفيات المسجلة */}
          <div className="mt-6">
            <h3 className="text-xs font-extrabold text-white/80 mb-3 text-right">أحدث وفيات مسجلة بهذه الدورة:</h3>
            {activeCycleMortalities.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-6">لا يوجد تقارير وفيات مسجلة بهذه الدورة بعد.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 no-scrollbar">
                {activeCycleMortalities.slice().reverse().map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex justify-between items-center text-right text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="font-extrabold text-white">{item.count} من الطيور</span>
                      </div>
                      {item.reason && <p className="text-[10px] text-white/60 mt-1">السبب المحتمل: {item.reason}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/50 font-mono">{formatDate(item.date)}</span>
                      <button
                        onClick={() => onDeleteMortality(item.id)}
                        className="text-white/45 hover:text-red-400 p-1 bg-transparent hover:bg-white/5 rounded-md transition-colors border-0"
                        title="حذف"
                      >
                        <Skull className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/40 leading-relaxed text-right">
          * يتم تحديث عداد القطيع الحي المتاح للبيع تلقائياً بإنقاص أعداد والنفوق من العدد الأساسي المسحب للدورة.
        </div>
      </div>
    </div>
  );
}
