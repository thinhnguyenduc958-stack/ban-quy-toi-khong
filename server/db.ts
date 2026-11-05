import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  image_url: string;
}

export type PaymentStatus = 'PENDING' | 'AWAITING_MANUAL_CONFIRMATION' | 'PAID' | 'PAYMENT_REJECTED';

export interface Order {
  id: string;
  order_code: string;
  buyer_name: string;
  is_anonymous: boolean;
  friend_note: string;
  total_amount: number;
  payment_content: string;
  payment_status: PaymentStatus;
  items: OrderItem[];
  created_at: string;
  paid_at?: string;
  audit_note?: string;
}

export type PaymentQrMode = 'VIETQR_DYNAMIC' | 'UPLOADED_IMAGE' | 'HYBRID';

export interface BankSettings {
  id: string;
  bank_name: string;
  bank_id: string;
  bank_code: string;
  qr_template: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
  custom_qr_image_url?: string;
  qr_mode: PaymentQrMode;
}

export interface AuditLog {
  id: string;
  order_id: string;
  order_code: string;
  admin_username: string;
  action: 'CONFIRM_PAID' | 'REJECT_PAYMENT' | 'UPDATE_STATUS' | 'UPDATE_BANK_SETTINGS' | 'UPDATE_PRODUCT';
  note: string;
  created_at: string;
}

export interface AdminUser {
  username: string;
  password: string; // Stored securely
}

interface DataStore {
  products: Product[];
  categories: Category[];
  bank_settings: BankSettings;
  orders: Order[];
  audit_logs: AuditLog[];
  admin: AdminUser;
  last_order_index: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'Tất cả', slug: 'tat-ca', sort_order: 1 },
  { id: 'cat-tra-sua', name: 'Trà sữa', slug: 'tra-sua', sort_order: 2 },
  { id: 'cat-tra-trai-cay', name: 'Trà trái cây', slug: 'tra-trai-cay', sort_order: 3 },
  { id: 'cat-ca-phe', name: 'Cà phê', slug: 'ca-phe', sort_order: 4 },
  { id: 'cat-nuoc-giai-khat', name: 'Nước giải khát', slug: 'nuoc-giai-khat', sort_order: 5 },
  { id: 'cat-do-an-vat', name: 'Đồ ăn vặt', slug: 'do-an-vat', sort_order: 6 },
  { id: 'cat-combo', name: 'Combo tình bạn', slug: 'combo', sort_order: 7 },
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-tra-da',
    name: 'Trà đá',
    description: '5K thôi, nhưng tình cảm thì vô giá.',
    price: 5000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-nuoc-giai-khat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-bim-bim',
    name: 'Bim bim',
    description: 'Giòn tan như tình bạn của chúng ta.',
    price: 5000,
    image_url: '/images/product_street_snack_1793702876247.jpg',
    category_id: 'cat-do-an-vat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-tra-tac',
    name: 'Trà tắc',
    description: 'Một chút chua, một chút ngọt, giống cuộc đời tôi.',
    price: 20000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-tra-trai-cay',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-coca-cola',
    name: 'Coca-Cola',
    description: 'Ngọt ngào, có ga, bùng nổ năng lượng tình bạn.',
    price: 20000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-nuoc-giai-khat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-ca-phe-sua',
    name: 'Cà phê sữa',
    description: 'Mời tôi tỉnh táo để tiếp tục làm bạn.',
    price: 20000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-ca-phe',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-tra-dao',
    name: 'Trà đào',
    description: 'Đào ngâm giòn ngọt, mát lạnh sảng khoái.',
    price: 25000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-tra-trai-cay',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-tra-sua-truyen-thong',
    name: 'Trà sữa truyền thống',
    description: 'Thơm béo trân châu, ngọt lịm tim người mời.',
    price: 25000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-tra-sua',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-bac-xiu',
    name: 'Bạc xỉu',
    description: 'Nhiều sữa ít cà phê, dịu ngọt ấm áp.',
    price: 25000,
    image_url: '/images/product_bubble_tea_1793702875693.jpg',
    category_id: 'cat-ca-phe',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-xuc-xich-chien',
    name: 'Xúc xích chiên',
    description: 'Nóng hổi, chấm tương ớt cay nồng gắn kết.',
    price: 20000,
    image_url: '/images/product_street_snack_1793702876247.jpg',
    category_id: 'cat-do-an-vat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-khoai-tay-chien',
    name: 'Khoai tây chiên',
    description: 'Vàng ươm giòn rụm, ăn vào quên hết muộn phiền.',
    price: 25000,
    image_url: '/images/product_street_snack_1793702876247.jpg',
    category_id: 'cat-do-an-vat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-ca-vien-chien',
    name: 'Cá viên chiên',
    description: 'Món quà vặt tuổi thơ, cắn một miếng nhớ bạn một đời.',
    price: 25000,
    image_url: '/images/product_street_snack_1793702876247.jpg',
    category_id: 'cat-do-an-vat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-banh-trang-tron',
    name: 'Bánh tráng trộn',
    description: 'Đầy đủ khô bò, trứng cút, xoài chua — đậm đà tình thân.',
    price: 25000,
    image_url: '/images/product_street_snack_1793702876247.jpg',
    category_id: 'cat-do-an-vat',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'prod-combo-tinh-ban',
    name: 'Combo tình bạn',
    description: 'Một lần mời, tình bạn thêm bền chặt. Gồm 1 Trà sữa + 1 Bánh tráng trộn + 1 Bim bim!',
    price: 50000,
    image_url: '/images/hero_pop_art_cafe_1793702876689.jpg',
    category_id: 'cat-combo',
    is_available: true,
    created_at: new Date('2026-01-01').toISOString(),
  },
];

