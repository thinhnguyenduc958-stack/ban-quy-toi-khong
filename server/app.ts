import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Global CORS & JSON header guarantee
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

import crypto from 'crypto';

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || 'friendship-cafe-session-secret-2026-retro-pop-hq';
const SESSION_MAX_AGE_SEC = 7 * 24 * 60 * 60; // 7 days
const revokedSessionIds = new Set<string>();

export interface AdminSessionData {
  sid: string;
  u: string;
  r: string;
  exp: number;
  iat: number;
}

export function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  const pairs = header.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const k = pair.substring(0, idx).trim();
      const v = pair.substring(idx + 1).trim();
      cookies[k] = decodeURIComponent(v);
    }
  }
  return cookies;
}

export function createSignedSession(username: string): { token: string; exp: number } {
  const iat = Date.now();
  const exp = iat + SESSION_MAX_AGE_SEC * 1000;
  const sid = `sid_${crypto.randomBytes(16).toString('hex')}`;
  const payload: AdminSessionData = {
    sid,
    u: username || 'admin',
    r: 'admin',
    exp,
    iat,
  };
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
  const token = `${b64Payload}.${signature}`;
  return { token, exp };
}

export function verifySignedSession(token: string): AdminSessionData | null {
  if (!token || typeof token !== 'string') return null;
  // Backward compatibility with legacy token
  if (token === 'friendship-cafe-retro-pop-secret-token-2026') {
    return {
      sid: 'legacy-token',
      u: 'admin',
      r: 'admin',
      exp: Date.now() + 86400000,
      iat: Date.now(),
    };
  }
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [b64Payload, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(b64Payload).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const jsonStr = Buffer.from(b64Payload, 'base64url').toString('utf8');
    const session: AdminSessionData = JSON.parse(jsonStr);
    if (!session || typeof session.exp !== 'number' || session.exp < Date.now()) {
      return null;
    }
    if (session.sid && revokedSessionIds.has(session.sid)) {
      return null;
    }
    return session;
  } catch (_) {
    return null;
  }
}

export function revokeSession(token: string): void {
  const session = verifySignedSession(token);
  if (session && session.sid) {
    revokedSessionIds.add(session.sid);
  }
}

export function extractAdminToken(req: express.Request): string | null {
  // 1. HttpOnly cookie
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.admin_session) {
    return cookies.admin_session;
  }
  // 2. Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  // 3. Custom header
  const customHeader = req.headers['x-admin-session'] || req.headers['x-admin-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

export function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const token = extractAdminToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Chưa đăng nhập quyền quản trị viên' });
    return;
  }
  const session = verifySignedSession(token);
  if (!session) {
    res.status(401).json({ success: false, error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    return;
  }
  (req as any).adminSession = session;
  next();
}

// VietQR URL builder helper
export function generateVietQRUrl(
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

const apiRouter = express.Router();

// ==========================================
// 1. HEALTH CHECK
// ==========================================
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// 2. PUBLIC STORE ENDPOINTS
// ==========================================
apiRouter.get('/products', (_req, res) => {
  try {
    const products = db.getProducts(false);
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải danh sách món' });
  }
});

apiRouter.get('/categories', (_req, res) => {
  try {
    const categories = db.getCategories();
    res.json(categories);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải danh mục' });
  }
});

apiRouter.get(['/bank-settings', '/bank-config'], (_req, res) => {
  try {
    const settings = db.getBankSettings();
    res.json(settings);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi lấy thông tin ngân hàng' });
  }
});

apiRouter.post('/orders', (req, res) => {
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
    res.status(400).json({ error: e?.message || 'Lỗi khi tạo đơn hàng' });
  }
});

apiRouter.get('/orders/:orderCode', (req, res) => {
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
    res.status(500).json({ error: e?.message || 'Lỗi khi tra cứu đơn' });
  }
});

apiRouter.post('/orders/:orderCode/transfer-done', (req, res) => {
  try {
    const { orderCode } = req.params;
    const order = db.markOrderAsTransferred(orderCode);
    res.json({
      success: true,
      message: 'Đơn hàng đã được gửi đến chủ quán. Đợi một chút nhé!',
      order,
    });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Lỗi khi cập nhật trạng thái đơn' });
  }
});

apiRouter.get('/leaderboard', (_req, res) => {
  try {
    const leaderboard = db.getLeaderboard();
    res.json(leaderboard);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải bảng vàng' });
  }
});

// ==========================================
// 3. ADMIN AUTHENTICATION & SESSION
// ==========================================
apiRouter.post('/admin/login', (req, res) => {
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
      const { token, exp } = createSignedSession(username);
      const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
      const cookieHeader = [
        `admin_session=${token}`,
        `Path=/`,
        `Max-Age=${SESSION_MAX_AGE_SEC}`,
        `HttpOnly`,
        `SameSite=Lax`,
        ...(isProd ? ['Secure'] : [])
      ].join('; ');

      res.setHeader('Set-Cookie', cookieHeader);
      res.status(200).json({
        success: true,
        token,
        user: { username, role: 'admin' },
        expiresAt: exp,
      });
    } else {
      res.status(401).json({ success: false, error: 'Mật khẩu quản trị viên không chính xác. Vui lòng thử lại!' });
    }
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: err?.message || 'Lỗi xử lý đăng nhập' });
  }
});

