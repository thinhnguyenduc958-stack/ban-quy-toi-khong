import React, { useState } from 'react';
import { Search, ArrowRight, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Order, BankSettings } from '../types';
import { formatVND } from '../utils/format';

interface OrderStatusLookupPageProps {
  onOpenPaymentForOrder: (order: Order, bank: BankSettings, qrUrl: string) => void;
  onOpenSuccessForOrder: (order: Order) => void;
}

export const OrderStatusLookupPage: React.FC<OrderStatusLookupPageProps> = ({
  onOpenPaymentForOrder,
  onOpenSuccessForOrder,
}) => {
  const [orderCodeInput, setOrderCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [bankData, setBankData] = useState<BankSettings | null>(null);
  const [qrUrlData, setQrUrlData] = useState<string>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = orderCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);
    setFoundOrder(null);

    try {
      const res = await fetch(`/api/orders/${cleanCode}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không tìm thấy đơn hàng này');
      }
      setFoundOrder(data.order);
      setBankData(data.bank);
      setQrUrlData(data.qr_url);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tra cứu mã đơn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-700 font-bold text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ĐÃ THANH TOÁN (PAID)</span>
          </span>
        );
      case 'AWAITING_MANUAL_CONFIRMATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-700 font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>CHỜ CHỦ QUÁN XÁC NHẬN</span>
          </span>
        );
      case 'PAYMENT_REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full border border-red-700 font-bold text-xs">
            <XCircle className="w-3.5 h-3.5" />
            <span>TỪ CHỐI THANH TOÁN</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-700 font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>CHƯA THANH TOÁN</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="font-comic text-2xl sm:text-4xl font-black text-[#171717]">
          TRA CỨU TRẠNG THÁI ĐƠN HÀNG
        </h1>
        <p className="font-display font-medium text-sm text-gray-700">
          Nhập mã đơn hàng (Ví dụ: <code className="font-mono font-bold bg-[#FFE14D] px-2 py-0.5 rounded border border-[#171717]">QUYBAN-DH0088</code>) để xem tiến trình thanh toán.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={orderCodeInput}
          onChange={e => setOrderCodeInput(e.target.value)}
          placeholder="Nhập mã đơn hàng..."
          className="flex-1 px-4 py-3 bg-white rounded-2xl border-3 border-[#171717] shadow-pop text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#2678F3]"
        />
        <button
          type="submit"
          disabled={loading || !orderCodeInput.trim()}
          className="px-6 py-3 bg-[#FFE14D] hover:bg-yellow-400 disabled:bg-gray-300 text-[#171717] font-comic font-black text-sm rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Tìm</span>
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-100 border-2 border-red-500 rounded-2xl flex items-center gap-2 text-red-700 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Found Order Card */}
      {foundOrder && (
        <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 space-y-5 animate-pulse-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-gray-200 pb-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase">Mã đơn hàng</p>
              <h3 className="font-comic text-xl font-black text-[#171717]">
                {foundOrder.order_code}
              </h3>
            </div>
            <div>{getStatusBadge(foundOrder.payment_status)}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-gray-500 font-semibold">Người mời:</p>
              <p className="font-bold text-[#171717]">
                {foundOrder.is_anonymous ? 'Người bạn giấu tên' : foundOrder.buyer_name}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-semibold">Tổng tiền:</p>
              <p className="font-comic text-base font-black text-[#F44336] tabular-nums">
                {formatVND(foundOrder.total_amount)}
              </p>
            </div>
          </div>

          {/* Action based on status */}
          <div className="pt-2">
            {foundOrder.payment_status === 'PAID' ? (
              <button
                onClick={() => onOpenSuccessForOrder(foundOrder)}
                className="w-full py-3 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic font-black text-sm rounded-xl border-2 border-[#171717] shadow-pop flex items-center justify-center gap-2"
              >
                <span>XEM CHỨNG NHẬN TÌNH BẠN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => bankData && onOpenPaymentForOrder(foundOrder, bankData, qrUrlData)}
                className="w-full py-3 bg-[#2678F3] hover:bg-blue-600 text-white font-comic font-black text-sm rounded-xl border-2 border-[#171717] shadow-pop flex items-center justify-center gap-2"
              >
                <span>MỞ MÃ QR THANH TOÁN VIETQR</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
