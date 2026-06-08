/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cycle, Expense, Mortality, Sale, FarmStorage, AppUser } from './types';
import Dashboard from './components/Dashboard';
import CycleManager from './components/CycleManager';
import ExpenseTracker from './components/ExpenseTracker';
import MortalityTracker from './components/MortalityTracker';
import SalesTracker from './components/SalesTracker';
import SchemaViewer from './components/SchemaViewer';
import Login from './components/Login';
import UserManager from './components/UserManager';
import { calculateCycleStats, formatSYP, formatUSD } from './utils';
import { 
  LayoutDashboard, 
  Layers, 
  Receipt, 
  Skull, 
  ShoppingCart, 
  Database, 
  TrendingUp, 
  RefreshCw,
  Users,
  LogOut,
  UserCheck,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cycles' | 'expenses' | 'mortalities' | 'sales' | 'users' | 'schema'>('dashboard');
  
  // الحالات العامة المسحوبة من قاعدة البيانات
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [mortalities, setMortalities] = useState<Mortality[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(14100);

  // نظام وضع الإضاءة / الوضع الداكن المطور
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('poultry_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('poultry_theme', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  // نظام التنبيهات والأصوات التفاعلية
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'alert' } | null>(null);

  const playNotificationSound = (type: 'success' | 'alert') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'success') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        
        // Uplifting upward chord
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
        
        osc2.frequency.setValueAtTime(1046.50, now); // C6
        
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);
      } else {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.35);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch (err) {
      console.warn('AudioContext prevented from initialising or in iframe restricts:', err);
    }
  };

  const triggerNotification = (message: string, type: 'success' | 'alert' = 'success') => {
    setNotification({ message, type });
    playNotificationSound(type);
    
    // Auto-clear notification toast after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };
  
  // حالات إدارة المستخدمين والمصادقة
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // دالة متطورة لسحب وتأمين كافة بيانات المدجنة من المخدم بلغة واحدة
  const refreshDatabaseData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/all_data');
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
        setExpenses(data.expenses || []);
        setMortalities(data.mortalities || []);
        setSales(data.sales || []);
        setExchangeRate(data.exchangeRate || 14100);
        setUsers(data.users || []);

        // تشغيل التذكر التلقائي عند تحديث الصفحة لدقة تجربة المستخدم
        const savedId = localStorage.getItem('remembered_user_id');
        if (savedId) {
          const matched = (data.users as AppUser[]).find(u => u.id === savedId);
          if (matched) {
            setCurrentUser(matched);
          }
        }
      }
    } catch (e) {
      console.error('[App] Failed to fetch data from Express/MySQL API: ', e);
    } finally {
      setLoading(false);
    }
  };

  // التحميل الأولي من السيرفر بمجرد إقلاع الواجهة
  useEffect(() => {
    refreshDatabaseData();
  }, []);

  // دالة التنبؤ والتحقق الفوري من صلاحية المستخدم الجاري لقنوات الملاحة والعمليات
  const hasPermission = (tab: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true; // المدير العام يتخطى كافة الصمامات

    const p = currentUser.permissions || {
      canManageCycles: currentUser.role === 'manager',
      canManageExpenses: currentUser.role === 'manager',
      canManageMortalities: true,
      canManageSales: currentUser.role === 'manager',
      canManageUsers: false,
    };

    switch (tab) {
      case 'cycles': return !!p.canManageCycles;
      case 'expenses': return !!p.canManageExpenses;
      case 'mortalities': return !!p.canManageMortalities;
      case 'sales': return !!p.canManageSales;
      case 'users': return !!p.canManageUsers;
      case 'schema': return currentUser.role === 'admin';
      default: return true;
    }
  };

  // 4. دالات العمليات والمزامنة مع API الباك-إند

  // تحديث سعر الصرف العام لليوم بمزامنة SQL
  const handleUpdateExchangeRate = async (rate: number) => {
    if (currentUser?.role === 'viewer') return;
    try {
      setExchangeRate(rate); // تحديث متفائل سريع للواجهة
      triggerNotification('تم تحديث سعر الصرف اليومي بنجاح!', 'success');
      await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const activeCycle = cycles.find(c => c.status === 'active');

  const activeStats = activeCycle 
    ? calculateCycleStats(activeCycle, expenses, mortalities, sales, exchangeRate) 
    : null;

  // بدء دورة جديدة بمصادقة SQL
  const handleStartCycle = async (newCycleData: Omit<Cycle, 'id' | 'status'>) => {
    if (!hasPermission('cycles')) return;
    
    try {
      const parentCycleId = `cycle-${Date.now()}`;
      
      // إنشاء مصروف تلقائي لاستقبال الدفعة بقيمة كلفة الصيصان
      const initialChicksBill: Expense = {
        id: `exp-initial-chicks-${Date.now()}`,
        cycleId: parentCycleId,
        category: 'chicks',
        description: `فاتورة استقبال الفوج الأساسي: ${newCycleData.initialChicksCount.toLocaleString('ar')} صوص`,
        amount: newCycleData.initialChicksCount * newCycleData.chickCostUSD,
        currency: 'USD',
        exchangeRate: exchangeRate,
        date: newCycleData.startDate,
      };

      const newCycle: Cycle = {
        ...newCycleData,
        id: parentCycleId,
        status: 'active'
      };

      // تحديث الواجهة متفائلاً
      setCycles(prev => [newCycle, ...prev]);
      setExpenses(prev => [initialChicksBill, ...prev]);

      triggerNotification('تم بدء الدورة الإنتاجية واستيراد الصيصان بنجاح!', 'success');
      // الإرسال للسيرفر لحفظها بقاعدة بيانات MySQL
      await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCycle)
      });

      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initialChicksBill)
      });

      // إعادة تحميل آمنة للتأكد من المحاذاة
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // إغلاق وأرشفة الدورة المحاسبية التاريخ محدد مرن
  const handleCloseCycle = async (id: string, endDate: string) => {
    if (!hasPermission('cycles')) return;

    const matchedCycle = cycles.find(c => c.id === id);
    if (!matchedCycle) return;

    try {
      const updatedCycle: Cycle = {
        ...matchedCycle,
        status: 'closed',
        endDate: endDate
      };

      setCycles(prev => prev.map(c => c.id === id ? updatedCycle : c));
      triggerNotification('تم إنهاء وإغلاق الدورة المحاسبية الحركية وتجميدها بالأرشيف.', 'success');

      await fetch(`/api/cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCycle)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // تعديل بيانات الدورة النشطة الجارية كلياً
  const handleUpdateCycle = async (updatedCycle: Cycle) => {
    if (!hasPermission('cycles')) return;
    
    try {
      setCycles(prev => prev.map(c => c.id === updatedCycle.id ? updatedCycle : c));

      // تزامن وتعديل فاتورة استقبال الصوص المطابقة لدقة التكاليف
      const chicksBill = expenses.find(e => e.cycleId === updatedCycle.id && e.category === 'chicks' && e.id.startsWith('exp-initial-chicks-'));
      if (chicksBill) {
        const updatedBill = {
          ...chicksBill,
          description: `فاتورة استقبال الفوج الأساسي (محدث): ${updatedCycle.initialChicksCount.toLocaleString('ar')} صوص`,
          amount: updatedCycle.initialChicksCount * updatedCycle.chickCostUSD,
          date: updatedCycle.startDate
        };
        
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedBill)
        });
      }

      triggerNotification('تم تحديث بيانات ومؤشرات الدورة بنجاح.', 'success');
      await fetch(`/api/cycles/${updatedCycle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCycle)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // حذف وإلغاء الدورة النشطة بالكامل لتصبح إدارة الدورة فارغة
  const handleDeleteCycle = async (id: string) => {
    if (currentUser?.role !== 'admin') {
      alert('صلاحية مسح وأرشفة الدورة بالكامل محجوزة للمدير العام فقط.');
      return;
    }
    
    const doubleConfirm = window.confirm('تحذير نهائي: هل أنت متأكد من حذف الدورة النشطة الحالية بالكامل؟ سيتم مسح كافة المصاريف والنفوق والمبيعات المقترنة بها فوراً لتعود السجلات فارغة تماماً وافتتاح دورة مغايرة.');
    if (!doubleConfirm) return;

    try {
      setCycles(prev => prev.filter(c => c.id !== id));
      setExpenses(prev => prev.filter(e => e.cycleId !== id));
      setMortalities(prev => prev.filter(m => m.cycleId !== id));
      setSales(prev => prev.filter(s => s.cycleId !== id));

      triggerNotification('تم حذف الفوج بالكامل وكافة السجلات المرتبطة به.', 'alert');
      await fetch(`/api/cycles/${id}`, { method: 'DELETE' });
      setActiveTab('cycles');
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة مصروف جديد
  const handleAddExpense = async (newExp: Omit<Expense, 'id'>) => {
    if (!hasPermission('expenses')) return;

    try {
      const expense: Expense = {
        ...newExp,
        id: `exp-${Date.now()}`
      };
      setExpenses(prev => [expense, ...prev]);
      triggerNotification('تم رصد وتسجيل الفاتورة/المصروف بنجاح!', 'success');

      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // حذف مصروف
  const handleDeleteExpense = async (id: string) => {
    if (!hasPermission('expenses')) return;

    try {
      setExpenses(prev => prev.filter(e => e.id !== id));
      triggerNotification('تم حذف وإبطال المصروف المحدد من الفوج.', 'alert');
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة وفيات
  const handleAddMortality = async (newMort: Omit<Mortality, 'id'>) => {
    if (!hasPermission('mortalities')) return;

    try {
      const mortality: Mortality = {
        ...newMort,
        id: `mort-${Date.now()}`
      };
      setMortalities(prev => [mortality, ...prev]);
      triggerNotification('تم قيد وفيات الطيور اليومية في السجلات الحيوية للفوج.', 'success');

      await fetch('/api/mortalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mortality)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // حذف وفيات
  const handleDeleteMortality = async (id: string) => {
    if (!hasPermission('mortalities')) return;

    try {
      setMortalities(prev => prev.filter(m => m.id !== id));
      triggerNotification('تم مسح قيد النفوق المحدد وإعادة الطيور للحيازة.', 'alert');
      await fetch(`/api/mortalities/${id}`, { method: 'DELETE' });
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // إضافة مبيعات
  const handleAddSale = async (newSale: Omit<Sale, 'id'>) => {
    if (!hasPermission('sales')) return;

    try {
      const sale: Sale = {
        ...newSale,
        id: `sale-${Date.now()}`
      };
      setSales(prev => [sale, ...prev]);
      triggerNotification('تم تثبيت صفقة بيع وتسويق الفروج بنجاح الميزان!', 'success');

      await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // حذف مبيعات
  const handleDeleteSale = async (id: string) => {
    if (!hasPermission('sales')) return;

    try {
      setSales(prev => prev.filter(s => s.id !== id));
      triggerNotification('تم إلغاء وشطب عقد مبيعات الفروج المحدد.', 'alert');
      await fetch(`/api/sales/${id}`, { method: 'DELETE' });
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // إدارة الموظفين والمستخدمين وإسناد صلاحيات دقيقة
  const handleAddUser = async (newUserData: Omit<AppUser, 'id'>) => {
    if (!hasPermission('users')) return;

    try {
      const newUser: AppUser = {
        ...newUserData,
        id: `usr-${Date.now()}`
      };
      setUsers(prev => [...prev, newUser]);

      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUser = async (updated: AppUser) => {
    if (!hasPermission('users')) return;

    try {
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      if (currentUser && currentUser.id === updated.id) {
        setCurrentUser(updated); // التحديث الشخصي السريع للمشاهد الحالي
      }

      await fetch(`/api/users/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!hasPermission('users')) return;

    try {
      setUsers(prev => prev.filter(u => u.id !== id));
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      refreshDatabaseData();
    } catch (err) {
      console.error(err);
    }
  };

  // تسجيل الدخول مع خيار تذكّر الجلسة ومقاومة الإنعاش
  const handleLogin = (user: AppUser, rememberMe: boolean) => {
    setCurrentUser(user);
    if (rememberMe) {
      localStorage.setItem('remembered_user_id', user.id);
    } else {
      localStorage.removeItem('remembered_user_id');
    }
  };

  // تسجيل الخروج ونفض الذاكرة المؤقتة
  const handleLogout = () => {
    localStorage.removeItem('remembered_user_id');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // حلقة اللولب الدوارة أثناء الإنعاش الأولي والاتصال بالقاعدة لأول مرة
  if (loading && !currentUser) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
        <p className="text-xs text-white/70 font-bold">جاري المزامنة مع مخدم دواجن سورية الرقميّ الآمن...</p>
      </div>
    );
  }

  // بوابة تسجيل الدخول الحذرة لحماية الدفاتر المالية والنفوق
  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div dir="rtl" className={`min-h-screen font-sans antialiased pb-12 transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white' 
        : 'bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 text-slate-800'
    }`}>
      
      {/* نظام التنبيهات المنبثقة التفاعلية */}
      {notification && (
        <div className={`fixed top-4 left-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in pointer-events-auto border transition-all duration-300 max-w-sm ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300 animate-slide-in' 
            : 'bg-red-950/90 border-red-500/40 text-red-350 animate-slide-in'
        }`}>
          <div className={`p-2 rounded-lg ${notification.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {notification.type === 'success' ? (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500 font-bold" />
            )}
          </div>
          <div className="text-right">
            <h4 className="text-xs font-bold font-sans text-white">تنبيه النظام الفوري</h4>
            <p className="text-[11px] opacity-90 mt-0.5">{notification.message}</p>
          </div>
        </div>
      )}
      
      {/* هيدر تطبيق الدواجن الذكية المطور */}
      <header className="sticky top-0 z-45 backdrop-blur-md bg-slate-950/50 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          
          {/* لوغو واسم النظام */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-emerald-950 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">نظــام الـدواجن الرقميَّـة</h1>
              <p className="text-[10px] text-emerald-350 font-bold tracking-wide opacity-90">التحكم الدقيق وصلاحيات الفواتير والنفوق والمبيعات</p>
            </div>
          </div>

          {/* البانر السريع الجاري للأرباح */}
          <div className="hidden lg:flex items-center gap-6">
            {activeCycle ? (
              <div className="text-right text-xs">
                <span className="text-white/40 block text-[9px] font-bold">الفوج الجاري حالياً:</span>
                <span className="text-emerald-400 font-extrabold">{activeCycle.name}</span>
              </div>
            ) : (
              <span className="text-xs font-bold text-white/35">المدجنة معقمة ومستعدة (لا دورة نشطة)</span>
            )}

            <div className="h-6 w-[1px] bg-white/10" />

            <div className="text-right text-xs font-mono">
              <span className="text-white/40 block text-[9px] font-bold">مؤشر الدولار اليومي:</span>
              <span className="text-emerald-300 font-extrabold">{formatSYP(exchangeRate)}</span>
            </div>
          </div>

          {/* الملف الشخصي والموظف والجلسة الحالية */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right justify-center">
              <span className="text-[11px] font-bold text-white leading-tight">{currentUser.fullName}</span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 max-w-fit font-mono ${
                currentUser.role === 'admin' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                currentUser.role === 'manager' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                'bg-purple-500/10 text-purple-300 border border-purple-500/20'
              }`}>
                {currentUser.role === 'admin' ? 'مدير عام الـنظام' :
                 currentUser.role === 'manager' ? 'مشرف فني' : 'حساب مشاهد فقط'}
              </span>
            </div>

            {/* زر تبديل الوضع الداكن والوضع الفاتح المطور */}
            <button
              id="btn-app-theme-toggle"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all cursor-pointer shadow flex items-center justify-center.5"
              title={theme === 'dark' ? "التبديل للمظهر المضيء" : "التبديل للمظهر الداكن"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-750" />
              )}
            </button>

            <div className="h-7 w-[1px] bg-white/10" />

            <button
              id="btn-app-logout"
              onClick={handleLogout}
              className="p-2 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-550 text-white/70 hover:text-red-400 rounded-xl transition-all cursor-pointer shadow"
              title="تسجيل الخروج المباشر والتبديل كفريق"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* شريط الأقسام والتبويبات الملاحة بدقة عالية (مرتبط بالصلاحيات الدقيقة) */}
      <nav className="backdrop-blur-md bg-slate-900/40 border-b border-white/10 sticky top-[73.5px] z-30 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-2 no-scrollbar">
            
            <button
              id="nav-tab-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التجارة والتحكم</span>
            </button>

            {hasPermission('cycles') && (
              <button
                id="nav-tab-cycles"
                onClick={() => setActiveTab('cycles')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'cycles'
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>إدارة الدورات والأرشفة</span>
              </button>
            )}

            {hasPermission('expenses') && (
              <button
                id="nav-tab-expenses"
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>فواتير المصاريف والنفقات</span>
              </button>
            )}

            {hasPermission('mortalities') && (
              <button
                id="nav-tab-mortalities"
                onClick={() => setActiveTab('mortalities')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'mortalities'
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Skull className="w-4 h-4" />
                <span>رصد وفيات الدواجن (النفوق)</span>
              </button>
            )}

            {hasPermission('sales') && (
              <button
                id="nav-tab-sales"
                onClick={() => setActiveTab('sales')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'sales'
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>تسويق وعقود مبيعات اللحم</span>
              </button>
            )}

            {hasPermission('users') && (
              <button
                id="nav-tab-users"
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>فريق العمل والصلاحيات</span>
              </button>
            )}

            <div className="h-6 w-[1px] bg-white/10 self-center mx-2 shrink-0" />

            <button
              id="nav-tab-schema"
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-indigo-300 hover:text-indigo-100 hover:bg-white/10'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>هيكلية الجداول</span>
            </button>

          </div>
        </div>
      </nav>

      {/* المحتوى الرئيسي المتغير للدورة */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* التنبيهات الصحية الهامة للفريق */}
        {activeStats && activeStats.mortalityRate >= 8 && (
          <div className="mb-6 p-4 backdrop-blur-md bg-red-900/30 border border-red-500/30 rounded-2xl flex items-center justify-between text-right leading-relaxed text-red-100 text-xs shadow-xl shadow-red-950/20">
            <div className="flex items-center gap-3">
              <Skull className="w-5 h-5 text-red-400 shrink-0" />
              <p>
                <strong>تنبیه طبي طارئ:</strong> تجاوزت نسبة وفيات الدواجن لهذه الدورة <strong className="font-mono text-base">{activeStats.mortalityRate.toFixed(2)}%</strong>. يرجى تتبع منحنى المراقبة ورابط طبيب المشخص الوقائي وتأكيد معايير العزل والتهوية!
              </p>
            </div>
          </div>
        )}

        {/* عرض التبويبات والمكونات المطابقة للصلاحيات المفروضة حالياً */}
        <div className="transition-all duration-200">
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              activeCycle={activeCycle}
              expenses={expenses}
              mortalities={mortalities}
              sales={sales}
              currentExchangeRate={exchangeRate}
              currentUser={currentUser}
              onUpdateExchangeRate={handleUpdateExchangeRate}
              onAddExpense={handleAddExpense}
              onAddMortality={handleAddMortality}
              onAddSale={handleAddSale}
            />
          )}

          {activeTab === 'cycles' && hasPermission('cycles') && (
            <CycleManager 
              cycles={cycles}
              expenses={expenses}
              mortalities={mortalities}
              sales={sales}
              currentExchangeRate={exchangeRate}
              currentUserRole={currentUser.role}
              onStartCycle={handleStartCycle}
              onCloseCycle={handleCloseCycle}
              onUpdateCycle={handleUpdateCycle}
              onDeleteCycle={handleDeleteCycle}
            />
          )}

          {activeTab === 'expenses' && hasPermission('expenses') && (
            <ExpenseTracker 
              activeCycle={activeCycle}
              expenses={expenses}
              currentExchangeRate={exchangeRate}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'mortalities' && hasPermission('mortalities') && (
            <MortalityTracker 
              activeCycle={activeCycle}
              mortalities={mortalities}
              onAddMortality={handleAddMortality}
              onDeleteMortality={handleDeleteMortality}
            />
          )}

          {activeTab === 'sales' && hasPermission('sales') && (
            <SalesTracker 
              activeCycle={activeCycle}
              sales={sales}
              currentExchangeRate={exchangeRate}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              currentLiveBirds={activeStats ? activeStats.currentCount : 0}
            />
          )}

          {activeTab === 'users' && hasPermission('users') && (
            <UserManager 
              users={users}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
            />
          )}

          {activeTab === 'schema' && (
            <SchemaViewer />
          )}
        </div>
      </main>

      {/* فوتر التطبيق */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/5 text-center text-[11px] text-white/30 flex flex-col sm:flex-row justify-between gap-4 items-center">
        <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - محمد القاطع</p>
        <p className="font-mono opacity-80">v3.0 نسخة محسنة الاصدار</p>
      </footer>

    </div>
  );
}
