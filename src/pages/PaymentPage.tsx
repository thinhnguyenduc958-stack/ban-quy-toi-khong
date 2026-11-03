import React, { useState, useEffect } from 'react';
import { Copy, Check, QrCode, ShieldAlert, ArrowLeft, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Order, BankSettings } from '../types';
import { formatVND } from '../utils/format';
import { playDing, playFanfare } from '../utils/audio';

interface PaymentPageProps {
  order: Order;
  bank: BankSettings;
  qrUrl: string;
  onBackToMenu: () => void;
  onSuccess: (order: Order) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  order: initialOrder,
  bank,
  qrUrl,
  onBackToMenu,
  onSuccess,
}) => {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [isAwaitingManual, setIsAwaitingManual] = useState(
    initialOrder.payment_status === 'AWAITING_MANUAL_CONFIRMATION'
  );

  // Active view for QR: 'dynamic' or 'uploaded'
  const initialQrView = bank.qr_mode === 'UPLOADED_IMAGE' && bank.custom_qr_image_url
    ? 'uploaded'
    : 'dynamic';
  const [activeQrView, setActiveQrView] = useState<'dynamic' | 'uploaded'>(initialQrView);
  const [dynamicQrFailed, setDynamicQrFailed] = useState(false);

  // Copy helpers
  const handleCopy = (text: string, type: 'acc' | 'content' | 'amount') => {
    navigator.clipboard.writeText(text);
    playDing();
    if (type === 'acc') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else if (type === 'content') {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // Customer clicks "Tôi đã chuyển khoản"
  const handleConfirmTransfer = async () => {
    setSubmittingTransfer(true);
    try {
      const res = await fetch(`/api/orders/${order.order_code}/transfer-done`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
        setIsAwaitingManual(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingTransfer(false);
    }
  };

  // Poll order status every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${order.order_code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            setOrder(data.order);
            if (data.order.payment_status === 'PAID') {
              playFanfare();
              clearInterval(interval);
              onSuccess(data.order);
            } else if (data.order.payment_status === 'AWAITING_MANUAL_CONFIRMATION') {
              setIsAwaitingManual(true);
            }
          }
        }
      } catch (e) {
        // quiet poll fail
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [order.order_code, onSuccess]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={onBackToMenu}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#171717] font-display font-bold text-xs rounded-xl border-2 border-[#171717] shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về thực đơn</span>
        </button>
      </div>

      {/* Main Payment Container */}
      <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl overflow-hidden">
        {/* Banner Top */}
        <div className="bg-[#FFE14D] border-b-4 border-[#171717] p-6 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F44336] text-white font-comic text-xs font-bold rounded-full border-2 border-[#171717] shadow-pop-sm uppercase">
            {activeQrView === 'uploaded' ? <ImageIcon className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
            <span>
              {activeQrView === 'uploaded'
                ? 'Mã QR VietinBank của chủ quán'
                : 'Thanh toán VietQR tự động'}
            </span>
          </div>
          <h1 className="font-comic text-2xl sm:text-4xl font-black text-[#171717]">
            QUÉT MÃ ĐỂ NUÔI CHỦ QUÁN HÔM NAY!
          </h1>
          <p className="font-display font-semibold text-xs sm:text-sm text-gray-800">
            Mở <strong>VietinBank iPay</strong> hoặc ứng dụng ngân hàng bất kỳ để quét mã QR bên dưới
          </p>
        </div>

        {/* Content Body: 2 Columns (QR Left, Bank Info & Actions Right) */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Column 1: QR Code Card */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative p-4 bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-lg max-w-[340px] w-full text-center space-y-3">
              {/* Optional view toggle if both options are available */}
              {bank.custom_qr_image_url && (
                <div className="flex bg-white rounded-xl p-1 border-2 border-[#171717] shadow-sm">
                  <button
                    type="button"
                    onClick={() => setActiveQrView('dynamic')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-comic text-xs font-bold transition-all ${
                      activeQrView === 'dynamic'
                        ? 'bg-[#2678F3] text-white shadow-pop-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    VietQR Tự Động
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQrView('uploaded')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-comic text-xs font-bold transition-all ${
                      activeQrView === 'uploaded'
                        ? 'bg-[#FFE14D] text-[#171717] shadow-pop-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Ảnh QR Gốc
                  </button>
                </div>
              )}

              {/* QR Image Frame */}
              <div className="bg-white p-3 rounded-2xl border-2 border-[#171717] shadow-inner">
                {activeQrView === 'uploaded' && bank.custom_qr_image_url ? (
                  <img
                    src={bank.custom_qr_image_url}
                    alt={`VietinBank QR ${bank.account_name}`}
                    className="w-full max-h-[280px] object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <img
                    src={dynamicQrFailed && bank.custom_qr_image_url ? bank.custom_qr_image_url : qrUrl}
                    alt={`VietQR ${order.order_code}`}
                    className="w-full max-h-[280px] object-contain mx-auto"
                    onError={() => {
                      setDynamicQrFailed(true);
                      if (bank.custom_qr_image_url) {
                        setActiveQrView('uploaded');
                      }
                    }}
                  />
                )}
              </div>

              {/* Amount badge */}
              <div className="bg-[#FFE14D] py-1.5 px-4 rounded-xl border-2 border-[#171717] flex items-center justify-between shadow-pop-sm">
                <span className="font-bold text-xs text-gray-800">Cần chuyển:</span>
                <span className="font-comic font-black text-lg text-[#F44336] tabular-nums">
                  {formatVND(order.total_amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.total_amount.toString(), 'amount')}
                  className="p-1 bg-white hover:bg-gray-100 rounded-lg border border-[#171717] text-[10px] font-bold"
                  title="Sao chép số tiền"
                >
                  {copiedAmount ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-gray-600 font-medium">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#171717] bg-white px-2 py-0.5 rounded-md border border-[#171717]">
                  {order.order_code}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Bank Details & Confirmation */}
          <div className="md:col-span-6 space-y-5">
            <div className="space-y-3">
              {/* Bank Name */}
              <div className="p-3 bg-[#FFF4DF] rounded-2xl border-2 border-[#171717] flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Ngân hàng</p>
                  <p className="font-display font-black text-sm text-[#171717]">{bank.bank_name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">BIN: {bank.bank_id || '970415'} • VietinBank iPay</p>
                </div>
                <span className="font-comic text-xs font-black px-2 py-0.5 bg-[#2678F3] text-white rounded-lg border border-[#171717]">
                  {bank.bank_code || 'ICB'}
                </span>
              </div>

              {/* Account Number */}
              <div className="p-3 bg-[#FFF4DF] rounded-2xl border-2 border-[#171717] flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Số tài khoản</p>
                  <p className="font-mono font-bold text-base text-[#171717] tabular-nums">
                    {bank.account_number}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(bank.account_number, 'acc')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-xs font-bold rounded-xl border-2 border-[#171717] shadow-pop-sm flex items-center gap-1 cursor-pointer"
                >
                  {copiedAcc ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAcc ? 'Đã chép' : 'Sao chép số TK'}</span>
                </button>
              </div>

              {/* Account Name */}
              <div className="p-3 bg-[#FFF4DF] rounded-2xl border-2 border-[#171717]">
                <p className="text-[11px] font-bold text-gray-600 uppercase">Chủ tài khoản</p>
                <p className="font-display font-black text-sm text-[#171717] uppercase">
                  {bank.account_name}
                </p>
              </div>

              {/* Transfer Description */}
              <div className="p-3 bg-[#FFE14D]/40 rounded-2xl border-2 border-[#171717] flex justify-between items-center">
                <div>
                  <p className="text-[11px] font-bold text-gray-600 uppercase">Nội dung chuyển khoản</p>
                  <p className="font-comic font-black text-sm text-[#F44336]">
                    {order.payment_content}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(order.payment_content, 'content')}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-xs font-bold rounded-xl border-2 border-[#171717] shadow-pop-sm flex items-center gap-1 cursor-pointer"
                >
                  {copiedContent ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContent ? 'Đã chép' : 'Sao chép nội dung'}</span>
                </button>
              </div>
            </div>

            {/* Status / Confirmation Area */}
            {isAwaitingManual ? (
              <div className="p-4 bg-[#2678F3]/10 border-3 border-[#2678F3] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-sm font-comic font-black text-[#2678F3]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ĐÃ BÁO CHO CHỦ QUÁN!</span>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed font-medium">
                  Đơn hàng đang chờ chủ quán kiểm tra giao dịch tài khoản VietinBank. Màn hình sẽ tự động chuyển sang trang cảm ơn ngay khi được duyệt!
                </p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleConfirmTransfer}
                  disabled={submittingTransfer}
                  className="w-full py-3.5 bg-[#2678F3] hover:bg-blue-600 text-white font-comic text-base font-black rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-sm active:translate-x-[4px] active:translate-y-[4px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingTransfer ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-[#FFE14D]" />
                      <span>TÔI ĐÃ CHUYỂN KHOẢN</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Chủ quán sẽ kiểm tra biến động số dư thực tế trước khi duyệt đơn.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="bg-[#FFF4DF] border-t-4 border-[#171717] p-6">
          <h4 className="font-comic text-sm font-black text-[#171717] mb-3">
            CHI TIẾT MÓN BẠN ĐÃ CHỌN CHIÊU ĐÃI:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between p-2 bg-white rounded-xl border border-[#171717]">
                <span className="font-semibold text-gray-800">
                  {it.product_name} x {it.quantity}
                </span>
                <span className="font-bold tabular-nums text-[#F44336]">
                  {formatVND(it.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