apiRouter.get(['/admin/session', '/admin/verify'], (req, res) => {
  try {
    const token = extractAdminToken(req);
    if (!token) {
      res.status(401).json({ authenticated: false, error: 'Chưa đăng nhập' });
      return;
    }
    const session = verifySignedSession(token);
    if (!session) {
      res.status(401).json({ authenticated: false, error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' });
      return;
    }
    res.status(200).json({
      authenticated: true,
      user: { username: session.u, role: session.r },
      expiresAt: session.exp,
    });
  } catch (e: any) {
    res.status(500).json({ authenticated: false, error: e?.message || 'Lỗi kiểm tra phiên' });
  }
});

apiRouter.post('/admin/logout', (req, res) => {
  try {
    const token = extractAdminToken(req);
    if (token) {
      revokeSession(token);
    }
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const clearCookie = `admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', clearCookie);
    res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message || 'Lỗi đăng xuất' });
  }
});

apiRouter.get('/admin/stats', adminAuthMiddleware, (_req, res) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải thống kê' });
  }
});

apiRouter.get('/admin/orders', adminAuthMiddleware, (req, res) => {
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
    res.status(500).json({ error: e?.message || 'Lỗi khi tải danh sách đơn' });
  }
});

apiRouter.post('/admin/orders/:orderCode/action', adminAuthMiddleware, (req, res) => {
  try {
    const { orderCode } = req.params;
    const { action, note } = req.body;

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
    res.status(400).json({ error: e?.message || 'Lỗi khi cập nhật đơn hàng' });
  }
});

apiRouter.get('/admin/products', adminAuthMiddleware, (_req, res) => {
  try {
    const products = db.getProducts(true);
    res.json(products);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải danh sách sản phẩm' });
  }
});

apiRouter.post('/admin/products', adminAuthMiddleware, (req, res) => {
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
    res.status(400).json({ error: e?.message || 'Lỗi khi lưu sản phẩm' });
  }
});

apiRouter.put('/admin/products/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const updated = db.saveProduct({ ...req.body, id });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Lỗi khi cập nhật sản phẩm' });
  }
});

apiRouter.delete('/admin/products/:id', adminAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const deleted = db.deleteProduct(id);
    if (!deleted) {
      res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
      return;
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Lỗi khi xóa sản phẩm' });
  }
});

apiRouter.put('/admin/bank-settings', adminAuthMiddleware, (req, res) => {
  try {
    const updated = db.updateBankSettings(req.body, 'admin');
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Lỗi khi cập nhật thông tin ngân hàng' });
  }
});

apiRouter.post('/admin/upload-qr', adminAuthMiddleware, (req, res) => {
  try {
    const dataUrl = req.body?.dataUrl || req.body?.image;
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Vui lòng chọn file ảnh mã QR hợp lệ.' });
      return;
    }

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

    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Dung lượng ảnh vượt quá giới hạn 5MB.' });
      return;
    }

    let publicUrl = dataUrl; // Default fallback to data URL on serverless
    let ext = 'png';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
    else if (mimeType.includes('webp')) ext = 'webp';

    const uniqueFileName = `qr_vietinbank_${Date.now()}.${ext}`;

    // Try saving to disk if writable
    try {
      const publicQrDir = path.resolve(process.cwd(), 'public/uploads/qr');
      if (!fs.existsSync(publicQrDir)) {
        fs.mkdirSync(publicQrDir, { recursive: true });
      }
      const filePath = path.join(publicQrDir, uniqueFileName);
      fs.writeFileSync(filePath, buffer);
      publicUrl = `/uploads/qr/${uniqueFileName}`;
    } catch (_) {
      // In read-only serverless environment (Vercel), store base64 dataUrl directly
      publicUrl = dataUrl;
    }

    const updatedBank = db.updateBankSettings({
      custom_qr_image_url: publicUrl,
    }, 'admin');

    db.addAuditLog({
      order_id: '',
      order_code: '',
      admin_username: 'admin',
      action: 'UPDATE_BANK_SETTINGS',
      note: `Tải lên mã QR VietinBank mới thành công (${Math.round(buffer.length / 1024)} KB)`,
    });

    res.json({
      success: true,
      url: publicUrl,
      bank: updatedBank,
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi lưu trữ ảnh QR' });
  }
});

apiRouter.delete('/admin/delete-qr', adminAuthMiddleware, (_req, res) => {
  try {
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
    res.status(500).json({ error: e?.message || 'Lỗi khi xóa ảnh QR' });
  }
});

apiRouter.get('/admin/audit-logs', adminAuthMiddleware, (_req, res) => {
  try {
    const logs = db.getAuditLogs();
    res.json(logs);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Lỗi khi tải lịch sử kiểm tra' });
  }
});

apiRouter.put('/admin/password', adminAuthMiddleware, (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
      return;
    }
    db.updateAdminPassword(newPassword, 'admin');
    res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Lỗi khi đổi mật khẩu' });
  }
});

apiRouter.get('/admin/supabase-sql', adminAuthMiddleware, (_req, res) => {
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), 'server/supabase_schema.sql'),
      path.join(__dirname, 'supabase_schema.sql'),
    ];
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          const sql = fs.readFileSync(p, 'utf-8');
          res.type('text/plain').send(sql);
          return;
        }
      } catch (_) {}
    }
    res.type('text/plain').send('-- Supabase SQL schema ready');
  } catch (e: any) {
    res.status(500).send(e?.message || 'Lỗi đọc file schema');
  }
});

// Dual mounting: Both /api and root /
// This ensures that whether Vercel rewrites to /api/admin/login OR strips the prefix to /admin/login, both match!
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch-all for API 404s
app.all('*', (req, res, next) => {
  // If it is a known static asset or Vite middleware handled elsewhere, pass along
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/admin')) {
    next();
    return;
  }
  res.status(404).json({ success: false, error: `Không tìm thấy endpoint API: ${req.method} ${req.path}` });
});

// Global API error handler: ALWAYS JSON
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(err?.status || 500).json({ success: false, error: err?.message || 'Lỗi máy chủ nội bộ' });
});
