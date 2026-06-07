/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, TableProperties, HelpCircle, Code, ListFilter, ArrowRightLeft } from 'lucide-react';

interface TableSchema {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints?: string;
    description: string;
  }[];
  sql: string;
}

export default function SchemaViewer() {
  const [activeTable, setActiveTable] = useState<string>('cycles');
  const [copied, setCopied] = useState<boolean>(false);

  const tables: Record<string, TableSchema> = {
    cycles: {
      name: 'cycles (جدول الدورات المحاسبية)',
      description: 'يقوم بتخزين المعلومات الأساسية لكل دفعة تربية دواجن مستقلة كمبدأ الأرشفة والدورة المغلقة.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'المعرّف الفريد للدورة لربط الجداول الأخرى بها' },
        { name: 'name', type: 'VARCHAR(100)', constraints: 'NOT NULL', description: 'اسم الدورة التعريفي (مثال: دورة الشتاء 2026)' },
        { name: 'status', type: 'VARCHAR(10)', constraints: 'CHECK(status IN (\'active\', \'closed\'))', description: 'حالة الدورة (نشطة للمتابعة اليومية أو مغلقة للأرشفة والمقارنة)' },
        { name: 'startDate', type: 'DATE', constraints: 'NOT NULL', description: 'تاريخ استقبال الصيصان وبدء دورة التجهيز' },
        { name: 'endDate', type: 'DATE', constraints: 'NULLABLE', description: 'تاريخ إغلاق الدورة وانتهاء حركة مبيعات الدجاج بالكامل' },
        { name: 'initialChicksCount', type: 'INTEGER', constraints: 'NOT NULL', description: 'الكمية المستلمة من الصيصان في أول الدورة بالعدد' },
        { name: 'chickCostUSD', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر شراء الصوص الواحد بالدولار الأمريكي لحظة الاستقبال' },
        { name: 'exchangeRateAtStart', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر صرف الليرة مقابل الدولار المعتمد في يوم التجهيز والاستقبال الافتتاحي' },
        { name: 'feedPricePerTonUSD', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر طن العلف بالدولار كمؤشر للجدوى الاقتصادية للمفرخة' },
        { name: 'notes', type: 'TEXT', constraints: 'NULLABLE', description: 'تفاصيل وظروف التربية الاستثنائية للدورة' }
      ],
      sql: `CREATE TABLE cycles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(10) NOT NULL CHECK (status IN ('active', 'closed')),
  startDate DATE NOT NULL,
  endDate DATE,
  initialChicksCount INTEGER NOT NULL,
  chickCostUSD DECIMAL(10, 2) NOT NULL,
  exchangeRateAtStart DECIMAL(10, 2) NOT NULL,
  feedPricePerTonUSD DECIMAL(10, 2) NOT NULL,
  notes TEXT
);`
    },
    expenses: {
      name: 'expenses (جدول المصاريف والنفقات المتغيرة)',
      description: 'يسجل النفقات المتنوعة الخاصة بالدورة مصنفة بحسب مراحل التربية (التجهيز، الأدوية، العلف، المازوت...).',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'معرف المصرف الفريد' },
        { name: 'cycleId', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES cycles(id)', description: 'مفتاح أجنبي يربط المصروف بالدورة الفرعية المخصصة' },
        { name: 'category', type: 'VARCHAR(20)', constraints: 'NOT NULL', description: 'تصنيف المصروف (prep, chicks, feed, medicine, fuel, electricity, salaries, other)' },
        { name: 'description', type: 'TEXT', constraints: 'NOT NULL', description: 'وصف تفصيلي للفاتورة أو الخدمة المدفوعة' },
        { name: 'amount', type: 'DECIMAL(12,2)', constraints: 'NOT NULL', description: 'القيمة المالية المسجلة بالفاتورة بالعملة الأصلية المدخلة' },
        { name: 'currency', type: 'VARCHAR(3)', constraints: 'NOT NULL CHECK(currency IN (\'USD\', \'SYP\'))', description: 'عملة الفاتورة الأصلية (سواء بالليرة السورية لتجنب الصرف أو الدولار)' },
        { name: 'exchangeRate', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر الصرف المعتمد في اللحظة الزمنية الدقيقة لصرف الفاتورة للتكافؤ' },
        { name: 'date', type: 'DATE', constraints: 'NOT NULL', description: 'تاريخ إصدار الفاتورة أو دفع المقابل' }
      ],
      sql: `CREATE TABLE expenses (
  id VARCHAR(50) PRIMARY KEY,
  cycleId VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'SYP')),
  exchangeRate DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE
);`
    },
    mortalities: {
      name: 'mortalities (جدول وفيات الدواجن اليومي)',
      description: 'سجل المراقبة اليومية لعداد النفوق، لضمان استمرارية تحديث مخزون الدجاج الحي واحتساب الكفاءة بدقة.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'معرف تقرير النفوق' },
        { name: 'cycleId', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES cycles(id)', description: 'رابط الدورة النشطة الجارية' },
        { name: 'count', type: 'INTEGER', constraints: 'NOT NULL CHECK(count >= 0)', description: 'عدد الطيور النافقة التي جُمعت في ذلك اليوم' },
        { name: 'date', type: 'DATE', constraints: 'NOT NULL', description: 'تاريخ تسجيل النفوق اليومي للربط مع المنحنى' },
        { name: 'reason', type: 'VARCHAR(255)', constraints: 'NULLABLE', description: 'ملاحظة طبية أو تشخيص للسبب (مثال: برد ليلى، مشكلة معوية، إجهاد حراري)' }
      ],
      sql: `CREATE TABLE mortalities (
  id VARCHAR(50) PRIMARY KEY,
  cycleId VARCHAR(50) NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  date DATE NOT NULL,
  reason VARCHAR(255),
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE
);`
    },
    sales: {
      name: 'sales (جدول فواتير المبيعات وتسويق اللحم)',
      description: 'تسجيل عمليات البيع بالعملة السورية مع رصد الكمية (عدد دجاج) والوزن الكلي لتقييم الكفاءة والوزن المتوسط للطيور.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', constraints: 'PRIMARY KEY', description: 'رقم الفاتورة أو مستند البيع الفريد' },
        { name: 'cycleId', type: 'VARCHAR(50)', constraints: 'FOREIGN KEY REFERENCES cycles(id)', description: 'رابط الدورة المحتسبة لحيازة أرباحها' },
        { name: 'buyerName', type: 'VARCHAR(150)', constraints: 'NOT NULL', description: 'اسم تاجر الجملة أو مسلخ الفروج المستلم' },
        { name: 'chickenCount', type: 'INTEGER', constraints: 'NOT NULL CHECK(chickenCount > 0)', description: 'عدد الطيور المباعة في هذه العملية' },
        { name: 'totalWeightKg', type: 'DECIMAL(10,2)', constraints: 'NOT NULL CHECK(totalWeightKg > 0)', description: 'الوزن الإجمالي بالكيلوغرام لنقلة البيع' },
        { name: 'pricePerKgSYP', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر مبيع الكيلو الغرام الواحد بالليرة السورية حسب سعر المداجن اليومي الدارج' },
        { name: 'exchangeRate', type: 'DECIMAL(10,2)', constraints: 'NOT NULL', description: 'سعر الصرف اليدوي المحدد للتحويل الفوري إلى عملة المكافأة بالدولار الأمريكي' },
        { name: 'date', type: 'DATE', constraints: 'NOT NULL', description: 'تاريخ عملية التسليم وحساب الوزن الكلي' }
      ],
      sql: `CREATE TABLE sales (
  id VARCHAR(50) PRIMARY KEY,
  cycleId VARCHAR(50) NOT NULL,
  buyerName VARCHAR(150) NOT NULL,
  chickenCount INTEGER NOT NULL CHECK (chickenCount > 0),
  totalWeightKg DECIMAL(10, 2) NOT NULL CHECK (totalWeightKg > 0),
  pricePerKgSYP DECIMAL(10, 2) NOT NULL,
  exchangeRate DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (cycleId) REFERENCES cycles(id) ON DELETE CASCADE
);`
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="schema-viewer-panel" className="glass-card rounded-2xl overflow-hidden shadow-xl text-white">
      <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl">
            <Database className="w-5 h-5" id="db-visualizer-icon" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">هيكلية الجداول وتصميم قاعدة البيانات</h2>
            <p className="text-xs text-white/60 mt-1">تصميم تقني مرن يدعم العملات المزدوجة، رصد تكاليف التجهيز، التربية، النفوق، والمبيعات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
        {/* شريط اختيار الجداول */}
        <div className="p-4 bg-white/5 border-l border-white/10 space-y-2">
          <p className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-3 px-2">جداول قاعدة البيانات</p>
          {Object.entries(tables).map(([key, value]) => (
            <button
              key={key}
              id={`tab-table-${key}`}
              onClick={() => setActiveTable(key)}
              className={`w-full text-right p-3 rounded-xl flex items-center justify-between transition-all border-0 cursor-pointer ${
                activeTable === key
                  ? 'bg-emerald-550 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-550/10'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <TableProperties className="w-4 h-4" />
                <span className="text-sm font-medium">{key}</span>
              </div>
            </button>
          ))}

          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 mt-6 text-blue-200">
            <div className="flex gap-2 text-blue-300 font-bold text-xs items-center mb-1">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>ملاحظة المعماري</span>
            </div>
            <p className="text-[11px] text-blue-200 leading-relaxed">
              تعتمد قاعدة البيانات العلاقات الثنائية بمفتاح أجنبي <code className="bg-white/10 px-1 rounded text-white">cycleId</code> بربط متتالي (Cascade) لضمان اتساق البيانات وعدم حدوث فجوات محاسبية في حال إجراء تعديلات أو أرشفة للدورة.
            </p>
          </div>
        </div>

        {/* جسم الشرح والأكواد */}
        <div className="col-span-3 p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="text-md font-bold text-white mb-1">{tables[activeTable].name}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{tables[activeTable].description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-copy-sql"
                  onClick={() => copyToClipboard(tables[activeTable].sql)}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/95 rounded-lg border border-white/10 font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  {copied ? 'تم النسخ!' : 'نسخ كود SQL'}
                </button>
              </div>
            </div>

            {/* جدول الأعمدة والخصائص */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-white/50 text-xs font-bold">
                    <th className="p-3">اسم العمود (Column)</th>
                    <th className="p-3">نوع البيانات (Type)</th>
                    <th className="p-3">الشروط (Constraints)</th>
                    <th className="p-3">الوصف والدلالة المحاسبية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/85">
                  {tables[activeTable].columns.map((col, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-xs text-white font-bold">{col.name}</td>
                      <td className="p-3 font-mono text-xs text-indigo-300">{col.type}</td>
                      <td className="p-3 text-xs">
                        {col.constraints ? (
                          <span className={`px-2 py-0.5 rounded-md font-medium text-[10px] border ${
                            col.constraints.includes('PRIMARY') ? 'bg-orange-500/15 text-orange-350 border-orange-500/20' :
                            col.constraints.includes('FOREIGN') ? 'bg-blue-500/15 text-blue-350 border-blue-500/20' : 'bg-white/5 text-white/65 border-white/10'
                          }`}>
                            {col.constraints}
                          </span>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </td>
                      <td className="p-3 text-xs leading-relaxed text-white/70">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* محرر عرض الكود لقاعدة البيانات */}
          <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto relative leading-relaxed">
            <span className="absolute top-2 left-2 text-[10px] font-bold text-white/30 font-mono">SQL DDL Schema</span>
            <pre className="text-emerald-300 font-mono text-[11px] leading-relaxed select-all">
              {tables[activeTable].sql}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
