/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// هيكلية قاعدة البيانات لنظام محاسبة وإدارة مدجنة الدواجن

export type ExpenseCategory = 
  | 'prep'         // تجهيز وتطهير
  | 'chicks'       // شراء صوص
  | 'feed'         // استهلاك علف
  | 'medicine'     // أدوية ولقاحات
  | 'fuel'         // مازوت وتدفئة
  | 'electricity'  // كهرباء ومياه
  | 'salaries'     // أجور عمال
  | 'other';       // نفقات أخرى

export interface Cycle {
  id: string;
  name: string;                // اسم الدورة (مثال: دورة ربيع 2026)
  status: 'active' | 'closed'; // حالة الدورة
  startDate: string;           // تاريخ البدء
  endDate?: string;            // تاريخ الإغلاق والأرشفة
  initialChicksCount: number;  // عدد الصيصان المستلمة في البداية
  chickCostUSD: number;        // تكلفة الصوص الواحد بالدولار
  exchangeRateAtStart: number; // سعر الصرف عند بدء الدورة (دولار مقابل ليرة)
  feedPricePerTonUSD: number;  // تكلفة طن العلف التقديرية بالدولار
  notes?: string;
}

export interface Expense {
  id: string;
  cycleId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;             // القيمة الأصلية للعملية
  currency: 'USD' | 'SYP';    // عملة الإدخال الأصلية
  exchangeRate: number;       // سعر الصرف المعتمد لحظة كتابة الفاتورة
  date: string;               // تاريخ الصرف
}

export interface Mortality {
  id: string;
  cycleId: string;
  count: number;              // عدد الطيور النافقة في هذا اليوم
  date: string;               // تاريخ اليوم
  reason?: string;            // السبب المتوقع (مثال: حرارة، مرض، إلخ)
}

export interface Sale {
  id: string;
  cycleId: string;
  buyerName: string;          // اسم المشتري / التاجر
  chickenCount: number;       // عدد الدجاج المباع
  totalWeightKg: number;      // الوزن الكلي بالكيلوغرام
  pricePerKgSYP: number;      // سعر الكيلو بالليرة السورية (البيع بالليرة حسب تقلبات السوق)
  exchangeRate: number;       // سعر الصرف المعتمد في يوم البيع لتحويل القيمة للدولار
  date: string;               // تاريخ حركة البيع
}

export interface DailyExchangeRate {
  rate: number;               // سعر صرف دولار واحد بالليرة السورية (مثال: 15000)
  lastUpdated: string;
}

export interface UserPermissions {
  canManageCycles: boolean;      // إدارة الدورات والأرصفة
  canManageExpenses: boolean;    // فواتير المصاريف والنفقات
  canManageMortalities: boolean; // رصد وفيات الدواجن والنفوق
  canManageSales: boolean;       // تسويق وعقود مبيعات اللحم
  canManageUsers: boolean;       // فريق العمل والصلاحيات
}

// هيكل الحالة المخزنة محلياً لنظام المدجنة
export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  password?: string;
  role: 'admin' | 'manager' | 'viewer'; // الصلاحيات الافتراضية
  permissions?: UserPermissions;       // الصلاحيات الدقيقة المخصصة
}

export interface FarmStorage {
  cycles: Cycle[];
  expenses: Expense[];
  mortalities: Mortality[];
  sales: Sale[];
  exchangeRate: number; // سعر الصرف الحالي المدخل يدوياً لليوم
  users?: AppUser[];
}
