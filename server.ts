import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// CORS & JSON content-type guarantee for API
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Serve public directory and static images statically
const publicDir = path.resolve(__dirname, 'public');
const uploadsDir = path.resolve(publicDir, 'uploads');
const srcAssetsDir = path.resolve(__dirname, 'src/assets');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(path.resolve(publicDir, 'images')));
app.use('/assets', express.static(path.resolve(publicDir, 'assets')));
app.use('/src/assets', express.static(srcAssetsDir));

// Token helper for simple secure admin session
const ADMIN_TOKEN_SECRET = 'friendship-cafe-retro-pop-secret-token-2026';

function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Chưa đăng nhập quyền quản trị' });
    return;
  }
  const token = authHeader.substring(7);
  if (token !== ADMIN_TOKEN_SECRET) {
    res.status(403).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    return;
  }
  next();
}

// Helper to generate VietQR Quick Link
function generateVietQRUrl(
  bankId: string,
  accountNumber: string,
  amount: number,
  content: string,
  accountName: string,
  template = 'compact2'
): string {
  const cleanBank = encodeURIComponent((bankId || '970415').trim());
  const cleanAcc = encodeURIComponent(accountNumber.trim());
  const cleanAmount = Math.max(0, Math.round(amount));
  const cleanInfo = encodeURIComponent(content.trim());
  const cleanName = encodeURIComponent(accountName.trim());
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAcc}-${template}.png?amount=${cleanAmount}&addInfo=${cleanInfo}&accountName=${cleanName}`;
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get products
app.get('/api/products', (_req, res) => {
  try {
    const products = db.getProducts(false);
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get categories
app.get('/api/categories', (_req, res) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get public bank settings
app.get('/api/bank-settings', (_req, res) => {
  try {
    const settings = db.getBankSettings();
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  try {
    const { buyer_name, is_anonymous, friend_note, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Giỏ hàng không được để trống' });
      return;
    }

    const order = db.createOrder({
      buyer_name,
      is_anonymous,
      friend_note,
      items,
    });

    const bank = db.getBankSettings();
    const qrUrl = generateVietQRUrl(
      bank.bank_id || '970415',
      bank.account_number,
      order.total_amount,
      order.payment_content,
      bank.account_name,
      bank.qr_template || 'compact2'
    );

    res.status(201).json({
      order,
      bank,
      qr_url: qrUrl,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Lỗi khi tạo đơn hàng' });
  }
});

// Get order by order code
app.get('/api/orders/:orderCode', (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = db.getOrderByCode(orderCode);
    if (!order) {
      res.status(404).json({ error: 'Không tìm thấy đơn hàng này' });
      return;
    }

    const bank = db.getBankSettings();
    const qrUrl = generateVietQRUrl(
      bank.bank_id || '970415',
      bank.account_number,
      order.total_amount,
      order.payment_content,
      bank.account_name,
      bank.qr_template || 'compact2'
    );

    res.json({
      order,
      bank,
      qr_url: qrUrl,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer clicks "Tôi đã chuyển khoản"
app.post('/api/orders/:orderCode/transfer-done', (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = db.markOrderAsTransferred(orderCode);
    res.json({
      success: true,
      message: 'Đơn hàng đã được gửi đến chủ quán. Đợi một chút nhé!',
      order,
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Hall of Fame Leaderboard
app.get('/api/leaderboard', (_req, res) => {
  try {
    const leaderboard = db.getLeaderboard();
    res.json(leaderboard);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const rawUsername = req.body?.username;
    const rawPassword = req.body?.password;
    const username = typeof rawUsername === 'string' && rawUsername.trim() ? rawUsername.trim() : 'admin';
    const password = typeof rawPassword === 'string' ? rawPassword.trim() : '';

    if (!password) {
      res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu quản trị viên' });
      return;
    }

    if (db.verifyAdmin(password)) {
      res.json({
        success: true,
        token: ADMIN_TOKEN_SECRET,
        user: { username, role: 'admin' },
      });
    } else {
      res.status(401).json({ success: false, error: 'Mật khẩu quản trị viên không chính xác. Vui lòng thử lại!' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý đăng nhập' });
  }
});

// Admin Verify Token
app.get('/api/admin/verify', adminAuthMiddleware, (_req, res) => {
  res.json({ valid: true, user: { username: 'admin', role: 'admin' } });
});

// Admin Dashboard Stats
app.get('/api/admin/stats', adminAuthMiddleware, (_req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Get All Orders (with filters)
app.get('/api/admin/orders', adminAuthMiddleware, (req, res) => {
  try {
    const { status, search } = req.query;
    let orders = db.getOrders();

    if (status && typeof status === 'string' && status !== 'ALL') {
      orders = orders.filter(o => o.payment_status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      orders = orders.filter(
        o =>
          o.order_code.toLowerCase().includes(q) ||
          o.buyer_name.toLowerCase().includes(q) ||
          o.payment_content.toLowerCase().includes(q)
      );
    }

    res.json(orders);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Confirm / Reject Order
app.post('/api/admin/orders/:orderCode/action', adminAuthMiddleware, (req, res) => {
  try {
    const { orderCode } = req.params;
    const { action, note } = req.body; // action: 'CONFIRM_PAID' | 'REJECT_PAYMENT' | 'SET_PENDING'

    let targetStatus: any = 'PAID';
    if (action === 'CONFIRM_PAID') targetStatus = 'PAID';
    else if (action === 'REJECT_PAYMENT') targetStatus = 'PAYMENT_REJECTED';
    else if (action === 'SET_PENDING') targetStatus = 'PENDING';
    else {
      res.status(400).json({ error: 'Hành động không hợp lệ' });
      return;
    }

    const updatedOrder = db.updateOrderStatus(orderCode, targetStatus, 'admin', note);
    res.json({ success: true, order: updatedOrder });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Admin Manage Products
app.get('/api/admin/products', adminAuthMiddleware, (_req, res) => {
  try {
    const products = db.getProducts(true);
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/products', adminAuthMiddleware, (req, res) => {
  try {
    const { name, description, price, image_url, category_id, is_available } = req.body;
    if (!name || typeof price !== 'number') {
      res.status(400).json({ error: 'Tên và giá sản phẩm là bắt buộc' });
      return;
    }
    const product = db.saveProduct({
      name,
      description,
      price,
      image_url,
      category_id,
      is_available,
    });
    res.status(201).json(product);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/products/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.saveProduct({ ...req.body, id });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/products/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteProduct(id);
    if (!deleted) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Admin Bank Settings Update
app.put('/api/admin/bank-settings', adminAuthMiddleware, (req, res) => {
  try {
    const updated = db.updateBankSettings(req.body, 'admin');
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Admin Upload Custom VietinBank QR Image
app.post('/api/admin/upload-qr', adminAuthMiddleware, (req, res) => {
  try {
    const dataUrl = req.body.dataUrl || req.body.image;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Vui lòng chọn file ảnh mã QR hợp lệ.' });
      return;
    }

    // Match data:[<mediatype>];base64,<data>
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Định dạng dữ liệu ảnh không hợp lệ (Base64).' });
      return;
    }

    const mimeType = matches[1].toLowerCase();
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(mimeType)) {
      res.status(400).json({ error: 'Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP.' });
      return;
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 5MB max size
    const MAX_SIZE = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      res.status(400).json({ error: 'Dung lượng ảnh vượt quá giới hạn 5MB.' });
      return;
    }

    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('webp')) ext = 'webp';

    const qrDir = path.resolve(__dirname, 'public/uploads/qr');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // If an old QR exists, clean it up
    const currentBank = db.getBankSettings();
    if (currentBank.custom_qr_image_url && currentBank.custom_qr_image_url.startsWith('/uploads/qr/')) {
      const oldPath = path.resolve(__dirname, 'public', currentBank.custom_qr_image_url.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    const uniqueFileName = `qr_vietinbank_${Date.now()}.${ext}`;
    const filePath = path.join(qrDir, uniqueFileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/qr/${uniqueFileName}`;

    const updatedBank = db.updateBankSettings({
      custom_qr_image_url: publicUrl,
    }, 'admin');

    db.addAuditLog({
      order_id: '',
      order_code: '',
      admin_username: 'admin',
      action: 'UPDATE_BANK_SETTINGS',
      note: `Tải lên mã QR VietinBank mới thành công: ${uniqueFileName} (${Math.round(buffer.length / 1024)} KB)`,
    });

    res.json({
      success: true,
      url: publicUrl,
      bank: updatedBank,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Lỗi khi lưu trữ ảnh QR' });
  }
});

