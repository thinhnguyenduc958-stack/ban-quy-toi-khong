import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#171717] bg-[#FFE14D] border-2 border-[#171717] rounded-lg shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all whitespace-nowrap shrink-0"
        title="Cài đặt ứng dụng vào điện thoại hoặc máy tính"
      >
        <Download className="w-3.5 h-3.5 text-[#F44336]" />
        <span>Cài App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#171717] bg-[#FFE14D] border-2 border-[#171717] rounded-lg shadow-pop-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all whitespace-nowrap shrink-0"
          title="Cài đặt trên iOS"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#2678F3]" />
          <span>Cài iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#FFF4DF] p-6 border-4 border-[#171717] shadow-pop-lg text-[#171717]">
              <h3 className="text-lg font-bold font-display uppercase tracking-wide text-[#F44336]">
                Cài đặt vào iPhone / iPad
              </h3>
              <p className="mt-3 text-sm leading-relaxed">
                1. Nhấn vào nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng Safari.<br />
                2. Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#FFE14D] py-2 text-sm font-bold border-2 border-[#171717] shadow-pop-sm hover:translate-y-[1px] transition-all"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
