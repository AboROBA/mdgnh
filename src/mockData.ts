/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Expense, Mortality, Sale } from './types';

// سعر صرف اليوم الافتراضي
export const DEFAULT_EXCHANGE_RATE = 15200; // 15,200 ل.س مقابل الدولار

// 1. الدورات (الدورة المغلقة السابقة والدورة النشطة الحالية)
export const mockCycles: Cycle[] = [
  {
    id: 'cycle-1-winter',
    name: 'الدورة الأولى (الشتوية المكتملة 2026)',
    status: 'closed',
    startDate: '2026-01-05',
    endDate: '2026-02-18', // 44 يوماً
    initialChicksCount: 5000,
    chickCostUSD: 0.75,
    exchangeRateAtStart: 14800,
    feedPricePerTonUSD: 520,
    notes: 'تمت الدورة بنجاح وتجاوز معدل الأوزان العام 2.2 كغ مع التدفئة بالمازوت بشكل كافٍ.'
  },
  {
    id: 'cycle-2-spring',
    name: 'الدورة الثانية (الربيعية النشطة الحالية)',
    status: 'active',
    startDate: '2026-05-10', // مستمرة منذ حوالي 24 يوماً (بافتراض التاريخ الحالي يونيو 2026)
    initialChicksCount: 6000,
    chickCostUSD: 0.80,
    exchangeRateAtStart: 15150,
    feedPricePerTonUSD: 540,
    notes: 'الدورة الربيعية تسير بشكل ممتاز بمعدلات استهلاك مستقرة وتحصينات جيدة.'
  }
];

// 2. سجل النفوق اليومي
export const mockMortalities: Mortality[] = [
  // وفيات الدورة الأولى (المكتملة) - مجموع 212 نافق (معدل ممتاز حوالي 4.2%)
  { id: 'm-1-1', cycleId: 'cycle-1-winter', count: 18, date: '2026-01-06', reason: 'نفق طبيعي بالاستقبال' },
  { id: 'm-1-2', cycleId: 'cycle-1-winter', count: 12, date: '2026-01-07', reason: 'سحق وازدحام' },
  { id: 'm-1-3', cycleId: 'cycle-1-winter', count: 8, date: '2026-01-10', reason: 'طبيعي' },
  { id: 'm-1-4', cycleId: 'cycle-1-winter', count: 15, date: '2026-01-15', reason: 'انقطاع تدفئة مؤقت' },
  { id: 'm-1-5', cycleId: 'cycle-1-winter', count: 22, date: '2026-01-20', reason: 'تفاوت درجات الحرارة' },
  { id: 'm-1-6', cycleId: 'cycle-1-winter', count: 35, date: '2026-01-30', reason: 'عرج وخمول' },
  { id: 'm-1-7', cycleId: 'cycle-1-winter', count: 42, date: '2026-02-05', reason: 'مشاكل تنفسية طفيفة' },
  { id: 'm-1-8', cycleId: 'cycle-1-winter', count: 30, date: '2026-02-12', reason: 'فرز طبيعي قبل البيع' },
  { id: 'm-1-9', cycleId: 'cycle-1-winter', count: 30, date: '2026-02-17', reason: 'فرز نهائي' },

  // وفيات الدورة الثانية (الحرجة النشطة) - اليوم 1 إلى اليوم 24
  { id: 'm-2-1', cycleId: 'cycle-2-spring', count: 24, date: '2026-05-11', reason: 'إجهاد النقل والشحن' },
  { id: 'm-2-2', cycleId: 'cycle-2-spring', count: 15, date: '2026-05-12', reason: 'إجهاد حراري بالاستقبال' },
  { id: 'm-2-3', cycleId: 'cycle-2-spring', count: 9, date: '2026-05-14', reason: 'طبيعي' },
  { id: 'm-2-4', cycleId: 'cycle-2-spring', count: 11, date: '2026-05-17', reason: 'انخفاض رطوبة' },
  { id: 'm-2-5', cycleId: 'cycle-2-spring', count: 6, date: '2026-05-20', reason: 'سحق وازدحام' },
  { id: 'm-2-6', cycleId: 'cycle-2-spring', count: 14, date: '2026-05-25', reason: 'خمول طبيعي' },
  { id: 'm-2-7', cycleId: 'cycle-2-spring', count: 18, date: '2026-05-28', reason: 'برودة ليلية' },
  { id: 'm-2-8', cycleId: 'cycle-2-spring', count: 12, date: '2026-06-01', reason: 'طبيعي' }
];

