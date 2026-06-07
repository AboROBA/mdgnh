/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cycle, Expense, Mortality, Sale } from '../types';
import { formatUSD, formatSYP, formatDate, calculateCycleStats } from '../utils';
import { Calendar, Layers, PlusCircle, CheckCircle, AlertTriangle, Edit3, Trash2, XCircle, ShieldAlert } from 'lucide-react';

interface CycleManagerProps {
  cycles: Cycle[];
  expenses: Expense[];
  mortalities: Mortality[];
  sales: Sale[];
  currentExchangeRate: number;
  currentUserRole: 'admin' | 'manager' | 'viewer';
  onStartCycle: (cycle: Omit<Cycle, 'id' | 'status'>) => void;
  onCloseCycle: (id: string, endDate: string) => void;
  onUpdateCycle: (cycle: Cycle) => void;
  onDeleteCycle: (id: string) => void;
}

export default function CycleManager({
  cycles,
  expenses,
  mortalities,
  sales,
  currentExchangeRate,
  currentUserRole,
  onStartCycle,
  onCloseCycle,
  onUpdateCycle,
  onDeleteCycle,
}: CycleManagerProps) {
  // حالة التحكم بالنموذج
  const [showNewCycleForm, setShowNewCycleForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // حقول نموذج الدورة الجديدة
  const [name, setName] = useState('');
  const [initialCount, setInitialCount] = useState<number | ''>('');
  const [chickCostUSD, setChickCostUSD] = useState<number | ''>('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedPriceUSD, setFeedPriceUSD] = useState<number | ''>(540); // للتسهيل الافتراضي

  // حقول التعديل للدورة الحالية
  const [editName, setEditName] = useState('');
  const [editInitialCount, setEditInitialCount] = useState<number | ''>('');
  const [editChickCostUSD, setEditChickCostUSD] = useState<number | ''>('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editFeedPriceUSD, setEditFeedPriceUSD] = useState<number | ''>('');

  // تاريخ الإغلاق المخصص للدورة
  const [closeEndDate, setCloseEndDate] = useState(new Date().toISOString().split('T')[0]);

  const activeCycle = cycles.find(c => c.status === 'active');
  const closedCycles = cycles.filter(c => c.status === 'closed');

  // تهيئة قيم نموذج التعديل بالقيم الحالية
  const startEditing = () => {
    if (!activeCycle) return;
    setEditName(activeCycle.name);
    setEditInitialCount(activeCycle.initialChicksCount);
    setEditChickCostUSD(activeCycle.chickCostUSD);
    setEditStartDate(activeCycle.startDate);
    setEditFeedPriceUSD(activeCycle.feedPricePerTonUSD || 540);
    setIsEditing(true);
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
    if (activeCycle) return;
    if (!name || !initialCount || !chickCostUSD || !startDate) return;

    onStartCycle({
      name: name.trim(),
      initialChicksCount: Number(initialCount),
      chickCostUSD: Number(chickCostUSD),
      startDate,
      exchangeRateAtStart: currentExchangeRate,
      feedPricePerTonUSD: Number(feedPriceUSD) || 540,
    });

    // تفريغ الحقول
    setName('');
    setInitialCount('');
    setChickCostUSD('');
    setShowNewCycleForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole === 'viewer') return;
    if (!activeCycle) return;
    if (!editName || !editInitialCount || !editChickCostUSD || !editStartDate) return;

    onUpdateCycle({
      ...activeCycle,
      name: editName.trim(),
      initialChicksCount: Number(editInitialCount),
      chickCostUSD: Number(editChickCostUSD),
      startDate: editStartDate,
      feedPricePerTonUSD: Number(editFeedPriceUSD) || 540,
    });

    setIsEditing(false);
  };

  const handleConfirmClose = () => {
    if (currentUserRole === 'viewer') return;
    if (!activeCycle) return;
    onCloseCycle(activeCycle.id, closeEndDate);
    setShowCloseModal(false);
  };

  const handleConfirmDelete = () => {
    if (currentUserRole !== 'admin') return;
    if (!activeCycle) return;
    onDeleteCycle(activeCycle.id);
  };

  // إعداد مصفوفة مقارنات الأداء بين جميع الدورات المسجلة
  const cycleComparisonData = cycles.map(cycle => {
    const stats = calculateCycleStats(cycle, expenses, mortalities, sales, currentExchangeRate);
    return {
      cycle,
      stats,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in" id="cycle-manager-panel">
      {/* قسم الدورة النشطة وبدء الدورات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* صندوق حالة الدورة الجارية والتحكم بها */}
        <div className="glass-card rounded-2xl p-6 shadow-xl flex flex-col justify-between text-right text-white">
          <div>
            <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>الدورة المحاسبية الجارية حالياً</span>
            </h2>

            {activeCycle ? (
              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-emerald-500 text-emerald-950 rounded-md text-[9px] font-bold uppercase animate-pulse">نشطة ومستمرة</span>
                  <p className="text-sm font-bold text-white mb-1">{activeCycle.name}</p>
                  <p className="text-[10px] text-white/50 font-mono">تاريخ البدء المعتمد: {formatDate(activeCycle.startDate)}</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 hover:bg-white/5 rounded-lg border-b border-white/5 pb-1.5">
                    <span className="text-white/60">حجم الاستقبال من الصيصان:</span>
                    <span className="font-extrabold text-white font-mono">{activeCycle.initialChicksCount.toLocaleString('ar')} صوص</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-white/5 rounded-lg border-b border-white/5 pb-1.5">
                    <span className="text-white/60">سعر الصوص عند الاستقبال:</span>
                    <span className="font-extrabold text-emerald-350 font-mono">{formatUSD(activeCycle.chickCostUSD)}</span>
                  </div>
                  <div className="flex justify-between p-2 hover:bg-white/5 rounded-lg pb-1.5">
                    <span className="text-white/60">سعر الصرف الافتتاحي:</span>
                    <span className="font-extrabold text-white/80 font-mono">{formatSYP(activeCycle.exchangeRateAtStart)}</span>
                  </div>
                  {activeCycle.notes && (
                    <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-[11px] text-emerald-250 mt-2">
                       {activeCycle.notes}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-white/40">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white/70">لا تتوفر دورة تربية مستمرة جارية حالياً.</p>
                <p className="text-[11px] text-white/40 mt-1">المدجنة معقمة ومستعدة لاستقبال الفوج الموالي. نموذج إدخال الفوج فارغ وجاهز لتصميم دورة جديدة.</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
            {activeCycle ? (
              <>
                {currentUserRole !== 'viewer' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      id="btn-edit-active-cycle-trigger"
                      type="button"
                      onClick={startEditing}
                      className="py-2.5 bg-sky-655 hover:bg-sky-550 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل الدورة</span>
                    </button>

                    <button
                      id="btn-close-active-cycle-trigger"
                      type="button"
                      onClick={() => setShowCloseModal(true)}
                      className="py-2.5 bg-red-550 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border-0"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>أرشفة وإغلاق</span>
                    </button>
                  </div>
                )}

                {currentUserRole === 'admin' && (
                  <button
                    id="btn-delete-active-cycle-trigger"
                    type="button"
                    onClick={handleConfirmDelete}
                    className="w-full py-2 bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-dashed border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إلغاء وحذف الدورة الحالية وتصفيرها</span>
                  </button>
                )}

                {currentUserRole === 'viewer' && (
                  <div className="p-2 border border-white/5 bg-white/5 rounded-lg text-[10px] text-center text-white/50">
                    * وضع العرض: ليس لديك صلاحيات لتعديل أو أرشفة هذه الدورة.
                  </div>
                )}
              </>
            ) : (
              currentUserRole !== 'viewer' ? (
                <button
                  id="btn-trigger-new-cycle-ui"
                  type="button"
                  onClick={() => setShowNewCycleForm(true)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-emerald-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border-0 shadow-lg shadow-emerald-500/15"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>استقبال فوج جديد وافتتاح الدورة فورا</span>
                </button>
              ) : (
                <div className="p-2 border border-white/5 bg-white/5 rounded-lg text-[10px] text-center text-white/50">
                  * حساب المشاهدة لا يمكنه افتتاح دورات جديدة.
                </div>
              )
            )}
          </div>
        </div>

        {/* نموذج تفاعلي - إما نموذج التعديل أو نموذج التأسيس الجديد أو حالة الدورة */}
        <div className="col-span-1 lg:col-span-2 glass-card rounded-2xl p-6 shadow-xl text-right text-white">
          
          {/* 1. نموذج تأكيد إغلاق الدورة المحاسبية الحالية */}
          {showCloseModal && activeCycle && (
            <div className="space-y-4 animate-fade-in border-2 border-red-500/30 p-4 rounded-xl bg-red-950/20">
              <h3 className="text-sm font-bold text-red-350 flex items-center gap-2 pb-2 border-b border-white/10">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <span>إغلاق وتجمد الدورة المحاسبية لـ: "{activeCycle.name}"</span>
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                سيتم أرشفة كامل نفقات ومبيعات المدجنة تحت اسم هذه الدورة، وتجميد الإدخالات للتمكن من فك دورة صوص جديدة. يرجى تحديد تاريخ إغلاق الدورة بالأسفل. لتتمكن من إيقافها بيوم واحد أو أي تاريخ مرن.
              </p>
              
              <div className="max-w-xs space-y-1.5">
                <label className="block text-xs font-bold text-red-300">تاريخ إغلاق الدورة المعتمد</label>
                <input
                  id="close-cycle-date"
                  type="date"
                  value={closeEndDate}
                  onChange={(e) => setCloseEndDate(e.target.value)}
                  className="w-full text-xs glass-input focus:ring-1 focus:ring-red-400 rounded-xl px-3 py-2 transition-colors border-red-500/20 text-white font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  id="btn-close-cycle-cancel"
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  id="btn-close-cycle-confirm-real"
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-5 py-2 bg-red-550 hover:bg-red-500 text-white text-xs font-bold rounded-xl cursor-pointer border-0"
                >
                  تأكيد الأرشفة والإغلاق الفوري
                </button>
              </div>
            </div>
          )}

          {/* 2. نموذج تعديل الدورة الجارية (تحديث تاريخ البدء وحجم الصيصان) */}
          {!showCloseModal && isEditing && activeCycle && (
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-light pb-3">
                <Edit3 className="w-5 h-5 text-sky-400" />
                <span>تعديل وحوكمة بيانات الدورة المفتوحة</span>
              </h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">اسم الدورة الفريدة</label>
                    <input
                      id="edit-cycle-name"
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-sky-450 rounded-xl px-3.5 py-2.5 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">تاريخ استقبال الصوص (الافتتاح)</label>
                    <input
                      id="edit-cycle-start"
                      type="date"
                      required
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-sky-450 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">العدد الإجمالي المستلم (صوص)</label>
                    <input
                      id="edit-cycle-count"
                      type="number"
                      required
                      min="1"
                      value={editInitialCount}
                      onChange={(e) => setEditInitialCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-sky-450 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">سعر الصوص بالدولار ($)</label>
                    <input
                      id="edit-cycle-chick-price"
                      type="number"
                      required
                      min="0.1"
                      step="0.01"
                      value={editChickCostUSD}
                      onChange={(e) => setEditChickCostUSD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-sky-450 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">مؤشر طن العلف التقديري ($)</label>
                    <input
                      id="edit-cycle-feed-price"
                      type="number"
                      min="1"
                      value={editFeedPriceUSD}
                      onChange={(e) => setEditFeedPriceUSD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-sky-450 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button
                    id="btn-edit-cycle-cancel"
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                  <button
                    id="btn-edit-cycle-submit"
                    type="submit"
                    className="px-6 py-2 bg-sky-500 hover:bg-sky-450 text-slate-950 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 border-0"
                  >
                    <span>حفظ التعديلات والتزامن</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. نموذج تأسيس دورة جديدة (يعمل فوراً عند عدم وجود دورة ويكون فارغاً) */}
          {!showCloseModal && !isEditing && (showNewCycleForm || !activeCycle) && (
            <div>
              <h2 className="text-md font-bold text-white flex items-center gap-2 mb-4 border-b border-white/10 pb-3" id="start-cycle-title">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>تأسيس المفرخة واستقبال فوج جديد (النموذج فارغ ومستعد)</span>
              </h2>

              <form onSubmit={handleStartSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">اسم الدورة الفريدة</label>
                    <input
                      id="input-cycle-name"
                      type="text"
                      required
                      placeholder="مثال: الفوج الصيفي الأول 2026"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">تاريخ استقبال الصوص</label>
                    <input
                      id="input-cycle-start"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">العدد الإجمالي المستلم (صوص)</label>
                    <input
                      id="input-cycle-count"
                      type="number"
                      required
                      min="1"
                      placeholder="مثال: 5000"
                      value={initialCount}
                      onChange={(e) => setInitialCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">سعر الصوص بالدولار ($)</label>
                    <input
                      id="input-cycle-chick-price"
                      type="number"
                      required
                      min="0.1"
                      step="0.01"
                      placeholder="مثال: 0.85"
                      value={chickCostUSD}
                      onChange={(e) => setChickCostUSD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/70 mb-1.5">مؤشر طن العلف التقديري ($)</label>
                    <input
                      id="input-cycle-feed-price"
                      type="number"
                      min="1"
                      placeholder="سعر طن العلف"
                      value={feedPriceUSD}
                      onChange={(e) => setFeedPriceUSD(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-3.5 py-2.5 transition-colors font-mono"
                    />
                  </div>
                </div>

                {initialCount && chickCostUSD && (
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl text-xs">
                    <p className="font-bold text-emerald-350 mb-1">فاتورة استقبال الفوج الأولية (تثبت تلقائياً بنفقات الاستقبال):</p>
                    <div className="flex justify-between mt-1">
                      <span className="text-white/60">إجمالي فاتورة شراء الصيصان بالدولار:</span>
                      <strong className="font-mono text-white">{formatUSD(Number(initialCount) * Number(chickCostUSD))}</strong>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-white/60">المعادل المالي بالليرة السورية اليوم:</span>
                      <strong className="font-mono text-emerald-300">{formatSYP(Number(initialCount) * Number(chickCostUSD) * currentExchangeRate)}</strong>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end mt-4">
                  {activeCycle && (
                    <button
                      id="btn-cancel-cycle-form"
                      type="button"
                      onClick={() => setShowNewCycleForm(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      إلغاء التراجع
                    </button>
                  )}
                  <button
                    id="btn-confirm-start-cycle"
                    type="submit"
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-450 text-emerald-950 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 border-0"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>تأكيد تسجيل الفوج وبدء الدورة</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 4. الحالة الافتراضية عند وجود دورة ودون وجود تعديل أو إلغاء حالياً */}
          {!showCloseModal && !isEditing && activeCycle && !showNewCycleForm && (
            <div className="h-full flex flex-col justify-center items-center text-white/40 py-12">
              <Layers className="w-12 h-12 text-emerald-500/20 mb-2 animate-pulse" />
              <p className="text-xs font-bold text-white/70">تم تفعيل دورة الدواجن وتسجيل استقبال الفوج والمصاريف بنجاح</p>
              <p className="text-[10px] text-white/40 mt-1 max-w-sm text-center">النظام يعمل حالياً في رصد وفيات الدجاج اليومي والمصاريف المتنوعة ومتابعة المبيعات. لمقارنة الأداء ودراسة المخرجات المالية لكل الدورات راجع الجدول بالأسفل.</p>
            </div>
          )}
        </div>
      </div>

      {/* تقرير مقارنة كفاءة وأداء الدورات المحاسبية */}
      <div className="glass-card rounded-2xl p-6 shadow-xl text-right text-white">
        <div className="border-b border-white/10 pb-3 mb-5">
          <h2 className="text-md font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>كشف تقييم ومقارنة كفاءة الدورات المحاسبية</span>
          </h2>
          <p className="text-xs text-white/60 mt-1">عرض ومقارنة الأرباح الحقيقية وأداء الطيور بين الفوج النشط والفوج السابق المؤرشف.</p>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm text-right">
            <thead>
              <tr className="bg-white/5 text-emerald-300 font-bold text-xs border-b border-white/10">
                <th className="p-3 animate-pulse">اسم الدورة</th>
                <th className="p-3">الفترة والتواريخ</th>
                <th className="p-3">حجم الصيصان</th>
                <th className="p-3">نسبة النفوق (الموت)</th>
                <th className="p-3">إجمالي النفقات ($)</th>
                <th className="p-3">إجمالي المبيعات ($)</th>
                <th className="p-3">صافي الأرباح ($)</th>
                <th className="p-3 font-bold text-emerald-300">صافي الأرباح (SYP)</th>
                <th className="p-3">حالة الدفتر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/90 text-xs">
              {cycleComparisonData.map(({ cycle, stats }) => {
                const profitColor = stats.netProfitUSD >= 0 ? 'text-emerald-350 font-extrabold' : 'text-red-400 font-extrabold';
                
                return (
                  <tr key={cycle.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white">{cycle.name}</td>
                    <td className="p-3 text-white/60 font-mono">
                      {formatDate(cycle.startDate)}
                      {cycle.endDate ? ` إلى ${formatDate(cycle.endDate)}` : ' (حتى اليوم)'}
                    </td>
                    <td className="p-3 font-mono">{cycle.initialChicksCount.toLocaleString('ar')} طير</td>
                    <td className="p-3 font-mono">
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        stats.mortalityRate < 5 ? 'bg-emerald-500/20 text-emerald-300' :
                        stats.mortalityRate < 8 ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {stats.mortalityRate.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-3 font-mono text-white/70">{formatUSD(stats.totalExpensesUSD)}</td>
                    <td className="p-3 font-mono text-white/70">
                      {stats.totalSalesUSD > 0 ? formatUSD(stats.totalSalesUSD) : <span className="text-white/40">لا يوجد (مستمر)</span>}
                    </td>
                    <td className={`p-3 font-mono ${profitColor}`}>
                      {stats.totalSalesUSD > 0 ? formatUSD(stats.netProfitUSD) : (
                        <span className="text-white/40">معلق للبيع</span>
                      )}
                    </td>
                    <td className={`p-3 font-mono ${stats.totalSalesSYP > 0 ? (stats.netProfitSYP >= 0 ? 'text-emerald-350 font-extrabold' : 'text-red-400 font-extrabold') : 'text-white/40'}`}>
                      {stats.totalSalesSYP > 0 ? formatSYP(stats.netProfitSYP) : (
                        <span className="text-white/40">معلق للبيع</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        cycle.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 animate-pulse' : 'bg-white/10 text-white/60'
                      }`}>
                        {cycle.status === 'active' ? 'نشطة جارية' : 'مؤرشفة مغلقة'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
