import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import '../styles/admin-login.css';

interface AdminLoginPageProps {
  onLoginSuccess: (token?: string) => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkingInitialSession, setCheckingInitialSession] = useState(true);

  // Check if already authenticated on mount
  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      try {
        const storedToken = sessionStorage.getItem('friendship_admin_session_token');
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch('/api/admin/session', {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.authenticated && isMounted) {
            onLoginSuccess(storedToken || data?.token);
            return;
          }
        }
      } catch (_) {
        // Not authenticated or network issue - remain on login page
      } finally {
        if (isMounted) {
          setCheckingInitialSession(false);
        }
      }
    };

    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu quản trị viên.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: cleanPassword,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (_) {
          throw new Error('Máy chủ phản hồi định dạng dữ liệu không hợp lệ.');
        }
      } else {
        const text = await res.text();
        throw new Error(`Máy chủ không phản hồi JSON (Mã ${res.status}): ${text.slice(0, 100)}`);
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Mật khẩu quản trị viên không chính xác. Vui lòng thử lại!');
      }

      // Store token as secondary header fallback (HttpOnly cookie is set by server)
      if (data.token) {
        sessionStorage.setItem('friendship_admin_session_token', data.token);
      }

      setPassword('');
      onLoginSuccess(data.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Mật khẩu quản trị viên không chính xác. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingInitialSession) {
    return (
      <div className="admin-login-scope">
        <div className="admin-login-card text-center" style={{ maxWidth: '360px', padding: '2rem 1.5rem' }}>
          <div className="admin-lock-badge">
            <Loader2 className="w-8 h-8 animate-spin text-[#171717]" />
          </div>
          <p className="font-comic text-sm font-black text-[#171717]">
            ĐANG KIỂM TRA PHIÊN QUẢN TRỊ...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-scope">
      <div className="admin-login-card">
        {/* Yellow Lock Icon Badge */}
        <div className="admin-lock-badge">
          <Lock className="w-8 h-8 text-[#171717]" strokeWidth={2.5} />
        </div>

        {/* Title & Description */}
        <h1 className="admin-login-title">
          ĐĂNG NHẬP QUẢN TRỊ
        </h1>
        <p className="admin-login-desc">
          Khu vực dành riêng cho chủ quán quản lý hệ thống.
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="admin-input-group">
            <label className="admin-label" htmlFor="admin-password">
              Mật khẩu quản trị
            </label>
            <div className="admin-input-wrapper">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Nhập mật khẩu quản trị..."
                className="admin-password-input"
                autoComplete="current-password"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="admin-toggle-pwd-btn"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-[#f44336]" />
                ) : (
                  <Eye className="w-5 h-5 text-[#2678f3]" />
                )}
              </button>
            </div>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="admin-error-box" role="alert">
              <AlertCircle className="w-5 h-5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Red Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="admin-submit-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>ĐANG XÁC THỰC...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>ĐĂNG NHẬP</span>
              </>
            )}
          </button>

          {/* Return to website button */}
          <button
            type="button"
            onClick={onNavigateHome}
            disabled={isLoading}
            className="admin-back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại website</span>
          </button>
        </form>

        <div className="admin-brand-tag">
          Bạn Quý Tôi Không? • Friendship Café
        </div>
      </div>
    </div>
  );
};