// 3. نفقات ومصاريف المدجنة
export const mockExpenses: Expense[] = [
  // مصاريف وتكاليف الدورة الأولى (المكتملة)
  {
    id: 'exp-1-prep-1',
    cycleId: 'cycle-1-winter',
    category: 'prep',
    description: 'تعقيم وتنظيف العنبر بمادة الفورمالين مع فرش شيد تبن ونشارة خشب',
    amount: 1200000,
    currency: 'SYP',
    exchangeRate: 14800,
    date: '2026-01-02'
  },
  {
    id: 'exp-1-prep-2',
    cycleId: 'cycle-1-winter',
    category: 'prep',
    description: 'صيانة خطوط المياه والمناهل الكهربائية مع شبكة الحلمات والشفاطات',
    amount: 350,
    currency: 'USD',
    exchangeRate: 14800,
    date: '2026-01-03'
  },
  {
    id: 'exp-1-feed-1',
    cycleId: 'cycle-1-winter',
    category: 'feed',
    description: 'شراء علف بادئ سوبر (وزن 5 طن مجهز)',
    amount: 2750,
    currency: 'USD',
    exchangeRate: 14800,
    date: '2026-01-05'
  },
  {
    id: 'exp-1-med-1',
    cycleId: 'cycle-1-winter',
    category: 'medicine',
    description: 'أدوية وفيتامينات الاستقبال والتحصينات الأولى ضد النيوكاسل والبرونشيت',
    amount: 320,
    currency: 'USD',
    exchangeRate: 14850,
    date: '2026-01-08'
  },
  {
    id: 'exp-1-fuel-1',
    cycleId: 'cycle-1-winter',
    category: 'fuel',
    description: 'تأمين مازوت تدفئة لعنابر الحضانة (شراء 1500 لتر بسعر الصرف الحالي)',
    amount: 18500000, // بالليرة السورية
    currency: 'SYP',
    exchangeRate: 14900,
    date: '2026-01-12'
  },
  {
    id: 'exp-1-feed-2',
    cycleId: 'cycle-1-winter',
    category: 'feed',
    description: 'شراء علف نامٍ ممتاز للطيور (وزن 7 طن مكمل)',
    amount: 3640,
    currency: 'USD',
    exchangeRate: 14900,
    date: '2026-01-20'
  },
  {
    id: 'exp-1-med-2',
    cycleId: 'cycle-1-winter',
    category: 'medicine',
    description: 'كبسولات مضادات حيوية مع فيتامين سي مضاد إجهاد حراري',
    amount: 150,
    currency: 'USD',
    exchangeRate: 14950,
    date: '2026-01-22'
  },
  {
    id: 'exp-1-elec-1',
    cycleId: 'cycle-1-winter',
    category: 'electricity',
    description: 'فاتورة شبكة الكهرباء العامة وشحن ديزل المولد الاحتياطي',
    amount: 4200000,
    currency: 'SYP',
    exchangeRate: 14950,
    date: '2026-02-01'
  },
  {
    id: 'exp-1-feed-3',
    cycleId: 'cycle-1-winter',
    category: 'feed',
    description: 'شراء علف ناهٍ ختامي (وزن 3.5 طن تسويق)',
    amount: 1780,
    currency: 'USD',
    exchangeRate: 15000,
    date: '2026-02-05'
  },
  {
    id: 'exp-1-sal-1',
    cycleId: 'cycle-1-winter',
    category: 'salaries',
    description: 'دفعة الرواتب الشهرية لعمال الحظائر والحراسة للدورة المكتملة',
    amount: 6000000,
    currency: 'SYP',
    exchangeRate: 15000,
    date: '2026-02-15'
  },

  // مصاريف وتكاليف الدورة الثانية الراهنة (النشطة)
  {
    id: 'exp-2-prep-1',
    cycleId: 'cycle-2-spring',
    category: 'prep',
    description: 'تعقيم كيميائي ورش جير مطفأ مع نشارة خشب سميكة لعنبر 1 وعنبر 2',
    amount: 1650000,
    currency: 'SYP',
    exchangeRate: 15150,
    date: '2026-05-06'
  },
  {
    id: 'exp-2-feed-1',
    cycleId: 'cycle-2-spring',
    category: 'feed',
    description: 'توريد وجبة العلف الأولى بادئ ناعم 6 طن لمستودع المدجنة',
    amount: 3240,
    currency: 'USD',
    exchangeRate: 15150,
    date: '2026-05-10'
  },
  {
    id: 'exp-2-med-1',
    cycleId: 'cycle-2-spring',
    category: 'medicine',
    description: 'تحصينات ولقاحات النيوكاسل الوراثي بماء الشرب (الأسبوع الأول)',
    amount: 280,
    currency: 'USD',
    exchangeRate: 15180,
    date: '2026-05-15'
  },
  {
    id: 'exp-2-fuel-1',
    cycleId: 'cycle-2-spring',
    category: 'fuel',
    description: 'مازوت المولد وتحكم حراري بمداخن الشفط (800 لتر من الدرجة الأولى ليلية)',
    amount: 11200000,
    currency: 'SYP',
    exchangeRate: 15200,
    date: '2026-05-18'
  },
  {
    id: 'exp-2-feed-2',
    cycleId: 'cycle-2-spring',
    category: 'feed',
    description: 'وجبة العلف الثانية نامي متوسط الحبيبات 6 طن مكملة للتربية',
    amount: 3240,
    currency: 'USD',
    exchangeRate: 15200,
    date: '2026-05-25'
  },
  {
    id: 'exp-2-med-2',
    cycleId: 'cycle-2-spring',
    category: 'medicine',
    description: 'تأمين فيتامينات ومقويات وفلاجيل مطهر أمعاء للخلط مع ماء الشرب للوقاية المباشرة',
    amount: 3800000,
    currency: 'SYP',
    exchangeRate: 15200,
    date: '2026-05-29'
  }
];

