import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Lock, LogOut, DollarSign, Clock, CheckCircle2,
  AlertCircle, Package, Settings, FileText, Search, Plus, Edit2,
  Trash2, Eye, QrCode, Database, KeyRound, Loader2, Check,
  UploadCloud, Image as ImageIcon, RefreshCw, XCircle, Sparkles
} from 'lucide-react';
import { Order, BankSettings, Product, Category, AuditLog, DashboardStats, PaymentQrMode } from '../types';
import { formatVND, VIETNAM_BANKS } from '../utils/format';
import { playDing } from '../utils/audio';

interface AdminPageProps {
  onClose: () => void;
  categories: Category[];
  onRefreshProducts: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onClose,
  categories,
  onRefreshProducts,
}) => {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('friendship_admin_token'));
  const [usernameInput, setUsernameInput] = useState('admin');
  const [passwordInput, setPasswordInput] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifyingAuth, setVerifyingAuth] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'bank' | 'audit' | 'supabase'>('dashboard');

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Orders Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Products Management
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  // Bank Settings
  const [bankSettings, setBankSettings] = useState<BankSettings>({
    id: 'bank-default',
    bank_name: 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
    bank_id: '970415',
    bank_code: 'ICB',
    qr_template: 'compact2',
    account_number: '109888888888',
    account_name: 'CHỦ QUÁN FRIENDSHIP CAFÉ',
    is_active: true,
    custom_qr_image_url: '',
    qr_mode: 'HYBRID',
  });
  const [savingBank, setSavingBank] = useState(false);
  const [bankSavedMsg, setBankSavedMsg] = useState(false);

  // QR Upload state
  const [uploadingQr, setUploadingQr] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Password & Supabase
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [supabaseSql, setSupabaseSql] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleLogout = (msg?: string | React.MouseEvent) => {
    localStorage.removeItem('friendship_admin_token');
    setToken(null);
    if (typeof msg === 'string') {
      setLoginError(msg);
    } else {
      setLoginError(null);
    }
  };

  // Safe fetch helper that guarantees JSON parsing and eliminates <!DOCTYPE HTML syntax errors
  const safeAdminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';
    let data: any = null;

    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch (err: any) {
        throw new Error('Dữ liệu trả về từ máy chủ không đúng chuẩn JSON');
      }
    } else {
      const text = await res.text();
      if (res.status === 401 || res.status === 403) {
        handleLogout('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        throw new Error('Phiên đăng nhập không hợp lệ');
      }
      throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}): ${text.slice(0, 80)}`);
    }

    if (res.status === 401 || res.status === 403) {
      handleLogout(data?.error || 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      throw new Error(data?.error || 'Phiên đăng nhập không hợp lệ');
    }

    if (!res.ok) {
      throw new Error(data?.error || `Lỗi máy chủ (${res.status})`);
    }

    return data;
  };

  // Verify token on mount / refresh and load data if valid
  useEffect(() => {
    if (token) {
      let isMounted = true;
      setVerifyingAuth(true);

      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json') && res.ok) {
            const data = await res.json();
            if (data.valid && isMounted) {
              fetchDashboardStats();
              fetchOrders();
              fetchAdminProducts();
              fetchBankSettings();
              fetchAuditLogs();
              fetchSupabaseSql();
              return;
            }
          }
          if (isMounted) {
            handleLogout('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
        })
        .catch((err) => {
          console.error('Lỗi kiểm tra token:', err);
          if (isMounted) {
            handleLogout('Không thể xác thực phiên đăng nhập.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setVerifyingAuth(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const username = usernameInput.trim();
      const password = passwordInput.trim();

      if (!username || !password) {
        throw new Error('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      }

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (err: any) {
          throw new Error('Không thể đọc phản hồi JSON từ máy chủ');
        }
      } else {
        const text = await res.text();
        throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}): ${text.slice(0, 100)}`);
      }

      if (!res.ok || !data?.token) {
        throw new Error(data?.error || 'Tên đăng nhập hoặc mật khẩu không chính xác');
      }

      localStorage.setItem('friendship_admin_token', data.token);
      setToken(data.token);
      setLoginError(null);
    } catch (err: any) {
      setLoginError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await safeAdminFetch('/api/admin/stats');
      setStats(data);
    } catch (e: any) {
      console.error('fetchDashboardStats error:', e.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await safeAdminFetch(`/api/admin/orders?status=${statusFilter}&search=${encodeURIComponent(searchQuery)}`);
      setOrders(data);
    } catch (e: any) {
      console.error('fetchOrders error:', e.message);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const data = await safeAdminFetch('/api/admin/products');
      setAdminProducts(data);
    } catch (e: any) {
      console.error('fetchAdminProducts error:', e.message);
    }
  };

  const fetchBankSettings = async () => {
    try {
      const data = await safeAdminFetch('/api/bank-settings');
      setBankSettings(data);
    } catch (e: any) {
      console.error('fetchBankSettings error:', e.message);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await safeAdminFetch('/api/admin/audit-logs');
      setAuditLogs(data);
    } catch (e: any) {
      console.error('fetchAuditLogs error:', e.message);
    }
  };

  const fetchSupabaseSql = async () => {
    try {
      const res = await fetch('/api/admin/supabase-sql', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const text = await res.text();
        setSupabaseSql(text);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Order action: Confirm PAID or Reject
  const handleOrderAction = async (orderCode: string, action: 'CONFIRM_PAID' | 'REJECT_PAYMENT' | 'SET_PENDING') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderCode}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, note: actionNote.trim() }),
      });
      if (res.ok) {
        playDing();
        setActionNote('');
        setSelectedOrder(null);
        fetchOrders();
        fetchDashboardStats();
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name || typeof editingProduct.price !== 'number') return;

    try {
      const isEdit = !!editingProduct.id;
      const url = isEdit ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        playDing();
        setProductModalOpen(false);
        setEditingProduct(null);
        fetchAdminProducts();
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminProducts();
        onRefreshProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save bank settings
  const handleSaveBankSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      const res = await fetch('/api/admin/bank-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankSettings),
      });
      if (res.ok) {
        playDing();
        setBankSavedMsg(true);
        setTimeout(() => setBankSavedMsg(false), 2500);
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingBank(false);
    }
  };

  // Upload custom QR image
  const handleProcessQrFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    // Validate mime type: PNG, JPG, JPEG, WEBP
    const validMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validMimes.includes(file.type.toLowerCase()) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      setUploadError('Định dạng không hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setUploadingQr(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/admin/upload-qr', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              image: base64Data,
              fileName: file.name,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Tải ảnh lên thất bại');
          }
          playDing();
          setUploadSuccess('Đã tải ảnh mã QR VietinBank thành công!');
          if (data.bank || data.bank_settings) {
            setBankSettings(data.bank_settings || data.bank);
          }
          fetchAuditLogs();
          setTimeout(() => setUploadSuccess(null), 3000);
        } catch (err: any) {
          setUploadError(err.message || 'Lỗi xử lý file ảnh');
        } finally {
          setUploadingQr(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Không thể đọc file ảnh.');
        setUploadingQr(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi chọn file');
      setUploadingQr(false);
    }
  };

  // Delete custom QR image
  const handleDeleteQrImage = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa ảnh QR ngân hàng đã tải lên?')) return;
    setUploadingQr(true);
    setUploadError(null);
    try {
      const res = await fetch('/api/admin/delete-qr', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xóa ảnh thất bại');
      }
      playDing();
      setUploadSuccess('Đã xóa ảnh mã QR thành công!');
      if (data.bank || data.bank_settings) {
        setBankSettings(data.bank_settings || data.bank);
      }
      fetchAuditLogs();
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi xóa ảnh');
    } finally {
      setUploadingQr(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) return;
    try {
      const res = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        playDing();
        setPasswordSuccess(true);
        setNewPassword('');
        setTimeout(() => setPasswordSuccess(false), 3000);
        fetchAuditLogs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // RENDER: LOADING STATE WHILE VERIFYING TOKEN
  // ==========================================
  if (verifyingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-8 space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFE14D] border-3 border-[#171717] shadow-pop-sm flex items-center justify-center text-3xl animate-bounce">
            🔐
          </div>
          <h2 className="font-comic text-xl font-black text-[#171717]">
            ĐANG KIỂM TRA PHIÊN QUẢN TRỊ...
          </h2>
          <p className="text-xs text-gray-700 font-medium">
            Hệ thống đang xác thực quyền truy cập
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN MODAL IF NOT LOGGED IN
  // ==========================================
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFE14D] border-3 border-[#171717] shadow-pop-sm flex items-center justify-center text-3xl">
              🔐
            </div>
            <h2 className="font-comic text-2xl font-black text-[#171717]">
              ĐĂNG NHẬP QUẢN TRỊ
            </h2>
            <p className="text-xs text-gray-700 font-medium">
              Khu vực dành riêng cho chủ quán kiểm tra giao dịch VietQR
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#171717] uppercase block mb-1">
                Tên đăng nhập:
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-semibold"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#171717] uppercase block mb-1">
                Mật khẩu:
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-semibold"
                placeholder="admin123"
                required
              />
            </div>

            <div className="p-2.5 bg-[#FFE14D]/40 rounded-xl border border-[#171717] text-[11px] text-gray-700 font-medium">
              💡 Mặc định: <strong className="font-mono">admin</strong> / <strong className="font-mono">admin123</strong> (có thể đổi trong cài đặt)
            </div>

            {loginError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loginLoading}
                className="flex-1 py-3 bg-[#F44336] hover:bg-red-600 disabled:bg-gray-400 text-white font-comic text-sm font-black rounded-xl border-2 border-[#171717] shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                {loginLoading ? 'ĐANG ĐĂNG NHẬP...' : 'VÀO TRANG QUẢN TRỊ'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 bg-white text-[#171717] font-bold text-sm rounded-xl border-2 border-[#171717] shadow-pop-sm"
              >
                Thoát
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: FULL ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Top Admin Bar */}
      <div className="bg-[#FFE14D] border-4 border-[#171717] rounded-3xl shadow-pop-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#F44336] text-white rounded-2xl border-2 border-[#171717] shadow-pop-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-comic text-xl sm:text-2xl font-black text-[#171717]">
              BẢNG ĐIỀU KHIỂN CHỦ QUÁN
            </h1>
            <p className="text-xs font-bold text-gray-800">
              Friendship Café • Retro Pop Art Administration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-[#171717] font-display font-bold text-xs sm:text-sm rounded-xl border-2 border-[#171717] shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            Về Cửa Hàng
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F44336] text-white font-display font-bold text-xs sm:text-sm rounded-xl border-2 border-[#171717] shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-gray-300">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => {
            setActiveTab('orders');
            fetchOrders();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'orders'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Đơn hàng ({stats?.awaitingConfirmationCount || 0} chờ duyệt)
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'products'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Món ăn & Nước
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'bank'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Quản lý mã QR nhận tiền
        </button>
        <button
          onClick={() => {
            setActiveTab('audit');
            fetchAuditLogs();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'audit'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Lịch sử kiểm tra
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-comic font-black border-2 border-[#171717] whitespace-nowrap transition-all ${
            activeTab === 'supabase'
              ? 'bg-[#2678F3] text-white shadow-pop'
              : 'bg-white text-[#171717] hover:bg-gray-100'
          }`}
        >
          Supabase SQL & Mật khẩu
        </button>
      </div>

      {/* ===================================== */}
      {/* TAB 1: DASHBOARD STATS */}
      {/* ===================================== */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white p-5 rounded-3xl border-4 border-[#171717] shadow-pop-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Tổng doanh thu</span>
                <div className="p-2 bg-[#FFE14D] rounded-xl border border-[#171717]">
                  <DollarSign className="w-5 h-5 text-[#F44336]" />
                </div>
              </div>
              <p className="font-comic text-2xl font-black text-[#F44336] tabular-nums">
                {formatVND(stats.totalRevenue)}
              </p>
              <p className="text-[11px] text-gray-500">Từ các đơn đã xác nhận PAID</p>
            </div>

            {/* Awaiting Confirmation */}
            <div className="bg-[#FFF4DF] p-5 rounded-3xl border-4 border-[#171717] shadow-pop-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Chờ duyệt tiền</span>
                <div className="p-2 bg-[#2678F3] text-white rounded-xl border border-[#171717]">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="font-comic text-2xl font-black text-[#2678F3] tabular-nums">
                {stats.awaitingConfirmationCount} đơn
              </p>
              <p className="text-[11px] text-gray-600">Khách đã nhấn "Đã chuyển khoản"</p>
            </div>

            {/* Paid Orders */}
            <div className="bg-white p-5 rounded-3xl border-4 border-[#171717] shadow-pop-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Đơn thành công</span>
                <div className="p-2 bg-green-100 rounded-xl border border-[#171717]">
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                </div>
              </div>
              <p className="font-comic text-2xl font-black text-green-700 tabular-nums">
                {stats.paidCount} đơn
              </p>
              <p className="text-[11px] text-gray-500">Đã tính vào Bảng Vàng</p>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-3xl border-4 border-[#171717] shadow-pop-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase">Tổng số đơn</span>
                <div className="p-2 bg-gray-100 rounded-xl border border-[#171717]">
                  <FileText className="w-5 h-5 text-[#171717]" />
                </div>
              </div>
              <p className="font-comic text-2xl font-black text-[#171717] tabular-nums">
                {stats.totalOrders} đơn
              </p>
              <p className="text-[11px] text-gray-500">Tất cả trạng thái</p>
            </div>
          </div>

          {/* Quick Recent Orders */}
          <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl overflow-hidden">
            <div className="p-4 bg-[#FFE14D] border-b-4 border-[#171717] flex justify-between items-center">
              <h3 className="font-comic text-base font-black text-[#171717]">
                ĐƠN HÀNG MỚI NHẤT
              </h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-[#F44336] hover:underline"
              >
                Xem tất cả đơn
              </button>
            </div>
            <div className="divide-y-2 divide-gray-100">
              {stats.recentOrders.slice(0, 5).map(o => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#171717]">{o.order_code}</span>
                      <span className="text-xs text-gray-500">· {o.buyer_name}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {o.items.map(it => `${it.product_name} x${it.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-comic font-black text-sm text-[#F44336] tabular-nums">
                      {formatVND(o.total_amount)}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      o.payment_status === 'PAID'
                        ? 'bg-green-100 text-green-800 border-green-700'
                        : o.payment_status === 'AWAITING_MANUAL_CONFIRMATION'
                        ? 'bg-blue-100 text-blue-800 border-blue-700'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-700'
                    }`}>
                      {o.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* TAB 2: ORDERS MANAGEMENT */}
      {/* ===================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border-3 border-[#171717] shadow-pop">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, tên khách..."
                className="px-3 py-1.5 bg-[#FFF4DF] rounded-xl border border-[#171717] text-xs font-bold"
              />
              <button
                onClick={fetchOrders}
                className="px-3 py-1.5 bg-[#FFE14D] rounded-xl border border-[#171717] text-xs font-bold"
              >
                Lọc
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {['ALL', 'AWAITING_MANUAL_CONFIRMATION', 'PAID', 'PENDING', 'PAYMENT_REJECTED'].map(st => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    statusFilter === st
                      ? 'bg-[#171717] text-white border-[#171717]'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả' : st === 'AWAITING_MANUAL_CONFIRMATION' ? 'Chờ duyệt' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FFE14D] border-b-2 border-[#171717] font-comic font-black text-[#171717]">
                  <tr>
                    <th className="p-3">MÃ ĐƠN</th>
                    <th className="p-3">NGƯỜI MỜI</th>
                    <th className="p-3">NỘI DUNG CK</th>
                    <th className="p-3">SỐ TIỀN</th>
                    <th className="p-3">TRẠNG THÁI</th>
                    <th className="p-3">THỜI GIAN</th>
                    <th className="p-3 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-yellow-50/50">
                      <td className="p-3 font-mono font-bold text-[#171717]">{o.order_code}</td>
                      <td className="p-3 font-medium">
                        {o.buyer_name} {o.is_anonymous && '(Ẩn danh)'}
                      </td>
                      <td className="p-3 font-comic font-bold text-blue-700">{o.payment_content}</td>
                      <td className="p-3 font-comic font-black text-[#F44336] tabular-nums">
                        {formatVND(o.total_amount)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.payment_status === 'PAID'
                            ? 'bg-green-100 text-green-800 border-green-700'
                            : o.payment_status === 'AWAITING_MANUAL_CONFIRMATION'
                            ? 'bg-blue-100 text-blue-800 border-blue-700 animate-pulse'
                            : o.payment_status === 'PAYMENT_REJECTED'
                            ? 'bg-red-100 text-red-800 border-red-700'
                            : 'bg-yellow-100 text-yellow-800 border-yellow-700'
                        }`}>
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 font-medium">
                        {new Date(o.created_at).toLocaleTimeString('vi-VN')}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 bg-[#2678F3] text-white font-bold rounded-lg border border-[#171717] shadow-pop-sm text-[11px]"
                        >
                          Chi tiết & Duyệt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Detail & Approval Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-lg bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start border-b-2 border-gray-300 pb-3">
                  <div>
                    <span className="text-xs font-bold text-gray-500">CHI TIẾT ĐƠN HÀNG</span>
                    <h3 className="font-comic text-xl font-black text-[#171717]">
                      {selectedOrder.order_code}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-1.5 bg-white rounded-lg border border-[#171717]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <p><strong>Người chuyển:</strong> {selectedOrder.buyer_name}</p>
                  <p><strong>Nội dung chuyển khoản cần đối soát:</strong> <span className="font-comic font-black text-[#2678F3] text-sm">{selectedOrder.payment_content}</span></p>
                  <p><strong>Số tiền:</strong> <span className="font-comic font-black text-[#F44336] text-sm">{formatVND(selectedOrder.total_amount)}</span></p>
                  {selectedOrder.friend_note && (
                    <p className="p-2.5 bg-white rounded-xl border border-[#171717] italic">
                      "Lời nhắn: {selectedOrder.friend_note}"
                    </p>
                  )}
                </div>

                {/* Items */}
                <div className="bg-white p-3 rounded-2xl border-2 border-[#171717] space-y-1.5">
                  <p className="text-xs font-bold text-gray-600 uppercase">Món đã đặt:</p>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-none">
                      <span>{it.product_name} x {it.quantity}</span>
                      <span className="font-bold tabular-nums">{formatVND(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Audit note input */}
                <div>
                  <label className="text-xs font-bold text-[#171717] block mb-1">
                    Ghi chú đối soát ngân hàng:
                  </label>
                  <input
                    type="text"
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="Ví dụ: Đã thấy tiền về MB Bank lúc 14:02"
                    className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-xs font-medium"
                  />
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleOrderAction(selectedOrder.order_code, 'CONFIRM_PAID')}
                    disabled={actionLoading}
                    className="py-2.5 bg-green-500 hover:bg-green-600 text-white font-comic font-black text-xs rounded-xl border-2 border-[#171717] shadow-pop-sm flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>XÁC NHẬN ĐÃ NHẬN TIỀN (PAID)</span>
                  </button>

                  <button
                    onClick={() => handleOrderAction(selectedOrder.order_code, 'REJECT_PAYMENT')}
                    disabled={actionLoading}
                    className="py-2.5 bg-[#F44336] hover:bg-red-600 text-white font-comic font-black text-xs rounded-xl border-2 border-[#171717] shadow-pop-sm flex items-center justify-center gap-1.5"
                  >
                    <span>TỪ CHỐI THANH TOÁN</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================== */}
      {/* TAB 3: PRODUCTS MANAGEMENT */}
      {/* ===================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border-3 border-[#171717] shadow-pop">
            <div>
              <h3 className="font-comic text-base font-black text-[#171717]">
                QUẢN LÝ THỰC ĐƠN ({adminProducts.length} món)
              </h3>
              <p className="text-xs text-gray-600">Thêm, sửa giá, đổi ảnh hoặc ẩn món ăn vặt & nước uống</p>
            </div>
            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  description: '',
                  price: 20000,
                  category_id: categories[1]?.id || 'cat-tra-sua',
                  image_url: '/src/assets/images/product_bubble_tea_1793702875693.jpg',
                  is_available: true,
                });
                setProductModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FFE14D] hover:bg-yellow-400 font-comic text-xs font-black rounded-xl border-2 border-[#171717] shadow-pop-sm"
            >
              <Plus className="w-4 h-4" />
              <span>THÊM MÓN MỚI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminProducts.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border-3 border-[#171717] shadow-pop p-4 flex gap-3 items-center justify-between">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-[#171717] shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-sm text-[#171717] truncate">{p.name}</h4>
                  <p className="font-comic text-xs font-black text-[#F44336] tabular-nums">{formatVND(p.price)}</p>
                  <p className="text-[11px] text-gray-500 truncate">{p.description}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setProductModalOpen(true);
                    }}
                    className="p-1.5 bg-[#2678F3] text-white rounded-lg border border-[#171717] shadow-pop-sm"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg border border-[#171717] hover:bg-red-200"
                    title="Xóa món"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add / Edit Product Modal */}
          {productModalOpen && editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 space-y-4">
                <h3 className="font-comic text-lg font-black text-[#171717]">
                  {editingProduct.id ? 'CHỈNH SỬA SẢN PHẨM' : 'THÊM MÓN MỚI'}
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold block mb-1">Tên món:</label>
                    <input
                      type="text"
                      value={editingProduct.name || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Mô tả hài hước:</label>
                    <input
                      type="text"
                      value={editingProduct.description || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-xs font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold block mb-1">Giá (VNĐ):</label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={editingProduct.price || 0}
                        onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value, 10) || 0 })}
                        required
                        className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold block mb-1">Danh mục:</label>
                      <select
                        value={editingProduct.category_id || categories[1]?.id}
                        onChange={e => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-xs font-semibold"
                      >
                        {categories.filter(c => c.id !== 'cat-all').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1">Đường dẫn ảnh:</label>
                    <input
                      type="text"
                      value={editingProduct.image_url || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="avail"
                      checked={editingProduct.is_available !== false}
                      onChange={e => setEditingProduct({ ...editingProduct, is_available: e.target.checked })}
                    />
                    <label htmlFor="avail" className="text-xs font-bold">Mở bán món này</label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#FFE14D] font-comic font-black text-xs rounded-xl border-2 border-[#171717] shadow-pop-sm"
                    >
                      LƯU SẢN PHẨM
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductModalOpen(false)}
                      className="py-2.5 px-4 bg-white font-bold text-xs rounded-xl border-2 border-[#171717]"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================== */}
      {/* TAB 4: QUẢN LÝ MÃ QR NHẬN TIỀN */}
      {/* ===================================== */}
      {activeTab === 'bank' && (
        <div className="space-y-6">
          {/* Top Banner Notice */}
          <div className="bg-[#FFE14D] p-5 rounded-3xl border-4 border-[#171717] shadow-pop flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#F44336] text-white font-comic text-xs font-black rounded-full border-2 border-[#171717]">
                  VIETINBANK ICB • BIN 970415
                </span>
                <span className={`px-3 py-1 font-comic text-xs font-black rounded-full border-2 border-[#171717] ${
                  bankSettings.custom_qr_image_url
                    ? 'bg-green-400 text-[#171717]'
                    : 'bg-white text-gray-700'
                }`}>
                  {bankSettings.custom_qr_image_url ? '✓ ĐÃ TẢI ẢNH QR' : 'CHƯA CÓ ẢNH QR TẢI LÊN'}
                </span>
              </div>
              <h2 className="font-comic text-xl sm:text-2xl font-black text-[#171717]">
                QUẢN LÝ MÃ QR NHẬN TIỀN
              </h2>
              <p className="text-xs text-gray-800 font-medium">
                Cấu hình số tài khoản VietinBank, tải ảnh QR nhận tiền và chọn chế độ hiển thị QR cho khách hàng.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#2678F3] hover:bg-blue-600 text-white font-comic text-xs font-black rounded-xl border-2 border-[#171717] shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{bankSettings.custom_qr_image_url ? 'THAY ẢNH QR MỚI' : 'TẢI ẢNH QR LÊN'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left 7 cols: Configuration & Upload Form */}
            <div className="md:col-span-7 space-y-6">
              {/* Box 1: Chế độ thanh toán */}
              <div className="bg-white p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-comic text-base font-black text-[#171717] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#2678F3]" />
                    <span>CHẾ ĐỘ THANH TOÁN QR</span>
                  </h3>
                  <span className="text-[11px] font-bold text-gray-500">Khách hàng sẽ thấy QR theo chế độ này</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Mode A */}
                  <div
                    onClick={() => setBankSettings({ ...bankSettings, qr_mode: 'UPLOADED_IMAGE' })}
                    className={`p-3.5 rounded-2xl border-3 border-[#171717] cursor-pointer transition-all ${
                      bankSettings.qr_mode === 'UPLOADED_IMAGE'
                        ? 'bg-[#FFE14D] shadow-pop-sm translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-comic font-black text-xs text-[#171717]">A. QR ảnh tải lên</span>
                      <ImageIcon className="w-4 h-4 text-[#F44336]" />
                    </div>
                    <p className="text-[11px] text-gray-700 leading-snug">
                      Hiển thị ảnh QR VietinBank do Admin tải lên.
                    </p>
                  </div>

                  {/* Mode B */}
                  <div
                    onClick={() => setBankSettings({ ...bankSettings, qr_mode: 'VIETQR_DYNAMIC' })}
                    className={`p-3.5 rounded-2xl border-3 border-[#171717] cursor-pointer transition-all ${
                      bankSettings.qr_mode === 'VIETQR_DYNAMIC'
                        ? 'bg-[#FFE14D] shadow-pop-sm translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-comic font-black text-xs text-[#171717]">B. VietQR tự động</span>
                      <QrCode className="w-4 h-4 text-[#2678F3]" />
                    </div>
                    <p className="text-[11px] text-gray-700 leading-snug">
                      Tự động nhúng số tiền & mã đơn hàng (QUYBAN DHxxxx).
                    </p>
                  </div>

                  {/* Mode C */}
                  <div
                    onClick={() => setBankSettings({ ...bankSettings, qr_mode: 'HYBRID' })}
                    className={`p-3.5 rounded-2xl border-3 border-[#171717] cursor-pointer transition-all ${
                      bankSettings.qr_mode === 'HYBRID' || !bankSettings.qr_mode
                        ? 'bg-[#FFE14D] shadow-pop-sm translate-x-[-1px] translate-y-[-1px]'
                        : 'bg-white hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-comic font-black text-xs text-[#171717]">C. Kết hợp (Tối ưu)</span>
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-gray-700 leading-snug">
                      Ưu tiên VietQR tự động; chuyển sang ảnh tải lên nếu cần.
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Tải ảnh mã QR lên */}
              <div className="bg-white p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-comic text-base font-black text-[#171717] flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-[#F44336]" />
                    <span>TẢI ẢNH MÃ QR VIETINBANK</span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {bankSettings.custom_qr_image_url ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-800 rounded-full text-[11px] font-bold border border-green-600">
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                        Đã tải lên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-bold border border-gray-400">
                        <AlertCircle className="w-3 h-3 text-gray-500" />
                        Chưa có ảnh
                      </span>
                    )}
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleProcessQrFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-3 border-dashed text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-[#2678F3] bg-blue-50 scale-[1.01]'
                      : 'border-[#171717] bg-[#FFF4DF]/50 hover:bg-[#FFE14D]/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessQrFile(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadingQr ? (
                    <div className="py-4 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2678F3]" />
                      <p className="text-xs font-bold text-gray-700">Đang tải và tối ưu ảnh QR VietinBank...</p>
                    </div>
                  ) : bankSettings.custom_qr_image_url ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <div className="w-24 h-24 bg-white rounded-xl border-2 border-[#171717] p-1.5 shadow-pop-sm shrink-0">
                        <img
                          src={bankSettings.custom_qr_image_url}
                          alt="VietinBank QR Admin"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <p className="font-comic font-black text-sm text-[#171717]">
                          Ảnh QR VietinBank đang hoạt động
                        </p>
                        <p className="text-xs text-gray-600">
                          Kéo thả ảnh mới vào đây hoặc bấm để thay thế. Hỗ trợ PNG, JPG, JPEG, WEBP (≤ 5MB).
                        </p>
                        <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="px-3 py-1 bg-[#FFE14D] font-comic text-[11px] font-black rounded-lg border border-[#171717] shadow-pop-sm hover:bg-yellow-400"
                          >
                            THAY ẢNH QR MỚI
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQrImage();
                            }}
                            className="px-3 py-1 bg-red-100 text-red-700 font-comic text-[11px] font-black rounded-lg border border-red-500 hover:bg-red-200"
                          >
                            XÓA ẢNH QR
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#FFE14D] border-2 border-[#171717] shadow-pop-sm flex items-center justify-center">
                        <UploadCloud className="w-6 h-6 text-[#171717]" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-comic font-black text-sm text-[#171717]">
                          Kéo thả ảnh mã QR VietinBank vào đây
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                          hoặc <span className="text-[#2678F3] underline font-bold">bấm để chọn file từ máy tính/điện thoại</span>
                        </p>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono">
                        Định dạng: PNG, JPG, JPEG, WEBP • Dung lượng tối đa: 5MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Status Alerts */}
                {uploadSuccess && (
                  <div className="p-3 bg-green-100 border-2 border-green-600 rounded-xl text-xs font-bold text-green-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    <span>{uploadSuccess}</span>
                  </div>
                )}
                {uploadError && (
                  <div className="p-3 bg-red-100 border-2 border-red-600 rounded-xl text-xs font-bold text-red-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Box 3: Thông tin tài khoản nhận tiền */}
              <div className="bg-white p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl space-y-4">
                <h3 className="font-comic text-base font-black text-[#171717]">
                  THÔNG TIN TÀI KHOẢN NGÂN HÀNG (VIETINBANK)
                </h3>

                <form onSubmit={handleSaveBankSettings} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold block mb-1">Mã BIN (BANK_ID):</label>
                      <input
                        type="text"
                        value={bankSettings.bank_id || '970415'}
                        onChange={e => setBankSettings({ ...bankSettings, bank_id: e.target.value })}
                        required
                        placeholder="970415"
                        className="w-full px-3 py-2 bg-[#FFF4DF] rounded-xl border-2 border-[#171717] text-sm font-mono font-bold"
                      />
                      <span className="text-[10px] text-gray-500">VietinBank mặc định: 970415</span>
                    </div>

                    <div>
                      <label className="text-xs font-bold block mb-1">Mã ngân hàng (Bank Code):</label>
                      <input
                        type="text"
                        value={bankSettings.bank_code || 'ICB'}
                        onChange={e => setBankSettings({ ...bankSettings, bank_code: e.target.value.toUpperCase() })}
                        required
                        placeholder="ICB"
                        className="w-full px-3 py-2 bg-[#FFF4DF] rounded-xl border-2 border-[#171717] text-sm font-mono font-bold uppercase"
                      />
                      <span className="text-[10px] text-gray-500">VietinBank mã hệ thống: ICB</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Tên ngân hàng hiển thị:</label>
                    <input
                      type="text"
                      value={bankSettings.bank_name}
                      onChange={e => setBankSettings({ ...bankSettings, bank_name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Số tài khoản nhận tiền:</label>
                    <input
                      type="text"
                      value={bankSettings.account_number}
                      onChange={e => setBankSettings({ ...bankSettings, account_number: e.target.value })}
                      required
                      placeholder="109888888888"
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-mono font-bold text-[#F44336]"
                    />
                    <span className="text-[10px] text-gray-500">Lấy từ cấu hình Admin, không hardcode vào mã nguồn.</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1">Tên chủ tài khoản (viết hoa không dấu):</label>
                    <input
                      type="text"
                      value={bankSettings.account_name}
                      onChange={e => setBankSettings({ ...bankSettings, account_name: e.target.value.toUpperCase() })}
                      required
                      placeholder="NGUYEN DUC THINH"
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-bold uppercase"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bank_active"
                      checked={bankSettings.is_active}
                      onChange={e => setBankSettings({ ...bankSettings, is_active: e.target.checked })}
                      className="rounded border-[#171717] text-[#2678F3] focus:ring-0"
                    />
                    <label htmlFor="bank_active" className="text-xs font-bold text-gray-800">
                      Kích hoạt nhận thanh toán QR cho khách hàng
                    </label>
                  </div>

                  {bankSavedMsg && (
                    <div className="p-3 bg-green-100 border-2 border-green-600 rounded-xl text-xs font-bold text-green-700 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Đã lưu toàn bộ cấu hình QR và ngân hàng thành công!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={savingBank}
                    className="w-full py-3 bg-[#FFE14D] hover:bg-yellow-400 font-comic font-black text-sm rounded-xl border-2 border-[#171717] shadow-pop hover:translate-y-[1px] transition-all cursor-pointer"
                  >
                    {savingBank ? 'ĐANG LƯU...' : 'LƯU TOÀN BỘ CẤU HÌNH & CHẾ ĐỘ QR'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right 5 cols: Live Preview for Customer Experience */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-[#FFF4DF] p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl flex flex-col items-center justify-center text-center space-y-4 sticky top-6">
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-xs font-comic font-black bg-[#2678F3] text-white px-3 py-1 rounded-full border border-[#171717]">
                    XEM THỬ QR KHÁCH HÀNG
                  </span>
                  <span className="text-xs font-comic font-black bg-[#FFE14D] text-[#171717] px-2.5 py-1 rounded-full border border-[#171717]">
                    Chế độ: {bankSettings.qr_mode === 'UPLOADED_IMAGE' ? 'A. Ảnh tải lên' : bankSettings.qr_mode === 'VIETQR_DYNAMIC' ? 'B. VietQR tự động' : 'C. Kết hợp'}
                  </span>
                </div>

                {/* QR Display Card */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-[#171717] shadow-inner max-w-[260px] w-full">
                  {bankSettings.qr_mode === 'UPLOADED_IMAGE' ? (
                    bankSettings.custom_qr_image_url ? (
                      <div>
                        <img
                          src={bankSettings.custom_qr_image_url}
                          alt="VietinBank Uploaded QR"
                          className="w-full h-auto object-contain rounded-lg"
                        />
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded">
                            Ảnh QR Admin đã tải lên
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 px-2 space-y-2 text-center">
                        <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
                        <p className="text-xs font-bold text-gray-700">Chưa có ảnh QR tải lên!</p>
                        <p className="text-[11px] text-gray-500">
                          Vui lòng bấm "TẢI ẢNH QR LÊN" bên cạnh để khách thấy ảnh QR của bạn.
                        </p>
                      </div>
                    )
                  ) : (
                    /* VietQR Dynamic or Hybrid Preview */
                    <div>
                      <img
                        src={`https://img.vietqr.io/image/${encodeURIComponent(bankSettings.bank_id || '970415')}-${encodeURIComponent(bankSettings.account_number)}-${bankSettings.qr_template || 'compact2'}.png?amount=50000&addInfo=QUYBAN%20DH0001&accountName=${encodeURIComponent(bankSettings.account_name)}`}
                        alt="VietQR VietinBank Preview"
                        className="w-full h-auto object-contain"
                        onError={(e) => {
                          if (bankSettings.custom_qr_image_url) {
                            (e.target as HTMLImageElement).src = bankSettings.custom_qr_image_url;
                          }
                        }}
                      />
                      <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-medium">
                        <span>Đơn thử: 50.000đ</span>
                        <span className="font-mono text-[#F44336] font-bold">QUYBAN DH0001</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Details Box */}
                <div className="w-full space-y-1.5 p-3 bg-white rounded-2xl border-2 border-[#171717] text-left text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Ngân hàng:</span>
                    <span className="font-bold text-[#171717] truncate max-w-[170px]">{bankSettings.bank_name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Mã BIN / Code:</span>
                    <span className="font-mono font-bold text-[#2678F3]">{bankSettings.bank_id || '970415'} / {bankSettings.bank_code || 'ICB'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-gray-200">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Số tài khoản:</span>
                    <span className="font-mono font-bold text-[#F44336] text-sm tabular-nums">{bankSettings.account_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Chủ tài khoản:</span>
                    <span className="font-bold text-[#171717] uppercase">{bankSettings.account_name}</span>
                  </div>
                </div>

                {/* Hybrid status explanation */}
                {bankSettings.qr_mode === 'HYBRID' && bankSettings.custom_qr_image_url && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-300 font-medium">
                    ✓ Đã thiết lập chế độ kết hợp: Khách hàng sẽ thấy VietQR tự động và có nút xem ảnh QR gốc dự phòng!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* TAB 5: AUDIT LOGS */}
      {/* ===================================== */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 space-y-4">
          <h3 className="font-comic text-lg font-black text-[#171717]">
            LỊCH SỬ THAO TÁC QUẢN TRỊ VIÊN
          </h3>
          <div className="divide-y divide-gray-200 text-xs">
            {auditLogs.map(log => (
              <div key={log.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#171717] font-mono mr-2">[{log.action}]</span>
                  <span className="text-gray-700">{log.note}</span>
                  {log.order_code && <span className="text-blue-600 font-bold ml-1">({log.order_code})</span>}
                </div>
                <span className="text-gray-400 font-medium whitespace-nowrap ml-4">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================== */}
      {/* TAB 6: SUPABASE SQL & CHANGE PASSWORD */}
      {/* ===================================== */}
      {activeTab === 'supabase' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Change Password Card */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl space-y-4">
            <h3 className="font-comic text-base font-black text-[#171717] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#F44336]" />
              <span>ĐỔI MẬT KHẨU ADMIN</span>
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-bold block mb-1">Mật khẩu mới:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Nhập ít nhất 4 ký tự..."
                  className="w-full px-3 py-2 bg-[#FFF4DF] rounded-xl border-2 border-[#171717] text-sm font-semibold"
                />
              </div>
              {passwordSuccess && (
                <p className="text-xs font-bold text-green-700">Đã cập nhật mật khẩu mới!</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 bg-[#FFE14D] font-comic font-black text-xs rounded-xl border-2 border-[#171717] shadow-pop-sm"
              >
                CẬP NHẬT MẬT KHẨU
              </button>
            </form>
          </div>

          {/* Supabase Schema Code & Export */}
          <div className="md:col-span-7 bg-white p-6 rounded-3xl border-4 border-[#171717] shadow-pop-xl space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-comic text-base font-black text-[#171717] flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#2678F3]" />
                  <span>SUPABASE POSTGRESQL SCHEMA</span>
                </h3>
                <p className="text-xs text-gray-600">Đầy đủ DDL, RLS policies, Constraints, Indexes</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(supabaseSql);
                  playDing();
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2000);
                }}
                className="px-3 py-1.5 bg-[#FFE14D] font-comic text-xs font-black rounded-xl border-2 border-[#171717] shadow-pop-sm"
              >
                {copiedSql ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP SQL'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-green-400 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-64 border-2 border-[#171717]">
              {supabaseSql}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
