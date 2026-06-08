/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Cycle, Expense, Mortality, Sale, AppUser } from '../types';
import { formatUSD, formatSYP, calculateCycleStats } from '../utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Landmark, TrendingUp, Skull, Sparkles, Scale, DollarSign, Wallet, Percent, FastForward, PlusCircle, AlertTriangle, Download, Clock, Calendar } from 'lucide-react';
import { CATEGORY_LABELS } from './ExpenseTracker';

interface DashboardProps {
  activeCycle: Cycle | undefined;
  expenses: Expense[];
  mortalities: Mortality[];
  sales: Sale[];
  currentExchangeRate: number;
  currentUser: AppUser;
  onUpdateExchangeRate: (rate: number) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onAddMortality: (mortality: Omit<Mortality, 'id'>) => void;
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
}

export default function Dashboard({
  activeCycle,
  expenses,
  mortalities,
  sales,
  currentExchangeRate,
  currentUser,
  onUpdateExchangeRate,
  onAddExpense,
  onAddMortality,
  onAddSale,
}: DashboardProps) {
  // للتحكم بهيكلية مدخلات اليوم السريعة
  const [exchangeInput, setExchangeInput] = useState<string>(currentExchangeRate.toString());
  const [activeQuickTab, setActiveQuickTab] = useState<'expense' | 'mortality' | 'sale'>('expense');

  // نماذج الإدخال السريع المحلية لتبسيط الواجهة
  const [quickExpAmount, setQuickExpAmount] = useState<number | 'Located' | ''>('');
  const [quickExpDesc, setQuickExpDesc] = useState('');
  const [quickExpCurrency, setQuickExpCurrency] = useState<'USD' | 'SYP'>('USD');
  const [quickExpCategory, setQuickExpCategory] = useState<string>('feed');

  const [quickMortCount, setQuickMortCount] = useState<number | ''>('');
  const [quickMortReason, setQuickMortReason] = useState('');

  const [quickSaleCount, setQuickSaleCount] = useState<number | ''>('');
  const [quickSaleWeight, setQuickSaleWeight] = useState<number | ''>('');
  const [quickSalePrice, setQuickSalePrice] = useState<number | ''>('');
  const [quickSaleBuyer, setQuickSaleBuyer] = useState('');

  // استخلاص الصلاحيات الدقيقة من بيانات الموظف
  const userPerms = currentUser.permissions || {
    canManageCycles: currentUser.role === 'admin' || currentUser.role === 'manager',
    canManageExpenses: currentUser.role === 'admin' || currentUser.role === 'manager',
    canManageMortalities: true,
    canManageSales: currentUser.role === 'admin' || currentUser.role === 'manager',
    canManageUsers: currentUser.role === 'admin',
  };

  const canManageExpenses = currentUser.role === 'admin' || !!userPerms.canManageExpenses;
  const canManageMortalities = currentUser.role === 'admin' || !!userPerms.canManageMortalities;
  const canManageSales = currentUser.role === 'admin' || !!userPerms.canManageSales;
  const canUpdateExchangeRate = currentUser.role === 'admin';

  // حساب عمر الفوج الحالي باليوم
  const calculateFlockAge = (startDateStr: string, endDateStr?: string): number => {
    const start = new Date(startDateStr);
    const end = endDateStr ? new Date(endDateStr) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // تصدير كافة بيانات الفوج النشط إلى ملف CSV
  const handleExportCSV = () => {
    if (!activeCycle) return;
    
    let csvContent = "\ufeff"; // BOM for Excel UTF-8 support
    
    csvContent += "تقرير الدورة والتحليل المالي الموحد للدورة النشطة,نظام المداجن السورية الرقمية\n";
    csvContent += `اسم الفوج الحركي,${activeCycle.name}\n`;
    csvContent += `تاريخ بدء الدورة والاستقبال,${activeCycle.startDate}\n`;
    csvContent += `تعداد الصيصان الافتتاحي,${activeCycle.initialChicksCount} صوص\n`;
    csvContent += `سعر شراء الصوص الواحد,$${activeCycle.chickCostUSD}\n`;
    csvContent += `سعر صرف الدولار عند البدء,${activeCycle.exchangeRateAtStart} ل.س\n`;
    csvContent += `العمر الفعلي للفوج من يوم البدء,${calculateFlockAge(activeCycle.startDate, activeCycle.endDate)} يوم\n`;
    csvContent += `سعر صرف الدولار المعتمد لليوم,${currentExchangeRate} ل.س\n`;
    csvContent += `معدل وفيات الطيور (النفوق),${activeStats ? activeStats.mortalityRate.toFixed(2) : 0}%\n`;
    csvContent += `صافي الأرباح المقدرة بالليرة (SYP),${activeStats ? activeStats.netProfitSYP : 0}\n`;
    csvContent += `صافي الأرباح المقدرة بالدولار (USD),${activeStats ? activeStats.netProfitUSD : 0}\n\n`;

    // 1. المصاريف
    csvContent += "أولاً: سجل نفقات ومصاريف الدورة الحالية الحركية\n";
    csvContent += "معرف المصروف,التصنيف والنوع,البيان والتوضيح المالي,القيمة بالعملة الأصلية,العملة,سعر الصرف المعتمد,القيمة المكافئة بالدولار,القيمة المكافئة بالليرة,التاريخ\n";
    const cycleExpenses = expenses.filter(e => e.cycleId === activeCycle.id);
    const categoryNames: Record<string, string> = {
      prep: 'تجهيز وتعقيم',
      chicks: 'شراء صيصان',
      feed: 'أعلاف وتغذية',
      medicine: 'أدوية وتحصينات',
      fuel: 'مازوت وتدفئة',
      electricity: 'كهرباء ومياه',
      salaries: 'رواتب وأجور عمال',
      other: 'نفقات أخرى'
    };
    cycleExpenses.forEach(e => {
      let usdVal = e.amount;
      let sypVal = e.amount * e.exchangeRate;
      if (e.currency === 'SYP') {
        sypVal = e.amount;
        usdVal = e.amount / e.exchangeRate;
      }
      const catText = categoryNames[e.category] || e.category;
      csvContent += `"${e.id}","${catText}","${e.description.replace(/"/g, '""')}",${e.amount},"${e.currency}",${e.exchangeRate},${usdVal.toFixed(2)},${sypVal.toFixed(0)},"${e.date}"\n`;
    });
    csvContent += "\n";

    // 2. النفوق
    csvContent += "ثانياً: سجل الوفيات والنافق اليومي من الطيور\n";
    csvContent += "معرف النفوق,العدد النافق باليوم,التاريخ,الملاحظات الطبية أو الأسباب\n";
    const cycleMortalities = mortalities.filter(m => m.cycleId === activeCycle.id);
    cycleMortalities.forEach(m => {
      csvContent += `"${m.id}",${m.count},"${m.date}","${(m.reason || 'فرز طبيعي وعزل').replace(/"/g, '""')}"\n`;
    });
    csvContent += "\n";

    // 3. المبيعات
    csvContent += "ثالثاً: سجل مبيعات الفروج وتسويق اللحم الموجه للتجار\n";
    csvContent += "معرف الفاتورة,اسم المشتري/التاجر,العدد مباع,الوزن الإجمالي (كغ),سعر الكيلو (ل.س),سعر صرف الدولار الحالي,القيمة بالليرة السورية,القيمة المكافئة بالدولار,التاريخ\n";
    const cycleSales = sales.filter(s => s.cycleId === activeCycle.id);
    cycleSales.forEach(s => {
      const sumSYP = s.totalWeightKg * s.pricePerKgSYP;
      const sumUSD = sumSYP / s.exchangeRate;
      csvContent += `"${s.id}","${s.buyerName.replace(/"/g, '""')}",${s.chickenCount},${s.totalWeightKg},${s.pricePerKgSYP},${s.exchangeRate},${sumSYP.toFixed(0)},${sumUSD.toFixed(2)},"${s.date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_أرشيف_حسابات_فوج_${activeCycle.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. حسابات الدورة الحالية النشطة
  const activeStats = activeCycle
    ? calculateCycleStats(activeCycle, expenses, mortalities, sales, currentExchangeRate)
    : null;

  // 2. معالجة تحديث سعر الصرف يدويًا
  const handleExchangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(exchangeInput);
    if (rate > 0 && canUpdateExchangeRate) {
      onUpdateExchangeRate(rate);
    }
  };

  // 3. معالجة الإدخال السريع للمصروف
  const handleQuickExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !quickExpAmount || !quickExpDesc || !canManageExpenses) return;
    onAddExpense({
      cycleId: activeCycle.id,
      category: quickExpCategory as any,
      description: quickExpDesc,
      amount: Number(quickExpAmount),
      currency: quickExpCurrency,
      exchangeRate: currentExchangeRate,
      date: new Date().toISOString().split('T')[0]
    });
    setQuickExpAmount('');
    setQuickExpDesc('');
  };

  // 4. معالجة الإدخال السريع للوفيات
  const handleQuickMortality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !quickMortCount || !canManageMortalities) return;
    onAddMortality({
      cycleId: activeCycle.id,
      count: Number(quickMortCount),
      date: new Date().toISOString().split('T')[0],
      reason: quickMortReason.trim() || undefined
    });
    setQuickMortCount('');
    setQuickMortReason('');
  };

  // 5. معالجة الإدخال السريع للمبيع
  const handleQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle || !quickSaleCount || !quickSaleWeight || !quickSalePrice || !quickSaleBuyer || !canManageSales) return;

    if (activeStats && Number(quickSaleCount) > activeStats.currentCount) {
      alert(`العدد الحي المتاح حالياً هو ${activeStats.currentCount} دجاجة فقط. لا يمكنك بيع كمية أكبر!`);
      return;
    }

    onAddSale({
      cycleId: activeCycle.id,
      buyerName: quickSaleBuyer,
      chickenCount: Number(quickSaleCount),
      totalWeightKg: Number(quickSaleWeight),
      pricePerKgSYP: Number(quickSalePrice),
      exchangeRate: currentExchangeRate,
      date: new Date().toISOString().split('T')[0]
    });
    setQuickSaleCount('');
    setQuickSaleWeight('');
    setQuickSalePrice('');
    setQuickSaleBuyer('');
  };

  // 6. تجهيز البيانات للرسم البياني لمصاريف وتكاليف العلف والنفقات الأخرى
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#6366f1', '#ec4899', '#94a3b8'];
  
  const expenseChartData = activeStats && Object.entries(activeStats.expensesByCategoryUSD).map(([key, value]) => ({
    name: CATEGORY_LABELS[key as any]?.label || key,
    value: Math.round(value)
  })) || [];

  // وفيات الدورة الحالية تفصيلاً مع الزمن
  const activeCycleMortalities = activeCycle
    ? mortalities
        .filter(m => m.cycleId === activeCycle.id)
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const mortalityChartData = activeCycleMortalities.map(item => ({
    التاريخ: item.date.slice(5), // الشهر واليوم
    العدد: item.count
  }));

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-layout">
      {/* هيدر تتبع واستبدال سعر صرف العملات اليومية */}
      <div className="glass-card-dark text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6" id="exchange-rate-header">
        <div className="flex items-center gap-4 text-right">
          <div className="p-3 bg-white/5 border border-white/10 text-emerald-400 rounded-xl">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-md font-extrabold flex items-center gap-1.5">
              <span>نظام ضبط واستحقاق العملات المزدوجة</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-350 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">تحديث فوري</span>
            </h2>
            <p className="text-[11px] text-white/60 mt-1">
              سعر الصرف الحالي المدخل يؤثر تلقائياً على كل الحسابات الجارية: <strong className="text-emerald-300 font-mono">{formatSYP(currentExchangeRate)} / $1.00</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleExchangeSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <span className="absolute left-3 top-2.5 text-xs text-white/50 font-mono">للـ دولار</span>
            <input
              id="input-change-daily-rate"
              type="number"
              min="1"
              disabled={!canUpdateExchangeRate}
              value={exchangeInput}
              onChange={(e) => setExchangeInput(e.target.value)}
              className="w-full glass-input text-white rounded-xl pr-3 pl-16 py-2.5 text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>
          <button
            id="btn-update-exchange-rate"
            type="submit"
            disabled={!canUpdateExchangeRate}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed font-bold text-emerald-950 text-xs rounded-xl transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer border-0"
          >
            {canUpdateExchangeRate ? 'حفظ السعر اليومي' : 'عرض فقط'}
          </button>
        </form>
      </div>

      {/* لوحة مراقبة الأرباح والخسائر وصافى الأداء للدورة الحالية */}
      {activeCycle ? (
        <div className="space-y-6">

          {/* شريط الإجراءات المطور: تصدير البيانات إلى تنسيق CSV */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl glass-card border border-emerald-500/20" id="csv-export-strip">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping text-right" />
              <div className="text-right">
                <p className="text-xs font-bold text-white leading-none">الفوج النشط جاري التتبع الآن: <strong className="text-emerald-400 font-extrabold">{activeCycle.name}</strong></p>
                <p className="text-[10px] text-white/50 mt-1">تصدير كافة الحسابات، فواتير المصاريف، العقود، والأوزان المسوقة في تقرير واحد</p>
              </div>
            </div>
            <button
              id="btn-export-cycle-to-csv"
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 border-0 transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>تصدير ملف ومحاكاة CSV الفوري</span>
            </button>
          </div>

          {/* الجريد المالي الرئيسي: الربح vs الخسارة وصافي P&L */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. قسم الأرباح والإيرادات (Revenues) */}
            <div className="glass-card rounded-2xl p-6 border border-emerald-500/25 bg-emerald-500/5 text-right flex flex-col justify-between text-white animate-fade-in">
              <div>
                <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2.5 mb-3">
                  <span className="text-xs font-bold text-emerald-300">قسم الأرباح والإيرادات (الواردات المعتمدة)</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">قناة الإيراد</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-white/50">إجمالي عوائد مبيعات الفروج:</span>
                    <p className="text-2xl font-extrabold font-mono mt-0.5 text-emerald-300">
                      {activeStats ? formatUSD(activeStats.totalSalesUSD) : '$0.00'}
                    </p>
                    <p className="text-xs font-bold text-white/70 font-mono">
                      {activeStats ? formatSYP(activeStats.totalSalesSYP) : '0 ل.س'}
                    </p>
                  </div>
                  
                  <div className="p-2.5 bg-white/5 rounded-xl text-[11px] space-y-1 text-white/85">
                    <div className="flex justify-between">
                      <span className="text-white/60">إجمالي المباع الفعلي:</span>
                      <strong className="font-mono text-emerald-300">{activeStats?.totalSoldCount.toLocaleString('ar')} طير</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">إجمالي الأوزان المسوقة:</span>
                      <strong className="font-mono text-emerald-300">{activeStats?.totalSoldWeightKg.toLocaleString('ar')} كغ</strong>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-emerald-300/40 mt-3">* تزداد الإيرادات تلقائياً مع تدوين صفقات المبيعات وعقود الكيلو مع التجار.</p>
            </div>

            {/* 2. قسم التكاليف ومصادر الخسائر (Costs & Losses) */}
            <div className="glass-card rounded-2xl p-6 border border-red-500/25 bg-red-500/5 text-right flex flex-col justify-between text-white animate-fade-in">
              <div>
                <div className="flex items-center justify-between border-b border-red-500/10 pb-2.5 mb-3">
                  <span className="text-xs font-bold text-red-300">قسم التكاليف والمصاريف (الخسائر والمدفوعات)</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/25">مدفوعات الفوج</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-white/50">إجمالي كافة تكاليف ونفقات الدورة:</span>
                    <p className="text-2xl font-extrabold font-mono mt-0.5 text-red-450">
                      {activeStats ? formatUSD(activeStats.totalExpensesUSD) : '$0.00'}
                    </p>
                    <p className="text-xs font-bold text-white/70 font-mono">
                      {activeStats ? formatSYP(activeStats.totalExpensesSYP) : '0 ل.س'}
                    </p>
                  </div>

                  <div className="p-2.5 bg-white/5 rounded-xl text-[11px] space-y-1 text-white/85">
                    <div className="flex justify-between">
                      <span className="text-white/55">كلفة شراء الصيصان الأساسية:</span>
                      <strong className="font-mono text-red-300">{formatUSD(activeCycle.initialChicksCount * activeCycle.chickCostUSD)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/55">الفواتير والتشغيل المضاف:</span>
                      <strong className="font-mono text-red-300">
                        {activeStats ? formatUSD(Math.max(0, activeStats.totalExpensesUSD - (activeCycle.initialChicksCount * activeCycle.chickCostUSD))) : '$0.00'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-red-300/40 mt-3">* تشتمل النفقات على فاتورة شراء الصوص الأساسية مضافاً إليها فواتير الأعلاف والأدوية والتشغيل.</p>
            </div>

            {/* 3. كرت صافي الربح / الخسارة الفعلي الموحد (Net P&L) */}
            <div className={`rounded-2xl p-6 shadow-xl border text-right flex flex-col justify-between backdrop-blur-md ${
              activeStats && activeStats.netProfitUSD >= 0 
                ? 'bg-emerald-600/10 border-emerald-400/30' 
                : 'bg-red-600/15 border-red-500/30'
            } text-white animate-fade-in`}>
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                  <span className="text-xs font-extrabold text-white/90">صافي ربح / خسارة الدورة الحالية فوري</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${
                    activeStats && activeStats.netProfitUSD >= 0 
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-red-500/25 text-red-300 border border-red-500/30'
                  }`}>
                    {activeStats && activeStats.netProfitUSD >= 0 ? 'أرباح وصافي نمو إيجابي' : 'عجز وتكاليف تشغيلية زائدة'}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] text-white/60">حساب الأرباح الصافية العام:</span>
                  <p className="text-3xl font-black font-mono mt-1 text-white">
                    {activeStats && formatUSD(activeStats.netProfitUSD)}
                  </p>
                  <p className="text-sm font-bold text-emerald-350 font-mono mt-1">
                    {activeStats && formatSYP(activeStats.netProfitSYP)}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] text-white/60 leading-relaxed font-bold">
                  * صافي نواتج الإرباح يقال بمجموع المبيعات بالليرة مخصوماً منه كلفة استقبال الصيصان الأساسية وكل المصاريف الإجمالية.
                </p>
              </div>
            </div>
          </div>

          {/* الجريد المساعد: وفيات المجموعة، مبيعات اللحم، وعمر الفوج الحالي */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* وفيات المجموعة والنفوق */}
            <div className="glass-card rounded-2xl p-5 shadow-xl text-right flex flex-col justify-between text-white">
              <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-3">
                <span className="text-xs font-bold text-white/70">معدل ونسبة النفوق (الوفيات)</span>
                <Skull className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-extrabold font-mono text-red-500">
                  {activeStats ? `${activeStats.mortalityRate.toFixed(2)}%` : '0.00%'}
                </p>
                <span className="text-[10px] text-white/50">
                  ({activeStats?.totalMortality.toLocaleString('ar')} طير هالك)
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-3">
                <div 
                  className={`h-1.5 rounded-full ${activeStats && activeStats.mortalityRate >= 8 ? 'bg-red-500' : 'bg-emerald-400'}`} 
                  style={{ width: `${Math.min(100, activeStats?.mortalityRate || 0)}%` }} 
                />
              </div>
            </div>

            {/* الكميات المباعة المتبقية */}
            <div className="glass-card rounded-2xl p-5 shadow-xl text-right flex flex-col justify-between text-white">
              <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-3">
                <span className="text-xs font-bold text-white/70">ملخص الكميات الحية واللحم المسوق</span>
                <Scale className="w-4 h-4 text-sky-400" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xl font-extrabold font-mono text-sky-400 leading-none">
                    {activeStats ? `${activeStats.totalSoldWeightKg.toLocaleString('ar')} كغ` : '0 كغ'}
                  </p>
                  <p className="text-[10px] text-white/50 mt-1">المباع: {activeStats?.totalSoldCount.toLocaleString('ar')} فروج</p>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-300">
                  <span>المتبقي: </span>
                  <span className="font-mono text-white text-xs">{activeStats?.currentCount.toLocaleString('ar')} طير</span>
                </div>
              </div>
            </div>

            {/* كرت عمر الفوج الحالي (عمر الصيصان) */}
            <div className="glass-card rounded-2xl p-5 shadow-xl text-right flex flex-col justify-between text-white animate-fade-in" id="flock-age-card">
              <div className="flex items-center justify-between border-b border-white/15 pb-2 mb-3">
                <span className="text-xs font-bold text-white/70">العمر الحالي لـلفوج (عمر الصيصان)</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-black font-mono text-emerald-400">
                    {calculateFlockAge(activeCycle.startDate, activeCycle.endDate)} <span className="text-xs font-bold font-sans">يوم</span>
                  </p>
                  <p className="text-[10px] text-white/50">الاستقبال: {activeCycle.startDate}</p>
                </div>
                <div className="text-left">
                  <span className={`text-[9px] font-extrabold px-1.5 py-1 rounded mt-0.5 max-w-fit font-mono ${
                    calculateFlockAge(activeCycle.startDate, activeCycle.endDate) <= 15 ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' :
                    calculateFlockAge(activeCycle.startDate, activeCycle.endDate) <= 35 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  }`}>
                    {calculateFlockAge(activeCycle.startDate, activeCycle.endDate) <= 15 ? 'مرحلة الحضانة الأولى' :
                     calculateFlockAge(activeCycle.startDate, activeCycle.endDate) <= 35 ? 'مرحلة التسمين النشط' :
                     'مرحلة التسويق النهائي'}
                  </span>
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
                <div 
                  className="h-1.5 rounded-full bg-emerald-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, (calculateFlockAge(activeCycle.startDate, activeCycle.endDate) / 45) * 100)}%` }}
                  title="النسبة المنقضية من أيام الفوج التقريبية المعيارية (45 يوم)"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 backdrop-blur-md bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center text-amber-200 text-xs">
          عذراً، لا توجد <strong>دورة محاسبية مفعلة حالياً</strong> لعرض ملخصاتها المالية. يرجى التوجه لعلامة تبويب <strong className="underline decoration-emerald-450">"إدارة الدورات"</strong> لافتتاح وجبة دواجن جديدة.
        </div>
      )}

      {/* الرسوم والمخططات البيانية (وفيات الطيور ومصاريف الأعلاف) */}
      {activeCycle && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* مخطط الوفيات والنفوق اليومي */}
          <div className="glass-card rounded-2xl p-6 shadow-xl text-right">
            <h3 className="text-xs font-extrabold text-emerald-300 mb-4 flex items-center gap-2 justify-start">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span>رصد وتتبع منحنى النفوق والوفيات اليومي</span>
            </h3>

            {activeCycleMortalities.length > 0 ? (
              <div className="h-[210px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mortalityChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="التاريخ" fontSize={10} stroke="rgba(255,255,255,0.4)" />
                    <YAxis fontSize={10} stroke="rgba(255,255,255,0.4)" />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                    <Line type="monotone" dataKey="العدد" name="النافق اليومي" stroke="#f87171" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[210px] flex items-center justify-center text-xs text-white/40 bg-white/5 border border-white/5 rounded-xl">
                لا توجد تقارير نفوق كافية مسجلة بعد لهذه الدورة.
              </div>
            )}
          </div>

          {/* تحليل التكاليف وتكاليف الأعلاف */}
          <div className="glass-card rounded-2xl p-6 shadow-xl text-right">
            <h3 className="text-xs font-extrabold text-emerald-300 mb-4 flex items-center gap-2 justify-start">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>مصفوفة توزيع التكاليف الإجمالية ومصروف العلف ($)</span>
            </h3>

            {expenseChartData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-2 h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="name" fontSize={9} stroke="rgba(255,255,255,0.4)" />
                      <YAxis fontSize={10} stroke="rgba(255,255,255,0.4)" />
                      <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px', backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
                      <Bar dataKey="value" name="القيمة التقديرية" fill="#34d399" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar">
                  {expenseChartData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-white/70 font-bold">{item.name}</span>
                      </div>
                      <span className="font-mono text-emerald-300 font-extrabold">{formatUSD(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[210px] flex items-center justify-center text-xs text-white/40 bg-white/5 border border-white/5 rounded-xl">
                لا توجد تكاليف مسجلة غير القيمة الأساسية لشراء الصوص.
              </div>
            )}
          </div>
        </div>
      )}

      {/* لوحة التحكم وركن الإدخال فائق السرعة والمبسط (Quick Entry UI) للداشبورد */}
      {activeCycle && (
        <div className="glass-card rounded-2xl p-6 shadow-xl text-right" id="quick-entry-section">
          {currentUser.role === 'viewer' && (
            <div className="mb-4 p-3.5 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-200 flex items-center gap-2">
              <span>⚠️ وضع العرض والقراءة فقط: نعتذر، لا يمكنك استخدام ميزة الإدخال السريع أو التعديل من دون تسجيل الدخول بحساب مدخر له صلاحيات كافية.</span>
            </div>
          )}
          
          <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>ركن الإدخال فائق السرعة والمبسط</span>
            </h3>
            
            <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5" id="quick-entry-tabs">
              <button
                id="btn-quick-tab-expense"
                type="button"
                onClick={() => setActiveQuickTab('expense')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeQuickTab === 'expense' ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                مصروف / فاتورة
              </button>
              <button
                id="btn-quick-tab-mortality"
                type="button"
                onClick={() => setActiveQuickTab('mortality')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeQuickTab === 'mortality' ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                حالات نفوق
              </button>
              <button
                id="btn-quick-tab-sale"
                type="button"
                onClick={() => setActiveQuickTab('sale')}
                className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  activeQuickTab === 'sale' ? 'bg-emerald-500 text-emerald-950 shadow-md' : 'text-white/60 hover:text-white'
                }`}
              >
                حركة مبيعات
              </button>
            </div>
          </div>

          {/* محتويات ركن الإدخال السريع */}
          <div className="p-2">
            {activeQuickTab === 'expense' && (
              <form onSubmit={handleQuickExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">نوع ومكان الصرف</label>
                  <select
                    id="quick-exp-category"
                    value={quickExpCategory}
                    onChange={(e) => setQuickExpCategory(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5 transition-all font-medium"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                      <option key={key} value={key} className="bg-slate-900 text-white">{item.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">البيان المالي</label>
                  <input
                    id="quick-exp-desc"
                    type="text"
                    required
                    placeholder="مثال: فاتورة كهرباء العنبر رقم 2"
                    value={quickExpDesc}
                    onChange={(e) => setQuickExpDesc(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">القيمة</label>
                    <input
                      id="quick-exp-amount"
                      type="number"
                      required
                      min="1"
                      placeholder="المبلغ"
                      value={quickExpAmount}
                      onChange={(e) => setQuickExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">العملة</label>
                    <select
                      id="quick-exp-currency"
                      value={quickExpCurrency}
                      onChange={(e) => setQuickExpCurrency(e.target.value as any)}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2 py-2.5 text-center"
                    >
                      <option value="USD" className="bg-slate-900 text-white">دولار ($)</option>
                      <option value="SYP" className="bg-slate-900 text-white">ل.س</option>
                    </select>
                  </div>
                </div>
                <button
                  id="btn-quick-submit-expense"
                  type="submit"
                  disabled={!canManageExpenses}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed text-emerald-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 border-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>تثبيت الفاتورة الحالية</span>
                </button>
              </form>
            )}

            {activeQuickTab === 'mortality' && (
              <form onSubmit={handleQuickMortality} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">عدد الدجاج النافق اليوم</label>
                  <input
                    id="quick-mort-count"
                    type="number"
                    required
                    min="1"
                    placeholder="رقم مرئي"
                    value={quickMortCount}
                    onChange={(e) => setQuickMortCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">السبب أو ملاحظات الطبيب</label>
                  <input
                    id="quick-mort-reason"
                    type="text"
                    placeholder="مثال: حالات فرز طبيعية"
                    value={quickMortReason}
                    onChange={(e) => setQuickMortReason(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5"
                  />
                </div>
                <button
                  id="btn-quick-submit-mortality"
                  type="submit"
                  disabled={!canManageMortalities}
                  className="w-full bg-red-500 hover:bg-red-400 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-lg shadow-red-500/25 border-0"
                >
                  <Skull className="w-3.5 h-3.5" />
                  <span>رصد وفيات اليوم</span>
                </button>
              </form>
            )}

            {activeQuickTab === 'sale' && (
              <form onSubmit={handleQuickSale} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">اسم المشتري</label>
                  <input
                    id="quick-sale-buyer"
                    type="text"
                    required
                    placeholder="التاجر الحلبي"
                    value={quickSaleBuyer}
                    onChange={(e) => setQuickSaleBuyer(e.target.value)}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2.5 py-2.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 col-span-2">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">العدد مباع</label>
                    <input
                      id="quick-sale-count"
                      type="number"
                      required
                      min="1"
                      placeholder="طير"
                      value={quickSaleCount}
                      onChange={(e) => setQuickSaleCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2 py-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-300 mb-1">الوزن كغ</label>
                    <input
                      id="quick-sale-weight"
                      type="number"
                      required
                      min="1"
                      placeholder="كغ"
                      value={quickSaleWeight}
                      onChange={(e) => setQuickSaleWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2 py-2.5 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-300 mb-1">سعر الكيلو (ل.س)</label>
                  <input
                    id="quick-sale-price"
                    type="number"
                    required
                    min="1"
                    placeholder="مثال: 28000"
                    value={quickSalePrice}
                    onChange={(e) => setQuickSalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full text-xs glass-input focus:ring-1 focus:ring-emerald-400 rounded-xl px-2 py-2.5 font-mono text-center"
                  />
                </div>
                <button
                  id="btn-quick-submit-sale"
                  type="submit"
                  disabled={!canManageSales}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed text-emerald-950 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 border-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>تثبيت المبيع السريع</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
