import mysql from 'mysql2/promise';
import { Cycle, Expense, Mortality, Sale, AppUser } from '../src/types';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const host = process.env.DB_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com';
    const port = Number(process.env.DB_PORT || '4000');
    const user = process.env.DB_USER || '3pUCTUnNpddnkKq.root';
    const password = process.env.DB_PASSWORD || 'YDIMkL3t4Eo8LeRn';
    const database = process.env.DB_NAME || 'poultry_farm';

    console.log(`[Database] Connecting to MySQL Host: ${host}:${port}, DB: ${database}, User: ${user}`);

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false // TiDB Cloud requires SSL connection
      },
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000
    });
  }
  return pool;
}

// دالة مساعدة لتنسيق الحقول التاريخية القادمة من MySQL لتجنب تباين التوقيت في الواجهات
function formatDateString(d: any): string {
  if (!d) return '';
  if (d instanceof Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(d);
}

// دالات مساعدة لمعالجة طلبات الاستعلام
async function dbRun(sql: string, params: any[] = []): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.execute(sql, params);
  } catch (err) {
    console.error(`[MySQL Error] Running query: "${sql}"`, err);
    throw err;
  } finally {
    connection.release();
  }
}

async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  } catch (err) {
    console.error(`[MySQL Error] Querying all: "${sql}"`, err);
    throw err;
  } finally {
    connection.release();
  }
}

async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    const results = rows as any[];
    return results.length > 0 ? (results[0] as T) : undefined;
  } catch (err) {
    console.error(`[MySQL Error] Querying single row: "${sql}"`, err);
    throw err;
  } finally {
    connection.release();
  }
}

