import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, Share2, Award, ArrowLeft, Check, Sparkles, Coffee } from 'lucide-react';
import { Order } from '../types';
import { formatVND } from '../utils/format';
import { playFanfare, playDing } from '../utils/audio';

interface PaymentSuccessPageProps {
  order: Order;
  onBackToMenu: () => void;
  onViewLeaderboard: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({
  order,
  onBackToMenu,
  onViewLeaderboard,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    playFanfare();

    // Fire comic confetti burst
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFE14D', '#F44336', '#2678F3', '#FF70A6'],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFE14D', '#F44336', '#2678F3'],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFE14D', '#F44336', '#FF70A6'],
        });
      }, 400);

      return () => clearTimeout(timer);
    } catch (e) {
      // quiet fallback
    }
  }, []);

  const handleShare = async () => {
    playDing();
    const shareText = `🎉 Tớ vừa chiêu đãi chủ quán ${formatVND(order.total_amount)} tại BẠN QUÝ TÔI KHÔNG? - Friendship Café! Tình bạn chính thức được gia hạn thêm 365 ngày! Mời chủ quán tại: ${window.location.origin}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BẠN QUÝ TÔI KHÔNG? | Friendship Café',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8 text-center">
      {/* Comic Celebration Starburst Header */}
      <div className="relative inline-block mx-auto">
        <div className="w-24 h-24 mx-auto rounded-full bg-[#FFE14D] border-4 border-[#171717] shadow-pop-lg flex items-center justify-center text-5xl mb-4 animate-bounce">
          🎉
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#2678F3] text-white font-comic text-xs sm:text-sm font-black rounded-full border-2 border-[#171717] shadow-pop-sm uppercase">
          <Sparkles className="w-4 h-4 text-[#FFE14D]" />
          <span>CHỦ QUÁN ĐÃ XÁC NHẬN!</span>
        </div>
      </div>

      <div className="space-y-3">
        <h1 className="font-comic text-3xl sm:text-5xl font-black text-[#171717] tracking-tight">
          THANH TOÁN THÀNH CÔNG!
        </h1>

        <div className="p-4 bg-[#FF70A6] border-4 border-[#171717] rounded-3xl shadow-pop-lg max-w-xl mx-auto -rotate-1">
          <h2 className="font-comic text-2xl sm:text-3xl font-black text-white drop-shadow-[2px_2px_0px_#171717] flex items-center justify-center gap-2">
            TÔI QUÝ BẠN NHƯ CON TÔI VẬY <Heart className="w-6 h-6 fill-red-600 text-red-600 animate-pulse" />
          </h2>
        </div>

        <p className="font-display font-semibold text-base sm:text-lg text-gray-800 max-w-lg mx-auto leading-relaxed pt-2">
          Cảm ơn vì đã tài trợ bữa ăn hôm nay. Tình bạn của chúng ta chính thức được{' '}
          <span className="text-[#F44336] font-black underline decoration-wavy">gia hạn thêm 365 ngày!</span>
        </p>
      </div>

      {/* Friendship Certificate Card */}
      <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-8 text-left max-w-lg mx-auto relative overflow-hidden">
        {/* Certificate Stamp */}
        <div className="absolute top-4 right-4 bg-[#FFE14D] border-2 border-[#171717] rounded-xl px-2.5 py-1 text-[11px] font-comic font-black text-[#171717] rotate-6 shadow-pop-sm">
          CHỨNG NHẬN BẠN THÂN
        </div>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-[#F44336] text-white rounded-xl border-2 border-[#171717] shadow-pop-sm">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-comic text-base font-black text-[#171717]">
              CHỨNG CHỈ TÀI TRỢ ẨM THỰC
            </h3>
            <p className="text-xs text-gray-600 font-medium">BẠN QUÝ TÔI KHÔNG? CAFÉ</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs sm:text-sm font-medium border-t-2 border-b-2 border-dashed border-gray-300 py-4 my-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Mã giao dịch:</span>
            <span className="font-mono font-bold text-[#171717]">{order.order_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nhà tài trợ:</span>
            <span className="font-bold text-[#171717]">
              {order.is_anonymous ? 'Người bạn giấu tên' : order.buyer_name}
            </span>
          </div>
          {order.friend_note && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 shrink-0">Lời nhắn:</span>
              <span className="font-semibold text-right italic text-gray-800">
                "{order.friend_note}"
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-800 font-bold">Số tiền đã chiêu đãi:</span>
            <span className="font-comic text-lg font-black text-[#F44336] tabular-nums">
              {formatVND(order.total_amount)}
            </span>
          </div>
        </div>

        <p className="text-center text-xs font-bold text-gray-500 italic">
          ★ Tình bạn này đã được bảo lưu trọn đời trong cơ sở dữ liệu ★
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <button
          onClick={handleShare}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic text-sm font-black rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
        >
          {copiedShare ? <Check className="w-4 h-4 text-green-700" /> : <Share2 className="w-4 h-4 text-[#F44336]" />}
          <span>{copiedShare ? 'ĐÃ SAO CHÉP LỜI KHOE!' : 'KHOE VỚI HỘI BẠN'}</span>
        </button>

        <button
          onClick={onViewLeaderboard}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#2678F3] hover:bg-blue-600 text-white font-comic text-sm font-black rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
        >
          <Award className="w-4 h-4 text-[#FFE14D]" />
          <span>XEM BẢNG VÀNG</span>
        </button>

        <button
          onClick={onBackToMenu}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-gray-100 text-[#171717] font-display text-sm font-bold rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </button>
      </div>
    </div>
  );
};
