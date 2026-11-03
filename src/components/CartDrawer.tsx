import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingCart, MessageSquare, User, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/format';
import { Order, BankSettings } from '../types';

interface CartDrawerProps {
  onProceedToPayment: (order: Order, bank: BankSettings, qrUrl: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToPayment }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalAmount,
    totalCount,
    isCartOpen,
    setIsCartOpen,
    buyerName,
    setBuyerName,
    isAnonymous,
    setIsAnonymous,
    friendNote,
    setFriendNote,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        buyer_name: buyerName.trim() || 'Người bạn hảo tâm',
        is_anonymous: isAnonymous,
        friend_note: friendNote.trim(),
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi khi tạo đơn hàng');
      }

      // Order created successfully!
      setIsCartOpen(false);
      clearCart();
      onProceedToPayment(data.order, data.bank, data.qr_url);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFF4DF] border-l-4 border-[#171717] shadow-pop-xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#FFE14D] border-b-4 border-[#171717] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#F44336] text-white rounded-xl border-2 border-[#171717] shadow-pop-sm">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-comic text-xl font-black text-[#171717]">GIỎ MỜI CHỦ QUÁN</h2>
                <p className="text-xs font-semibold text-[#171717]/80">
                  {totalCount > 0 ? `${totalCount} món đang chờ tài trợ` : 'Đang đói bụng chờ bạn'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 bg-white hover:bg-gray-100 border-2 border-[#171717] rounded-xl shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <X className="w-5 h-5 text-[#171717]" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-24 h-24 rounded-full bg-[#FFE14D] border-4 border-[#171717] flex items-center justify-center shadow-pop">
                  <span className="text-4xl">🥺</span>
                </div>
                <h3 className="font-comic text-lg font-bold text-[#171717]">
                  Ủa, vào quán mà không gọi món à?
                </h3>
                <p className="text-sm text-gray-700 max-w-xs leading-relaxed">
                  Chủ quán đang đói lắm đấy. Hãy chọn ngay một ly trà đá hay gói bim bim để thắt chặt tình bạn nhé!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 bg-[#2678F3] text-white font-display font-bold text-sm rounded-xl border-2 border-[#171717] shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  XEM THỰC ĐƠN NGAY
                </button>
              </div>
            ) : (
              <>
                {/* Items List */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-white rounded-2xl border-2 border-[#171717] shadow-pop flex items-center gap-3"
                    >
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-[#171717] shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-sm text-[#171717] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs font-semibold text-[#F44336] tabular-nums mt-0.5">
                          {formatVND(item.product.price)}
                        </p>
                        {/* Stepper */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-[#FFE14D] border border-[#171717] flex items-center justify-center font-bold text-xs hover:bg-yellow-400"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black px-1.5 tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-[#FFE14D] border border-[#171717] flex items-center justify-center font-bold text-xs hover:bg-yellow-400"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right shrink-0">
                        <p className="font-comic text-xs font-black text-[#171717] tabular-nums">
                          {formatVND(item.product.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="mt-2 text-gray-400 hover:text-[#F44336] transition-colors p-1"
                          title="Xóa món này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Donor Customization Fields */}
                <div className="bg-[#FFE14D]/40 p-4 rounded-2xl border-2 border-[#171717] shadow-pop space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#171717] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#2678F3]" />
                      Tên / Biệt danh của bạn:
                    </label>
                    <label className="text-xs flex items-center gap-1 cursor-pointer select-none font-semibold">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        className="rounded border-[#171717] text-[#F44336] focus:ring-0"
                      />
                      <span>Ẩn danh</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={buyerName}
                    disabled={isAnonymous}
                    onChange={e => setBuyerName(e.target.value)}
                    placeholder={isAnonymous ? 'Đang ẩn danh' : 'Ví dụ: Tuấn Bạn Thân'}
                    className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2678F3] disabled:bg-gray-100 disabled:text-gray-400"
                  />

                  <div>
                    <label className="text-xs font-bold text-[#171717] flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#F44336]" />
                      Lời nhắn gửi chủ quán (tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={friendNote}
                      onChange={e => setFriendNote(e.target.value)}
                      placeholder="Ví dụ: Ăn no nhớ gánh team nha bạn!"
                      className="w-full px-3 py-2 bg-white rounded-xl border-2 border-[#171717] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#2678F3]"
                      maxLength={120}
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-100 border-2 border-[#F44336] rounded-xl text-xs font-bold text-[#F44336] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 bg-white border-t-4 border-[#171717] space-y-3">
              <div className="flex items-center justify-between text-base font-bold text-[#171717]">
                <span>Tổng chiêu đãi:</span>
                <span className="font-comic text-xl text-[#F44336] tabular-nums">
                  {formatVND(totalAmount)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 text-center">
                Mã QR VietQR sẽ được tạo tự động với đúng số tiền và nội dung đơn.
              </p>
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-3.5 bg-[#F44336] hover:bg-red-600 disabled:bg-gray-400 text-white font-comic text-base font-black rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ĐANG TẠO ĐƠN...</span>
                  </>
                ) : (
                  <>
                    <span>ĐI THANH TOÁN THÔI!</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