// تهيئة قاعدة البيانات والتأكد من إعداد الجداول كاملة بنظام MySQL المعتمد سحابياً
export async function initDatabase() {
  console.log(`[Database] Initializing connection and testing cloud TiDB MySQL database...`);

  // اختبار الاتصال بنجاح عبر جلب الوقت الحالي من MySQL
  const activePool = getPool();
  try {
    const [rows] = await activePool.query('SELECT NOW() as now');
    console.log('[Database] Connected to TiDB MySQL server successfully. Time on server:', (rows as any)[0].now);
  } catch (err) {
    console.error('[Database] Failed to connect to TiDB MySQL server:', err);
    throw err;
  }

  // تعطيل فحص المفاتيح الخارجية مؤقتاً لتجنب أي مشاكل توافقية أثناء إنشاء/تحديث الجداول
  await dbRun("SET FOREIGN_KEY_CHECKS = 0");

  try {
    // 1. إنشاء جدول المستخدمين إن لم يكن موجوداً
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        fullName VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        canManageCycles BOOLEAN NOT NULL DEFAULT FALSE,
        canManageExpenses BOOLEAN NOT NULL DEFAULT FALSE,
        canManageMortalities BOOLEAN NOT NULL DEFAULT FALSE,
        canManageSales BOOLEAN NOT NULL DEFAULT FALSE,
        canManageUsers BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 2. إنشاء جدول الإعدادات
    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) NOT NULL,
        setting_value TEXT NOT NULL,
        PRIMARY KEY (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 3. إنشاء جدول الدورات
    await dbRun(`
      CREATE TABLE IF NOT EXISTS cycles (
        id VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        status VARCHAR(10) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE,
        initialChicksCount INT NOT NULL,
        chickCostUSD DECIMAL(10, 2) NOT NULL,
        exchangeRateAtStart DECIMAL(10, 2) NOT NULL,
        feedPricePerTonUSD DECIMAL(10, 2) NOT NULL,
        notes TEXT,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 4. إنشاء جدول المصاريف
    await dbRun(`
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) NOT NULL,
        cycleId VARCHAR(50) NOT NULL,
        category VARCHAR(20) NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        exchangeRate DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_expenses_cycles FOREIGN KEY (cycleId) REFERENCES cycles (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 5. إنشاء جدول وفيات الطيور
    await dbRun(`
      CREATE TABLE IF NOT EXISTS mortalities (
        id VARCHAR(50) NOT NULL,
        cycleId VARCHAR(50) NOT NULL,
        count INT NOT NULL,
        date DATE NOT NULL,
        reason VARCHAR(255),
        PRIMARY KEY (id),
        CONSTRAINT fk_mortalities_cycles FOREIGN KEY (cycleId) REFERENCES cycles (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);

    // 6. إنشاء جدول مبيعات اللحم والدجاج اليومي
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) NOT NULL,
        cycleId VARCHAR(50) NOT NULL,
        buyerName VARCHAR(150) NOT NULL,
        chickenCount INT NOT NULL,
        totalWeightKg DECIMAL(10, 2) NOT NULL,
        pricePerKgSYP DECIMAL(10, 2) NOT NULL,
        exchangeRate DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_sales_cycles FOREIGN KEY (cycleId) REFERENCES cycles (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
  } finally {
    // إعادة تفعيل فحص المفاتيح الخارجية بعد الانتهاء
    await dbRun("SET FOREIGN_KEY_CHECKS = 1");
  }

  // فحص ما إذا كانت الجداول فارغة لغرس البيانات القياسية مع سعر صرف افتراضي 14100
  const userCount = await dbGet<{ count: number }>("SELECT count(*) as count FROM users");
  if (userCount && userCount.count === 0) {
    console.log("[Database] Seeding standard configurations into cloud TiDB MySQL...");

    // أولاً: الحسابات القياسية
    await dbRun(`
      INSERT INTO users (id, username, fullName, password, role, canManageCycles, canManageExpenses, canManageMortalities, canManageSales, canManageUsers) 
      VALUES 
      ('usr-admin', 'admin', 'المدير العام (أدمن)', '123', 'admin', TRUE, TRUE, TRUE, TRUE, TRUE),
      ('usr-manager', 'manager', 'المشرف التقني (فني)', '123', 'manager', TRUE, TRUE, TRUE, TRUE, FALSE),
      ('usr-viewer', 'viewer', 'طبيب العزل (مراقب)', '123', 'viewer', FALSE, FALSE, TRUE, FALSE, FALSE)
    `);

    // ثانياً: تهيئة سعر الصرف الافتراضي ليطابق رغبة وتحديث المستخدم (14100 ل.س)
    await dbRun("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)", ['exchangeRate', '14100']);

    // ثالثاً: تفاصيل الدورات القياسية
    const defaultCyclesList = [
      {
        id: 'cycle-1-winter',
        name: 'الدورة الأولى (الشتوية المكتملة 2026)',
        status: 'closed',
        startDate: '2026-01-05',
        endDate: '2026-02-18',
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
        startDate: '2026-05-10',
        initialChicksCount: 6000,
        chickCostUSD: 0.80,
        exchangeRateAtStart: 15150,
        feedPricePerTonUSD: 540,
        notes: 'الدورة الربيعية تسير بشكل ممتاز بمعدلات استهلاك مستقرة وتحصينات جيدة.'
      }
    ];

    for (const c of defaultCyclesList) {
      await dbRun(`
        INSERT INTO cycles (id, name, status, startDate, endDate, initialChicksCount, chickCostUSD, exchangeRateAtStart, feedPricePerTonUSD, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.id, c.name, c.status, c.startDate, c.endDate, c.initialChicksCount, c.chickCostUSD, c.exchangeRateAtStart, c.feedPricePerTonUSD, c.notes]);
    }

    // رابعاً: المصاريف الافتراضية
    const defaultExpensesList = [
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
      }
    ];

    for (const e of defaultExpensesList) {
      await dbRun(`
        INSERT INTO expenses (id, cycleId, category, description, amount, currency, exchangeRate, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [e.id, e.cycleId, e.category, e.description, e.amount, e.currency, e.exchangeRate, e.date]);
    }

    // خامساً: وفيات النفوق الافتراضية
    const defaultMortalitiesList = [
      { id: 'm-1-1', cycleId: 'cycle-1-winter', count: 18, date: '2026-01-06', reason: 'نفق طبيعي بالاستقبال' },
      { id: 'm-1-2', cycleId: 'cycle-1-winter', count: 12, date: '2026-01-07', reason: 'سحق وازدحام' },
      { id: 'm-1-3', cycleId: 'cycle-1-winter', count: 8, date: '2026-01-10', reason: 'طبيعي' },
      { id: 'm-1-4', cycleId: 'cycle-1-winter', count: 15, date: '2026-01-15', reason: 'انقطاع تدفئة مؤقت' },
      { id: 'm-1-5', cycleId: 'cycle-1-winter', count: 22, date: '2026-01-20', reason: 'تفاوت درجات الحرارة' },
      { id: 'm-1-6', cycleId: 'cycle-1-winter', count: 35, date: '2026-01-30', reason: 'عرج وخمول' },
      { id: 'm-2-1', cycleId: 'cycle-2-spring', count: 24, date: '2026-05-11', reason: 'إجهاد النقل والشحن' },
      { id: 'm-2-2', cycleId: 'cycle-2-spring', count: 15, date: '2026-05-12', reason: 'إجهاد حراري بالاستقبال' },
      { id: 'm-2-3', cycleId: 'cycle-2-spring', count: 9, date: '2026-05-14', reason: 'طبيعي' }
    ];

    for (const m of defaultMortalitiesList) {
      await dbRun(`
        INSERT INTO mortalities (id, cycleId, count, date, reason)
        VALUES (?, ?, ?, ?, ?)
      `, [m.id, m.cycleId, m.count, m.date, m.reason]);
    }

    // سادساً: مبيعات الدجاج الافتراضية
    const defaultSalesList = [
      {
        id: 'sale-1-1',
        cycleId: 'cycle-1-winter',
        buyerName: 'شركة السعيد لتجارة ولحوم الدواجن (العقاد)',
        chickenCount: 2200,
        totalWeightKg: 4950,
        pricePerKgSYP: 28000,
        exchangeRate: 15000,
        date: '2026-02-16'
      }
    ];

    for (const s of defaultSalesList) {
      await dbRun(`
        INSERT INTO sales (id, cycleId, buyerName, chickenCount, totalWeightKg, pricePerKgSYP, exchangeRate, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [s.id, s.cycleId, s.buyerName, s.chickenCount, s.totalWeightKg, s.pricePerKgSYP, s.exchangeRate, s.date]);
    }
    
    console.log("[Database] Seeding cloud MySQL database completed.");
  }
}

