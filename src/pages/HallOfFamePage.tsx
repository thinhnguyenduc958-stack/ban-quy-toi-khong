import React, { useEffect, useState } from 'react';
import { Trophy, Award, Sparkles, Heart, Crown, Shield } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { formatVND } from '../utils/format';

interface HallOfFamePageProps {
  onBackToMenu: () => void;
}

export const HallOfFamePage: React.FC<HallOfFamePageProps> = ({ onBackToMenu }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLeaderboard(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-10">
      {/* Title Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFE14D] border-2 border-[#171717] rounded-full shadow-pop-sm text-xs font-comic font-black uppercase">
          <Trophy className="w-4 h-4 text-[#F44336]" />
          <span>VINH DANH NHÀ TÀI TRỢ VÀNG</span>
        </div>
        <h1 className="font-comic text-3xl sm:text-5xl font-black text-[#171717]">
          BẢNG VÀNG <span className="text-[#F44336]">TÌNH BẠN</span>
        </h1>
        <p className="font-display font-medium text-sm sm:text-base text-gray-700 max-w-xl mx-auto">
          Danh sách những người bạn tuyệt vời nhất đã hào phóng chiêu đãi chủ quán qua các đơn thanh toán thành công!
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="font-comic text-lg animate-pulse">ĐANG TẢI DỮ LIỆU BẢNG VÀNG...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-lg p-8 text-center max-w-md mx-auto space-y-4">
          <div className="text-5xl">🏆</div>
          <h3 className="font-comic text-xl font-bold">Chưa có ai lên Bảng Vàng!</h3>
          <p className="text-sm text-gray-600">
            Hãy là người đầu tiên mời chủ quán một ly trà sữa để giành vị trí Quán Quân nhé!
          </p>
          <button
            onClick={onBackToMenu}
            className="px-5 py-2.5 bg-[#FFE14D] font-comic text-xs font-black rounded-xl border-2 border-[#171717] shadow-pop"
          >
            MỜI MÓN ĐẦU TIÊN
          </button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium (Retro Pop Art Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6">
            {/* Top 2 - Silver */}
            {top2 && (
              <div className="order-2 md:order-1 bg-white rounded-3xl border-4 border-[#171717] shadow-pop-lg p-6 text-center space-y-3 relative hover:translate-y-[-2px] transition-transform">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 border-3 border-[#171717] shadow-pop-sm flex items-center justify-center text-3xl">
                  🥈
                </div>
                <span className="inline-block px-3 py-1 bg-gray-200 border border-[#171717] rounded-full text-xs font-comic font-black text-[#171717]">
                  HẠNG NHÌ
                </span>
                <h3 className="font-display font-black text-lg text-[#171717] truncate">
                  {top2.name}
                </h3>
                <p className="font-comic text-xl font-black text-[#2678F3] tabular-nums">
                  {formatVND(top2.totalAmount)}
                </p>
                <div className="text-[11px] font-semibold text-gray-600 bg-[#FFF4DF] py-1 px-2 rounded-lg border border-[#171717]">
                  {top2.badge}
                </div>
              </div>
            )}

            {/* Top 1 - Gold (Center, Elevated) */}
            {top1 && (
              <div className="order-1 md:order-2 bg-[#FFE14D] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-8 text-center space-y-3 relative scale-105 z-10 hover:translate-y-[-2px] transition-transform">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#F44336] text-white p-2.5 rounded-full border-3 border-[#171717] shadow-pop-sm">
                  <Crown className="w-6 h-6 fill-yellow-300 text-yellow-300" />
                </div>
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white border-3 border-[#171717] shadow-pop flex items-center justify-center text-4xl pt-2">
                  🥇
                </div>
                <span className="inline-block px-4 py-1 bg-[#F44336] text-white border-2 border-[#171717] rounded-full text-xs font-comic font-black uppercase">
                  QUÁN QUÂN TÌNH BẠN
                </span>
                <h3 className="font-display font-black text-xl text-[#171717] truncate">
                  {top1.name}
                </h3>
                <p className="font-comic text-2xl font-black text-[#F44336] tabular-nums">
                  {formatVND(top1.totalAmount)}
                </p>
                <div className="text-xs font-bold text-[#171717] bg-white py-1.5 px-3 rounded-xl border-2 border-[#171717] shadow-pop-sm">
                  {top1.badge}
                </div>
              </div>
            )}

            {/* Top 3 - Bronze */}
            {top3 && (
              <div className="order-3 bg-white rounded-3xl border-4 border-[#171717] shadow-pop-lg p-6 text-center space-y-3 relative hover:translate-y-[-2px] transition-transform">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border-3 border-[#171717] shadow-pop-sm flex items-center justify-center text-3xl">
                  🥉
                </div>
                <span className="inline-block px-3 py-1 bg-amber-200 border border-[#171717] rounded-full text-xs font-comic font-black text-[#171717]">
                  HẠNG BA
                </span>
                <h3 className="font-display font-black text-lg text-[#171717] truncate">
                  {top3.name}
                </h3>
                <p className="font-comic text-xl font-black text-[#FF70A6] tabular-nums">
                  {formatVND(top3.totalAmount)}
                </p>
                <div className="text-[11px] font-semibold text-gray-600 bg-[#FFF4DF] py-1 px-2 rounded-lg border border-[#171717]">
                  {top3.badge}
                </div>
              </div>
            )}
          </div>

          {/* Full Ranked Table (Rest of the list) */}
          {rest.length > 0 && (
            <div className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-xl overflow-hidden mt-8">
              <div className="bg-[#2678F3] text-white p-4 border-b-4 border-[#171717] flex justify-between items-center">
                <span className="font-comic text-sm font-black uppercase">
                  DANH SÁCH BẠN TỐT TIẾP THEO
                </span>
                <span className="text-xs font-bold bg-[#FFE14D] text-[#171717] px-2.5 py-0.5 rounded-lg border border-[#171717]">
                  {rest.length} người
                </span>
              </div>
              <div className="divide-y-2 divide-gray-100">
                {rest.map(entry => (
                  <div
                    key={entry.rank}
                    className="p-4 flex items-center justify-between hover:bg-[#FFF4DF]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-gray-100 border-2 border-[#171717] flex items-center justify-center font-comic font-black text-xs text-gray-700">
                        #{entry.rank}
                      </span>
                      <div>
                        <h4 className="font-display font-bold text-sm text-[#171717]">
                          {entry.name}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">{entry.badge}</p>
                      </div>
                    </div>
                    <span className="font-comic font-black text-sm text-[#F44336] tabular-nums">
                      {formatVND(entry.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* CTA bottom */}
      <div className="text-center pt-4">
        <button
          onClick={onBackToMenu}
          className="px-6 py-3.5 bg-[#F44336] hover:bg-red-600 text-white font-comic text-sm font-black rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>MỜI MÓN ĐỂ LÊN BẢNG VÀNG</span>
        </button>
      </div>
    </div>
  );
};
