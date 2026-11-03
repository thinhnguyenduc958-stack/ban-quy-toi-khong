import React from 'react';
import { ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PWAInstallButton } from './PWAInstallButton';
import { isSoundMuted, toggleSound } from '../utils/audio';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab }) => {
  const { totalCount, setIsCartOpen } = useCart();
  const [muted, setMuted] = React.useState(isSoundMuted());

  const handleToggleSound = () => {
    const next = toggleSound();
    setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFE14D] border-b-4 border-[#171717] shadow-pop px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('home')}
          className="text-left group flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 focus:outline-none"
        >
          <span className="font-comic text-xl sm:text-2xl font-black tracking-wide text-[#171717] group-hover:text-[#F44336] transition-colors drop-shadow-[1px_1px_0px_#FFF]">
            BẠN QUÝ TÔI KHÔNG?
          </span>
        </button>

        {/* Zone 2: Navigation Links (Single-line, clean prose) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold font-display uppercase tracking-wider text-[#171717]">
          <button
            onClick={() => setCurrentTab('home')}
            className={`hover:text-[#F44336] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentTab === 'home' ? 'border-[#171717] text-[#F44336]' : 'border-transparent'
            }`}
          >
            Trang chủ
          </button>
          <button
            onClick={() => setCurrentTab('menu')}
            className={`hover:text-[#F44336] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentTab === 'menu' ? 'border-[#171717] text-[#F44336]' : 'border-transparent'
            }`}
          >
            Thực đơn
          </button>
          <button
            onClick={() => setCurrentTab('leaderboard')}
            className={`hover:text-[#F44336] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentTab === 'leaderboard' ? 'border-[#171717] text-[#F44336]' : 'border-transparent'
            }`}
          >
            Bảng Vàng
          </button>
          <button
            onClick={() => setCurrentTab('lookup')}
            className={`hover:text-[#F44336] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
              currentTab === 'lookup' ? 'border-[#171717] text-[#F44336]' : 'border-transparent'
            }`}
          >
            Tra cứu đơn
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <PWAInstallButton />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 text-[#171717] bg-[#FFF4DF] hover:bg-white border-2 border-[#171717] rounded-xl shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            title={muted ? 'Bật âm thanh retro' : 'Tắt âm thanh'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-gray-500" /> : <Volume2 className="w-4 h-4 text-[#F44336]" />}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#F44336] text-white font-display font-bold text-sm border-2 border-[#171717] rounded-xl shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-pop-sm active:translate-x-[2px] active:translate-y-[2px] transition-all whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Giỏ Mời</span>
            <span className="bg-[#FFE14D] text-[#171717] px-2 py-0.5 rounded-full text-xs font-black border border-[#171717]">
              {totalCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
