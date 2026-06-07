/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cycle, Expense, Mortality, Sale } from './types';

// تنسيق الرقم بعملة الليرة السورية
export function formatSYP(amount: number): string {
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: 'SYP',
    maximumFractionDigits: 0
  }).format(amount).replace('ل.س.‏', 'ل.س');
}

// تنسيق الرقم بعملة الدولار الأمريكي
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// تنسيق التواريخ باللغة العربية بشكل أنيق واحترافي
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// حساب إحصائيات الدورة الكاملة
export interface CycleStats {
  initialCount: number;
  currentCount: number;
  totalMortality: number;
  mortalityRate: number; // نسبة النفوق %
  
  // المصاريف المتنوعة ومرحلة التجهيز والاستقبال
  totalExpensesUSD: number;
  totalExpensesSYP: number;
  expensesByCategoryUSD: Record<string, number>;
  expensesByCategorySYP: Record<string, number>;
  
  // المبيعات والإنتاجية
  totalSalesUSD: number;
  totalSalesSYP: number;
  totalSoldCount: number;
  totalSoldWeightKg: number;
  avgWeightPerBirdKg: number;
  avgPricePerKgSYP: number;
  
  // الأرباح والخسائر
  netProfitUSD: number;
  netProfitSYP: number;
}

export function calculateCycleStats(
  cycle: Cycle,
  expenses: Expense[],
  mortalities: Mortality[],
  sales: Sale[],
  currentExchangeRate: number
): CycleStats {
  const cycleExpenses = expenses.filter(e => e.cycleId === cycle.id);
  const cycleMortalities = mortalities.filter(m => m.cycleId === cycle.id);
  const cycleSales = sales.filter(s => s.cycleId === cycle.id);
  
  // 1. حسابات النفوق والمخزون الحالي
  const totalMortality = cycleMortalities.reduce((acc, curr) => acc + curr.count, 0);
  const totalSoldCount = cycleSales.reduce((acc, curr) => acc + curr.chickenCount, 0);
  // العدد المتبقي الفعلي في المدجنة المتوقع
  const currentCount = Math.max(0, cycle.initialChicksCount - totalMortality - totalSoldCount);
  const mortalityRate = cycle.initialChicksCount > 0 
    ? (totalMortality / cycle.initialChicksCount) * 100 
    : 0;

  // 2. حساب المصاريف الإجمالية وتفكيكها بالعملتين
  // نقوم بتحويل كل مصروف لعملتيه المقابلتين بناء على سعر الصرف الخاص بتلك الفاتورة وقت حدوثها
  let totalExpensesUSD = 0;
  let totalExpensesSYP = 0;
  
  const expensesByCategoryUSD: Record<string, number> = {};
  const expensesByCategorySYP: Record<string, number> = {};

  // تكلفة شراء الصيصان الأولية (تُعتبر مصروفاً في مرحلة الاستقبال)
  // تلافياً للحساب المزدوج، لا نتحكم بكلفة الصيصان يدوياً إذا كانت الفاتورة مغروسة بالفعل في قائمة نفقات الدورة
  const hasChicksExpense = cycleExpenses.some(e => e.category === 'chicks');
  const chickCostUSD = cycle.initialChicksCount * cycle.chickCostUSD;
  const chickCostSYP = chickCostUSD * cycle.exchangeRateAtStart;
  
  if (!hasChicksExpense) {
    totalExpensesUSD += chickCostUSD;
    totalExpensesSYP += chickCostSYP;
    
    expensesByCategoryUSD['chicks'] = chickCostUSD;
    expensesByCategorySYP['chicks'] = chickCostSYP;
  }

  // المصاريف المدخلة الأخرى
  cycleExpenses.forEach(exp => {
    let expUSD = 0;
    let expSYP = 0;

    if (exp.currency === 'USD') {
      expUSD = exp.amount;
      expSYP = exp.amount * exp.exchangeRate;
    } else {
      expSYP = exp.amount;
      expUSD = exp.amount / exp.exchangeRate;
    }

    totalExpensesUSD += expUSD;
    totalExpensesSYP += expSYP;

    expensesByCategoryUSD[exp.category] = (expensesByCategoryUSD[exp.category] || 0) + expUSD;
    expensesByCategorySYP[exp.category] = (expensesByCategorySYP[exp.category] || 0) + expSYP;
  });

  // 3. المبيعات الإجمالية وتفكيكها بالعملتين
  let totalSalesSYP = 0;
  let totalSalesUSD = 0;
  let totalSoldWeightKg = 0;

  cycleSales.forEach(sale => {
    const saleSYP = sale.chickenCount * sale.totalWeightKg * (sale.pricePerKgSYP / (sale.chickenCount > 0 ? (sale.totalWeightKg / sale.chickenCount) : 1)); 
    // الوزن الكلي * السعر لكل كيلوغرام
    const actualSaleSYP = sale.totalWeightKg * sale.pricePerKgSYP;
    const actualSaleUSD = actualSaleSYP / sale.exchangeRate;

    totalSalesSYP += actualSaleSYP;
    totalSalesUSD += actualSaleUSD;
    totalSoldWeightKg += sale.totalWeightKg;
  });

  // متوسط الأوزان والأسعار
  const avgWeightPerBirdKg = totalSoldCount > 0 ? (totalSoldWeightKg / totalSoldCount) : 0;
  const avgPricePerKgSYP = totalSoldWeightKg > 0 ? (totalSalesSYP / totalSoldWeightKg) : 0;

  // 4. صافي الأرباح أو الخسائر
  const netProfitUSD = totalSalesUSD - totalExpensesUSD;
  const netProfitSYP = totalSalesSYP - totalExpensesSYP;

  return {
    initialCount: cycle.initialChicksCount,
    currentCount,
    totalMortality,
    mortalityRate,
    
    totalExpensesUSD,
    totalExpensesSYP,
    expensesByCategoryUSD,
    expensesByCategorySYP,
    
    totalSalesUSD,
    totalSalesSYP,
    totalSoldCount,
    totalSoldWeightKg,
    avgWeightPerBirdKg,
    avgPricePerKgSYP,
    
    netProfitUSD,
    netProfitSYP
  };
}