// 4. فواتير وعقود المبيعات
export const mockSales: Sale[] = [
  // مبيعات الدورة الأولى (تم بيع 4788 دجاجة ناجحة بوزن كلي 10,773 كغ بمتوسط 2.25 كغ للدجاجة)
  // تم البيع بالعملة السورية مع تقلب السعر بسعر اليوم
  {
    id: 'sale-1-1',
    cycleId: 'cycle-1-winter',
    buyerName: 'شركة السعيد لتجارة وحوم الدواجن (العقاد)',
    chickenCount: 2200,
    totalWeightKg: 4950,
    pricePerKgSYP: 28000, // 28,000 ل.س للكيلو
    exchangeRate: 15000,  // سعر الصرف للمطابقة بالدولار
    date: '2026-02-16'
  },
  {
    id: 'sale-1-2',
    cycleId: 'cycle-1-winter',
    buyerName: 'التاجر الحاج عبد المجيد الحلبي',
    chickenCount: 2588,
    totalWeightKg: 5823,
    pricePerKgSYP: 28400, // 28,400 ل.س للكيلو مع زيادة الطلب
    exchangeRate: 15000,
    date: '2026-02-18'
  }

  // الدورة الثانية (نشطة وحالية) لا توجد بها مبيعات فك المبيعات تبدأ بعد سن الـ 37 يوماً وهي الآن باليوم 24.
];