// سحب واستعراض كافة البيانات المترابطة من MySQL
export async function getAllData() {
  try {
    const cycles = await dbAll('SELECT * FROM cycles ORDER BY startDate DESC');
    const expenses = await dbAll('SELECT * FROM expenses ORDER BY date DESC, id DESC');
    const mortalities = await dbAll('SELECT * FROM mortalities ORDER BY date DESC, id DESC');
    const sales = await dbAll('SELECT * FROM sales ORDER BY date DESC, id DESC');

    // جلب سعر الصرف
    const settingRow = await dbGet<{ setting_value: string }>('SELECT setting_value FROM settings WHERE setting_key = ?', ['exchangeRate']);
    const exchangeRate = settingRow ? parseFloat(settingRow.setting_value) : 14100;

    // جلب المستخدمين وصلاحياتهم
    const usersRows = await dbAll('SELECT * FROM users');
    const users = usersRows.map(row => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      password: row.password,
      role: row.role as 'admin' | 'manager' | 'viewer',
      permissions: {
        canManageCycles: !!row.canManageCycles,
        canManageExpenses: !!row.canManageExpenses,
        canManageMortalities: !!row.canManageMortalities,
        canManageSales: !!row.canManageSales,
        canManageUsers: !!row.canManageUsers,
      }
    }));

    // تحويل الأرقام والنصوص لتوافق جافا سكريبت بالكامل
    const parsedCycles = cycles.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      startDate: formatDateString(c.startDate),
      endDate: c.endDate ? formatDateString(c.endDate) : null,
      initialChicksCount: Number(c.initialChicksCount) || 0,
      chickCostUSD: Number(c.chickCostUSD) || 0,
      exchangeRateAtStart: Number(c.exchangeRateAtStart) || 0,
      feedPricePerTonUSD: Number(c.feedPricePerTonUSD) || 0,
      notes: c.notes || ''
    }));

    const parsedExpenses = expenses.map(e => ({
      id: e.id,
      cycleId: e.cycleId,
      category: e.category,
      description: e.description,
      amount: Number(e.amount) || 0,
      currency: e.currency,
      exchangeRate: Number(e.exchangeRate) || 0,
      date: formatDateString(e.date)
    }));

    const parsedMortalities = mortalities.map(m => ({
      id: m.id,
      cycleId: m.cycleId,
      count: Number(m.count) || 0,
      date: formatDateString(m.date),
      reason: m.reason || ''
    }));

    const parsedSales = sales.map(s => ({
      id: s.id,
      cycleId: s.cycleId,
      buyerName: s.buyerName,
      chickenCount: Number(s.chickenCount) || 0,
      totalWeightKg: Number(s.totalWeightKg) || 0,
      pricePerKgSYP: Number(s.pricePerKgSYP) || 0,
      exchangeRate: Number(s.exchangeRate) || 0,
      date: formatDateString(s.date)
    }));

    return {
      cycles: parsedCycles,
      expenses: parsedExpenses,
      mortalities: parsedMortalities,
      sales: parsedSales,
      users,
      exchangeRate
    };
  } catch (err) {
    console.error('[MySQL getAllData Error]', err);
    throw err;
  }
}