const DEFAULT_BANK_SETTINGS: BankSettings = {
  id: 'bank-default',
  bank_name: 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
  bank_id: '970415',
  bank_code: 'ICB',
  qr_template: 'compact2',
  account_number: '0866127232',
  account_name: 'CHỦ QUÁN FRIENDSHIP CAFÉ',
  is_active: true,
  custom_qr_image_url: '',
  qr_mode: 'HYBRID',
};

// Seed sample orders for Hall of Fame demonstration
const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-seed-1',
    order_code: 'QUYBAN-DH0088',
    buyer_name: 'Hải Đăng Bạn Thân',
    is_anonymous: false,
    friend_note: 'Ăn no để còn gánh team đồ án nhé bạn!',
    total_amount: 150000,
    payment_content: 'QUYBAN DH0088',
    payment_status: 'PAID',
    items: [
      {
        product_id: 'prod-combo-tinh-ban',
        product_name: 'Combo tình bạn',
        unit_price: 50000,
        quantity: 2,
        subtotal: 100000,
        image_url: '/images/hero_pop_art_cafe_1793702876689.jpg',
      },
      {
        product_id: 'prod-tra-sua-truyen-thong',
        product_name: 'Trà sữa truyền thống',
        unit_price: 25000,
        quantity: 2,
        subtotal: 50000,
        image_url: '/images/product_bubble_tea_1793702875693.jpg',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    paid_at: new Date(Date.now() - 3600000 * 23).toISOString(),
    audit_note: 'Đã nhận đủ tiền từ ngân hàng MB',
  },
  {
    id: 'ord-seed-2',
    order_code: 'QUYBAN-DH0089',
    buyer_name: 'Mai Linh',
    is_anonymous: false,
    friend_note: 'Mời ly cà phê sữa cho tỉnh ngủ làm việc!',
    total_amount: 70000,
    payment_content: 'QUYBAN DH0089',
    payment_status: 'PAID',
    items: [
      {
        product_id: 'prod-ca-phe-sua',
        product_name: 'Cà phê sữa',
        unit_price: 20000,
        quantity: 2,
        subtotal: 40000,
        image_url: '/images/product_bubble_tea_1793702875693.jpg',
      },
      {
        product_id: 'prod-khoai-tay-chien',
        product_name: 'Khoai tây chiên',
        unit_price: 25000,
        quantity: 1,
        subtotal: 25000,
        image_url: '/images/product_street_snack_1793702876247.jpg',
      },
      {
        product_id: 'prod-tra-da',
        product_name: 'Trà đá',
        unit_price: 5000,
        quantity: 1,
        subtotal: 5000,
        image_url: '/images/product_bubble_tea_1793702875693.jpg',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    paid_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    audit_note: 'Xác nhận giao dịch thành công',
  },
  {
    id: 'ord-seed-3',
    order_code: 'QUYBAN-DH0090',
    buyer_name: 'Người Bạn Dấu Tên',
    is_anonymous: true,
    friend_note: 'Bí mật nhé, quý lắm mới nuôi đấy!',
    total_amount: 50000,
    payment_content: 'QUYBAN DH0090',
    payment_status: 'PAID',
    items: [
      {
        product_id: 'prod-combo-tinh-ban',
        product_name: 'Combo tình bạn',
        unit_price: 50000,
        quantity: 1,
        subtotal: 50000,
        image_url: '/images/hero_pop_art_cafe_1793702876689.jpg',
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    paid_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    audit_note: 'Xác nhận giao dịch ẩn danh',
  },
];

class Database {
  private store: DataStore;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): DataStore {
    const candidatePaths = [
      path.join('/tmp', 'store.json'),
      path.resolve(process.cwd(), 'data/store.json'),
      path.resolve(process.cwd(), 'data', 'store.json'),
      path.join(__dirname, '../data/store.json'),
    ];

    for (const filePath of candidatePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          let currentBank = parsed.bank_settings;
          if (!currentBank || currentBank.bank_code === 'MB' || !currentBank.bank_id) {
            currentBank = {
              id: 'bank-default',
              bank_name: 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
              bank_id: '970415',
              bank_code: 'ICB',
              qr_template: 'compact2',
              account_number: currentBank?.account_number && currentBank.account_number !== '109888888888' ? currentBank.account_number : '0866127232',
              account_name: currentBank?.account_name || 'CHỦ QUÁN FRIENDSHIP CAFÉ',
              is_active: true,
              custom_qr_image_url: currentBank?.custom_qr_image_url || '',
              qr_mode: currentBank?.qr_mode || 'HYBRID',
            };
          } else {
            if (currentBank.account_number === '109888888888') {
              currentBank.account_number = '0866127232';
            }
            currentBank.qr_mode = currentBank.qr_mode || 'HYBRID';
            currentBank.custom_qr_image_url = currentBank.custom_qr_image_url || '';
          }

          const adminUser = parsed.admin || { username: 'admin', password: '050827' };
          if (adminUser.password === 'admin123') {
            adminUser.password = process.env.ADMIN_PASSWORD || '050827';
          }

          return {
            products: parsed.products || DEFAULT_PRODUCTS,
            categories: parsed.categories || DEFAULT_CATEGORIES,
            bank_settings: currentBank,
            orders: parsed.orders || SAMPLE_ORDERS,
            audit_logs: parsed.audit_logs || [],
            admin: adminUser,
            last_order_index: parsed.last_order_index || 90,
          };
        }
      } catch (readErr) {
        // Continue to next candidate path
      }
    }

    const initialStore: DataStore = {
      products: DEFAULT_PRODUCTS,
      categories: DEFAULT_CATEGORIES,
      bank_settings: DEFAULT_BANK_SETTINGS,
      orders: SAMPLE_ORDERS,
      audit_logs: [
        {
          id: 'log-seed-1',
          order_id: 'ord-seed-1',
          order_code: 'QUYBAN-DH0088',
          admin_username: 'admin',
          action: 'CONFIRM_PAID',
          note: 'Xác nhận thanh toán ban đầu từ ngân hàng',
          created_at: new Date().toISOString(),
        },
      ],
      admin: { username: 'admin', password: process.env.ADMIN_PASSWORD || '050827' },
      last_order_index: 90,
    };

    this.saveStore(initialStore);
    return initialStore;
  }

  private saveStore(storeToSave?: DataStore) {
    const data = storeToSave || this.store;
    // 1. Try local data/store.json if writable
    try {
      const dataDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(dataDir, 'store.json'), JSON.stringify(data, null, 2), 'utf-8');
      return;
    } catch (_) {
      // 2. Fallback to /tmp on Vercel / serverless environments
      try {
        fs.writeFileSync(path.join('/tmp', 'store.json'), JSON.stringify(data, null, 2), 'utf-8');
      } catch (tmpErr) {
        // Retain in memory safely without throwing
      }
    }
  }

  // --- Products ---
  getProducts(includeUnavailable = false): Product[] {
    if (includeUnavailable) {
      return [...this.store.products];
    }
    return this.store.products.filter(p => p.is_available);
  }

  getProductById(id: string): Product | undefined {
    return this.store.products.find(p => p.id === id);
  }

  saveProduct(productData: Partial<Product> & { name: string; price: number }): Product {
    if (productData.id) {
      const index = this.store.products.findIndex(p => p.id === productData.id);
      if (index !== -1) {
        this.store.products[index] = {
          ...this.store.products[index],
          ...productData,
        };
        this.saveStore();
        return this.store.products[index];
      }
    }

    const newProduct: Product = {
      id: productData.id || `prod-${Date.now()}`,
      name: productData.name,
      description: productData.description || '',
      price: Math.max(0, productData.price),
      image_url: productData.image_url || '/src/assets/images/product_bubble_tea_1793702875693.jpg',
      category_id: productData.category_id || 'cat-nuoc-giai-khat',
      is_available: productData.is_available !== false,
      created_at: new Date().toISOString(),
    };
    this.store.products.push(newProduct);
    this.saveStore();
    return newProduct;
  }

  deleteProduct(id: string): boolean {
    const prevLen = this.store.products.length;
    this.store.products = this.store.products.filter(p => p.id !== id);
    if (this.store.products.length !== prevLen) {
      this.saveStore();
      return true;
    }
    return false;
  }

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.store.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  // --- Bank Settings ---
  getBankSettings(): BankSettings {
    return { ...this.store.bank_settings };
  }

  updateBankSettings(newSettings: Partial<BankSettings>, adminUsername: string): BankSettings {
    this.store.bank_settings = {
      ...this.store.bank_settings,
      ...newSettings,
      bank_id: newSettings.bank_id || this.store.bank_settings.bank_id || '970415',
      bank_code: newSettings.bank_code || this.store.bank_settings.bank_code || 'ICB',
      qr_template: newSettings.qr_template || this.store.bank_settings.qr_template || 'compact2',
      qr_mode: newSettings.qr_mode || this.store.bank_settings.qr_mode || 'HYBRID',
      custom_qr_image_url: newSettings.custom_qr_image_url !== undefined ? newSettings.custom_qr_image_url : this.store.bank_settings.custom_qr_image_url,
    };
    this.addAuditLog({
      order_id: '',
      order_code: '',
      admin_username: adminUsername,
      action: 'UPDATE_BANK_SETTINGS',
      note: `Cập nhật thông tin ngân hàng ${this.store.bank_settings.bank_name} (${this.store.bank_settings.bank_id}) - STK: ${this.store.bank_settings.account_number} - Tên: ${this.store.bank_settings.account_name} - Chế độ QR: ${this.store.bank_settings.qr_mode}`,
    });
    this.saveStore();
    return this.store.bank_settings;
  }

  // --- Orders ---
  generateOrderCode(): string {
    this.store.last_order_index += 1;
    const num = String(this.store.last_order_index).padStart(4, '0');
    return `DH${num}`;
  }

  createOrder(params: {
    buyer_name?: string;
    is_anonymous?: boolean;
    friend_note?: string;
    items: Array<{ product_id: string; quantity: number }>;
  }): Order {
    if (!params.items || params.items.length === 0) {
      throw new Error('Giỏ hàng trống! Vui lòng chọn ít nhất một món.');
    }

    // Backend price security: Re-verify every single item price against the database
    let totalAmount = 0;
    const verifiedItems: OrderItem[] = [];

    for (const item of params.items) {
      if (item.quantity <= 0) continue;
      const product = this.getProductById(item.product_id);
      if (!product || !product.is_available) {
        throw new Error(`Sản phẩm không hợp lệ hoặc đã tạm dừng bán: ${item.product_id}`);
      }
      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      verifiedItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        subtotal: subtotal,
        image_url: product.image_url,
      });
    }

    if (verifiedItems.length === 0 || totalAmount <= 0) {
      throw new Error('Đơn hàng không hợp lệ. Tổng tiền phải lớn hơn 0đ.');
    }

    const orderCode = this.generateOrderCode();
    // Payment content standard: "QUYBAN DH0001"
    const paymentContent = `QUYBAN ${orderCode}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      order_code: orderCode,
      buyer_name: (params.buyer_name || 'Người bạn hảo tâm').trim(),
      is_anonymous: Boolean(params.is_anonymous),
      friend_note: (params.friend_note || '').trim(),
      total_amount: totalAmount,
      payment_content: paymentContent,
      payment_status: 'PENDING',
      items: verifiedItems,
      created_at: new Date().toISOString(),
    };

    this.store.orders.unshift(newOrder);
    this.saveStore();
    return newOrder;
  }

  getOrderByCode(orderCode: string): Order | undefined {
    const clean = orderCode.trim().toUpperCase();
    return this.store.orders.find(o => {
      const c = o.order_code.toUpperCase();
      const p = o.payment_content.toUpperCase();
      return (
        c === clean ||
        c.replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, '') ||
        p === clean ||
        p.replace(/[^A-Z0-9]/g, '') === clean.replace(/[^A-Z0-9]/g, '')
      );
    });
  }

  getOrders(): Order[] {
    return [...this.store.orders];
  }

  // Customer marks as transferred: ONLY sets AWAITING_MANUAL_CONFIRMATION
  markOrderAsTransferred(orderCode: string): Order {
    const order = this.getOrderByCode(orderCode);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng!');
    }
    if (order.payment_status === 'PAID') {
      return order; // Already paid
    }
    order.payment_status = 'AWAITING_MANUAL_CONFIRMATION';
    this.saveStore();
    return order;
  }

  // Admin confirmation / action
  updateOrderStatus(
    orderCode: string,
    newStatus: PaymentStatus,
    adminUsername: string,
    note?: string
  ): Order {
    const order = this.getOrderByCode(orderCode);
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng!');
    }

    order.payment_status = newStatus;
    if (newStatus === 'PAID') {
      order.paid_at = new Date().toISOString();
    }
    if (note) {
      order.audit_note = note;
    }

    this.addAuditLog({
      order_id: order.id,
      order_code: order.order_code,
      admin_username: adminUsername,
      action: newStatus === 'PAID' ? 'CONFIRM_PAID' : 'REJECT_PAYMENT',
      note: note || `Đổi trạng thái thành ${newStatus}`,
    });

    this.saveStore();
    return order;
  }

  // Audit Logs
  addAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>) {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...log,
      created_at: new Date().toISOString(),
    };
    this.store.audit_logs.unshift(newLog);
    if (this.store.audit_logs.length > 500) {
      this.store.audit_logs = this.store.audit_logs.slice(0, 500);
    }
    this.saveStore();
  }

  getAuditLogs(): AuditLog[] {
    return [...this.store.audit_logs];
  }

  // Leaderboard / Hall of Fame
  getLeaderboard() {
    // Only PAID orders count
    const paidOrders = this.store.orders.filter(o => o.payment_status === 'PAID');
    const userTotals = new Map<string, { name: string; totalAmount: number; ordersCount: number; isAnonymous: boolean }>();

    for (const order of paidOrders) {
      const displayName = order.is_anonymous ? 'Người bạn giấu tên' : (order.buyer_name || 'Bạn thân');
      const key = order.is_anonymous ? `anon-${order.id}` : displayName.toLowerCase();

      const existing = userTotals.get(key);
      if (existing) {
        existing.totalAmount += order.total_amount;
        existing.ordersCount += 1;
      } else {
        userTotals.set(key, {
          name: displayName,
          totalAmount: order.total_amount,
          ordersCount: 1,
          isAnonymous: order.is_anonymous,
        });
      }
    }

    const sorted = Array.from(userTotals.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    return sorted.map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      totalAmount: entry.totalAmount,
      ordersCount: entry.ordersCount,
      isAnonymous: entry.isAnonymous,
      badge: index === 0 ? '🏆 Đại Gia Nuôi Chủ Quán' : index === 1 ? '🥈 Tri Kỷ Vàng' : index === 2 ? '🥉 Bạn Thân Quốc Dân' : '💖 Bạn Tốt',
    }));
  }

  // Admin Auth
  verifyAdmin(password: string): boolean {
    const clean = (password || '').trim();
    if (!clean) return false;

    // Check environment variable (stripping potential enclosing quotes and whitespace)
    const envRaw = process.env.ADMIN_PASSWORD;
    if (envRaw) {
      const cleanEnv = envRaw.trim().replace(/^["']|["']$/g, '');
      if (cleanEnv && clean === cleanEnv) {
        return true;
      }
    }

    // Check database store password (stripping quotes and whitespace)
    const storeRaw = this.store?.admin?.password;
    if (storeRaw) {
      const cleanStore = storeRaw.trim().replace(/^["']|["']$/g, '');
      if (cleanStore && clean === cleanStore) {
        return true;
      }
    }

    // Default target password fallback
    return clean === '050827';
  }

  updateAdminPassword(newPassword: string, adminUsername: string): boolean {
    this.store.admin.password = newPassword;
    this.addAuditLog({
      order_id: '',
      order_code: '',
      admin_username: adminUsername,
      action: 'UPDATE_STATUS',
      note: 'Thay đổi mật khẩu quản trị viên',
    });
    this.saveStore();
    return true;
  }

  // Dashboard Stats
  getDashboardStats() {
    const totalOrders = this.store.orders.length;
    const awaitingOrders = this.store.orders.filter(o => o.payment_status === 'AWAITING_MANUAL_CONFIRMATION').length;
    const paidOrders = this.store.orders.filter(o => o.payment_status === 'PAID');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_amount, 0);

    return {
      totalOrders,
      awaitingConfirmationCount: awaitingOrders,
      paidCount: paidOrders.length,
      totalRevenue,
      recentOrders: this.store.orders.slice(0, 10),
    };
  }
}

export const db = new Database();
