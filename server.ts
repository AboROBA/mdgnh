import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  initDatabase, 
  getAllData, 
  updateExchangeRate, 
  addCycle, 
  updateCycle, 
  deleteCycle, 
  addExpense, 
  deleteExpense, 
  addMortality, 
  deleteMortality, 
  addSale, 
  deleteSale, 
  addUser, 
  updateUser, 
  deleteUser 
} from './server/db';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. تهيئة والاتصال بقاعدة البيانات
  await initDatabase();

  // 2. بوابات ومنافذ الـ REST API لدواجن سورية الكبرى
  
  // سحب كافة البيانات دفعة واحدة لتبسيط وتدفق الواجهات الرشيق
  app.get('/api/all_data', async (req, res) => {
    try {
      const data = await getAllData();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // تحديث سعر الصرف العام
  app.post('/api/rate', async (req, res) => {
    try {
      const { rate } = req.body;
      if (typeof rate !== 'number') {
        res.status(400).json({ error: 'سعر الصرف يجب أن يكون رقماً صالحاً.' });
        return;
      }
      await updateExchangeRate(rate);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إدارة الدورات
  app.post('/api/cycles', async (req, res) => {
    try {
      await addCycle(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/cycles/:id', async (req, res) => {
    try {
      await updateCycle(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/cycles/:id', async (req, res) => {
    try {
      await deleteCycle(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إدارة المصاريف والنفقات
  app.post('/api/expenses', async (req, res) => {
    try {
      await addExpense(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/expenses/:id', async (req, res) => {
    try {
      await deleteExpense(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إدارة وفيات الدواجن
  app.post('/api/mortalities', async (req, res) => {
    try {
      await addMortality(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/mortalities/:id', async (req, res) => {
    try {
      await deleteMortality(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إدارة طرود وعقود مبيعات اللحم
  app.post('/api/sales', async (req, res) => {
    try {
      await addSale(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/sales/:id', async (req, res) => {
    try {
      await deleteSale(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // إدارة فريق العمل وصلاحيات المستخدمين والمسؤولين
  app.post('/api/users', async (req, res) => {
    try {
      await addUser(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      await updateUser(req.body);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      await deleteUser(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 3. تهيئة مخدم الويب لـ SPA والدخول إلى الفهرس
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // الاستماع الموحّد للمنافذ للباك-إند على 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Poultry Digital Manager Backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