// 1. تحديث سعر الصرف
export async function updateExchangeRate(rate: number) {
  try {
    await dbRun(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
      ['exchangeRate', rate.toString()]
    );
  } catch (err) {
    console.error('[MySQL updateExchangeRate Error]', err);
    throw err;
  }
}

// 2. إضافة دورة
export async function addCycle(cycle: Cycle) {
  try {
    await dbRun(
      'INSERT INTO cycles (id, name, status, startDate, endDate, initialChicksCount, chickCostUSD, exchangeRateAtStart, feedPricePerTonUSD, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        cycle.id,
        cycle.name,
        cycle.status,
        cycle.startDate,
        cycle.endDate || null,
        Number(cycle.initialChicksCount) || 0,
        Number(cycle.chickCostUSD) || 0,
        Number(cycle.exchangeRateAtStart) || 0,
        Number(cycle.feedPricePerTonUSD) || 0,
        cycle.notes || null,
      ]
    );
  } catch (err) {
    console.error('[MySQL addCycle Error]', err);
    throw err;
  }
}

// تعديل دورة
export async function updateCycle(cycle: Cycle) {
  try {
    await dbRun(
      'UPDATE cycles SET name = ?, status = ?, startDate = ?, endDate = ?, initialChicksCount = ?, chickCostUSD = ?, exchangeRateAtStart = ?, feedPricePerTonUSD = ?, notes = ? WHERE id = ?',
      [
        cycle.name,
        cycle.status,
        cycle.startDate,
        cycle.endDate || null,
        Number(cycle.initialChicksCount) || 0,
        Number(cycle.chickCostUSD) || 0,
        Number(cycle.exchangeRateAtStart) || 0,
        Number(cycle.feedPricePerTonUSD) || 0,
        cycle.notes || null,
        cycle.id
      ]
    );
  } catch (err) {
    console.error('[MySQL updateCycle Error]', err);
    throw err;
  }
}

// حذف دورة
export async function deleteCycle(id: string) {
  try {
    await dbRun('DELETE FROM cycles WHERE id = ?', [id]);
  } catch (err) {
    console.error('[MySQL deleteCycle Error]', err);
    throw err;
  }
}

// 3. إضافة مصروف
export async function addExpense(expense: Expense) {
  try {
    await dbRun(
      'INSERT INTO expenses (id, cycleId, category, description, amount, currency, exchangeRate, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        expense.id,
        expense.cycleId,
        expense.category,
        expense.description,
        Number(expense.amount) || 0,
        expense.currency,
        Number(expense.exchangeRate) || 0,
        expense.date
      ]
    );
  } catch (err) {
    console.error('[MySQL addExpense Error]', err);
    throw err;
  }
}

