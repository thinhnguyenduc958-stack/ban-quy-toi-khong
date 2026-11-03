import React from 'react';
import { Heart, ShieldCheck, Coffee } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-16 bg-[#FFE14D] border-t-4 border-[#171717] py-10 px-4 sm:px-8 text-[#171717]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand statement */}
        <div className="text-center md:text-left space-y-2">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="p-1.5 bg-[#F44336] text-white rounded-lg border-2 border-[#171717] shadow-pop-sm inline-flex">
              <Coffee className="w-4 h-4" />
            </span>
            <span className="font-comic text-xl font-black">BẠN QUÝ TÔI KHÔNG?</span>
          </div>
          <p className="font-display font-semibold text-sm text-[#171717]">
            "Bạn có thể không giàu, nhưng đừng để tôi đói."
          </p>
          <p className="text-xs text-gray-700 italic">
            Một món ăn nhỏ, một tình bạn lớn.
          </p>
        </div>

        {/* Central comic punchline badge */}
        <div className="p-3 bg-white rounded-2xl border-3 border-[#171717] shadow-pop text-center max-w-sm">
          <p className="font-comic text-sm font-bold text-[#F44336] flex items-center justify-center gap-1.5">
            TÔI QUÝ BẠN NHƯ CON TÔI VẬY <Heart className="w-4 h-4 fill-[#F44336]" />
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            Gia hạn tình bạn 365 ngày mỗi khi mời chủ quán một ly nước!
          </p>
        </div>

        {/* Right side & Admin link */}
        <div className="flex flex-col items-center md:items-end gap-2 text-xs">
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF4DF] hover:bg-white text-[#171717] font-bold rounded-xl border-2 border-[#171717] shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2678F3]" />
            <span>Khu Vực Quản Trị (Admin)</span>
          </button>
          <p className="text-[11px] text-gray-600 mt-1">
            © 2026 Friendship Café. Made with Retro Pop Art vibes.
          </p>
        </div>
      </div>
    </footer>
  );
};