// Admin Delete Custom QR Image
app.delete('/api/admin/delete-qr', adminAuthMiddleware, (_req, res) => {
  try {
    const currentBank = db.getBankSettings();
    if (currentBank.custom_qr_image_url && currentBank.custom_qr_image_url.startsWith('/uploads/qr/')) {
      const oldPath = path.resolve(__dirname, 'public', currentBank.custom_qr_image_url.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (_) {}
      }
    }

    const updatedBank = db.updateBankSettings({
      custom_qr_image_url: '',
    }, 'admin');

    db.addAuditLog({
      order_id: '',
      order_code: '',
      admin_username: 'admin',
      action: 'UPDATE_BANK_SETTINGS',
      note: 'Xóa ảnh mã QR ngân hàng tải lên, hoàn nguyên về mặc định',
    });

    res.json({
      success: true,
      bank: updatedBank,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', adminAuthMiddleware, (_req, res) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Admin Change Password
app.put('/api/admin/password', adminAuthMiddleware, (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
      return;
    }
    db.updateAdminPassword(newPassword, 'admin');
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Get Supabase SQL Schema
app.get('/api/admin/supabase-sql', adminAuthMiddleware, (_req, res) => {
  try {
    const schemaPath = path.resolve(__dirname, 'server/supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).send('-- Schema file not found');
    }
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

// Catch-all for API routes: ALWAYS return JSON, never HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Không tìm thấy endpoint API: ${req.method} ${req.path}` });
});

// Global API error handler: ALWAYS return JSON, never HTML
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('API Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Lỗi máy chủ nội bộ' });
});

// ==========================================
// VITE DEV SERVER / PRODUCTION STATIC
// ==========================================
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [BẠN QUÝ TÔI KHÔNG?] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export default app;