// حذف مصروف
export async function deleteExpense(id: string) {
  try {
    await dbRun('DELETE FROM expenses WHERE id = ?', [id]);
  } catch (err) {
    console.error('[MySQL deleteExpense Error]', err);
    throw err;
  }
}

// 4. إضافة نفوق
export async function addMortality(mortality: Mortality) {
  try {
    await dbRun(
      'INSERT INTO mortalities (id, cycleId, count, date, reason) VALUES (?, ?, ?, ?, ?)',
      [
        mortality.id,
        mortality.cycleId,
        Number(mortality.count) || 0,
        mortality.date,
        mortality.reason || null
      ]
    );
  } catch (err) {
    console.error('[MySQL addMortality Error]', err);
    throw err;
  }
}

// حذف نفوق
export async function deleteMortality(id: string) {
  try {
    await dbRun('DELETE FROM mortalities WHERE id = ?', [id]);
  } catch (err) {
    console.error('[MySQL deleteMortality Error]', err);
    throw err;
  }
}

// 5. إضافة مبيعات
export async function addSale(sale: Sale) {
  try {
    await dbRun(
      'INSERT INTO sales (id, cycleId, buyerName, chickenCount, totalWeightKg, pricePerKgSYP, exchangeRate, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        sale.id,
        sale.cycleId,
        sale.buyerName,
        Number(sale.chickenCount) || 0,
        Number(sale.totalWeightKg) || 0,
        Number(sale.pricePerKgSYP) || 0,
        Number(sale.exchangeRate) || 0,
        sale.date
      ]
    );
  } catch (err) {
    console.error('[MySQL addSale Error]', err);
    throw err;
  }
}

// حذف مبيعات
export async function deleteSale(id: string) {
  try {
    await dbRun('DELETE FROM sales WHERE id = ?', [id]);
  } catch (err) {
    console.error('[MySQL deleteSale Error]', err);
    throw err;
  }
}

// 6. إضافة مستخدم
export async function addUser(user: AppUser) {
  try {
    const p = user.permissions || {
      canManageCycles: false,
      canManageExpenses: false,
      canManageMortalities: false,
      canManageSales: false,
      canManageUsers: false
    };

    await dbRun(
      'INSERT INTO users (id, username, fullName, password, role, canManageCycles, canManageExpenses, canManageMortalities, canManageSales, canManageUsers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        user.id,
        user.username,
        user.fullName,
        user.password || '123',
        user.role,
        p.canManageCycles ? 1 : 0,
        p.canManageExpenses ? 1 : 0,
        p.canManageMortalities ? 1 : 0,
        p.canManageSales ? 1 : 0,
        p.canManageUsers ? 1 : 0
      ]
    );
  } catch (err) {
    console.error('[MySQL addUser Error]', err);
    throw err;
  }
}

// تعديل مستخدم
export async function updateUser(user: AppUser) {
  try {
    const p = user.permissions || {
      canManageCycles: false,
      canManageExpenses: false,
      canManageMortalities: false,
      canManageSales: false,
      canManageUsers: false
    };

    await dbRun(
      'UPDATE users SET username = ?, fullName = ?, password = ?, role = ?, canManageCycles = ?, canManageExpenses = ?, canManageMortalities = ?, canManageSales = ?, canManageUsers = ? WHERE id = ?',
      [
        user.username,
        user.fullName,
        user.password,
        user.role,
        p.canManageCycles ? 1 : 0,
        p.canManageExpenses ? 1 : 0,
        p.canManageMortalities ? 1 : 0,
        p.canManageSales ? 1 : 0,
        p.canManageUsers ? 1 : 0,
        user.id
      ]
    );
  } catch (err) {
    console.error('[MySQL updateUser Error]', err);
    throw err;
  }
}

// حذف مستخدم
export async function deleteUser(id: string) {
  try {
    await dbRun('DELETE FROM users WHERE id = ?', [id]);
  } catch (err) {
    console.error('[MySQL deleteUser Error]', err);
    throw err;
  }
}
