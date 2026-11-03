import React, { useState } from 'react';
import { Heart, Sparkles, ArrowRight, Frown, Coffee, Award, Star, Utensils } from 'lucide-react';
import { playBoing } from '../utils/audio';
import { Product } from '../types';
import { formatVND } from '../utils/format';
import { useCart } from '../context/CartContext';
import heroPopArtImage from '../assets/images/hero_pop_art_cafe_1793702876689.jpg';

interface HomePageProps {
  onNavigateToMenu: () => void;
  onNavigateToLeaderboard: () => void;
  featuredProducts: Product[];
}

const FUNNY_RESPONSES = [
  'Ủa? Chúng ta từng thân nhau mà?',
  'Tình bạn này cần được xem xét lại.',
  '20K thôi mà, suy nghĩ kỹ thế?',
  'Tôi đã hiểu vị trí của mình rồi...',
  'Bạn cứ suy nghĩ, tôi vẫn đang đợi.',
  'Để tôi lấy sổ đen tình bạn ra ghi tên bạn vào...',
  'Trà đá có 5K thôi đó bạn yêu ơi!',
  'Trái tim chủ quán vừa vỡ thành 8 mảnh...',
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateToMenu,
  onNavigateToLeaderboard,
  featuredProducts,
}) => {
  const { addToCart } = useCart();
  const [funnyModalOpen, setFunnyModalOpen] = useState(false);
  const [currentFunnyQuote, setCurrentFunnyQuote] = useState('');
  const [heroImageSrc, setHeroImageSrc] = useState<string>(heroPopArtImage);
  const [heroImageError, setHeroImageError] = useState(false);
  const [heroImageLoaded, setHeroImageLoaded] = useState(false);

  const handleNotFriendlyClick = () => {
    playBoing();
    const randomIndex = Math.floor(Math.random() * FUNNY_RESPONSES.length);
    setCurrentFunnyQuote(FUNNY_RESPONSES[randomIndex]);
    setFunnyModalOpen(true);
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-6 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headlines & Comic CTAs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Comic sticker eyebrow */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF70A6] text-white font-display font-black text-xs sm:text-sm rounded-full border-2 border-[#171717] shadow-pop-sm uppercase tracking-wider -rotate-1">
                <Sparkles className="w-4 h-4 text-[#FFE14D]" />
                <span>Friendship Café • Retro Pop Art Edition</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-comic text-3xl sm:text-5xl lg:text-6xl font-black text-[#171717] leading-[1.1] tracking-wide">
                Ê! BẠN CÓ <span className="text-[#F44336] underline decoration-wavy decoration-[#FFE14D]">QUÝ TÔI</span> KHÔNG?
              </h1>

              {/* Subtitle */}
              <p className="font-display font-semibold text-base sm:text-xl text-[#171717]/90 leading-relaxed max-w-xl">
                "Nếu quý tôi thì mời tôi một món nhé. Không quý cũng không sao...{' '}
                <span className="text-[#F44336] font-bold">tôi sẽ nhớ điều đó đến cuối đời</span>."
              </p>

              {/* 2 Main Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                {/* Button 1: QUÝ CHỨ, CHỌN MÓN ĐI! */}
                <button
                  onClick={onNavigateToMenu}
                  className="px-6 py-4 bg-[#F44336] hover:bg-red-600 text-white font-comic text-base sm:text-lg font-black rounded-2xl border-4 border-[#171717] shadow-pop-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <span>QUÝ CHỨ, CHỌN MÓN ĐI!</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Button 2: KHÔNG QUÝ THÌ SAO? */}
                <button
                  onClick={handleNotFriendlyClick}
                  className="px-6 py-4 bg-white hover:bg-gray-50 text-[#171717] font-comic text-base sm:text-lg font-black rounded-2xl border-4 border-[#171717] shadow-pop-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Frown className="w-5 h-5 text-gray-700" />
                  <span>KHÔNG QUÝ THÌ SAO?</span>
                </button>
              </div>

              {/* Badges strip */}
              <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg">
                <div className="p-3 bg-white rounded-xl border-2 border-[#171717] shadow-pop-sm text-center">
                  <p className="font-comic text-xs font-black text-[#F44336]">5.000đ</p>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5">Trà đá rẻ vô địch</p>
                </div>
                <div className="p-3 bg-white rounded-xl border-2 border-[#171717] shadow-pop-sm text-center">
                  <p className="font-comic text-xs font-black text-[#2678F3]">VietQR</p>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5">Quét mã 3 giây</p>
                </div>
                <div className="p-3 bg-white rounded-xl border-2 border-[#171717] shadow-pop-sm text-center">
                  <p className="font-comic text-xs font-black text-[#FF70A6]">+365 Ngày</p>
                  <p className="text-[11px] font-semibold text-gray-700 mt-0.5">Gia hạn tình bạn</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Pop Art Illustration */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background decorative comic card */}
                <div className="absolute inset-0 bg-[#2678F3] rounded-3xl border-4 border-[#171717] translate-x-3 translate-y-3" />
                
                {/* Main Image Container */}
                <div className="relative bg-white rounded-3xl border-4 border-[#171717] overflow-hidden shadow-pop-xl p-2 min-h-[240px] sm:min-h-[320px] flex items-center justify-center">
                  {!heroImageError ? (
                    <img
                      src={heroImageSrc}
                      alt="Quán nước Friendship Café Retro Pop Art"
                      width={800}
                      height={600}
                      loading="eager"
                      fetchPriority="high"
                      onLoad={() => setHeroImageLoaded(true)}
                      onError={() => {
                        // If bundled asset fails, try public URL fallback; if that fails too, show SVG fallback
                        if (heroImageSrc !== '/images/hero_pop_art_cafe_1793702876689.jpg') {
                          setHeroImageSrc('/images/hero_pop_art_cafe_1793702876689.jpg');
                        } else {
                          setHeroImageError(true);
                        }
                      }}
                      className={`w-full h-auto aspect-video sm:aspect-[4/3] object-cover rounded-2xl border-2 border-[#171717] transition-opacity duration-300 ${
                        heroImageLoaded ? 'opacity-100' : 'opacity-95'
                      }`}
                    />
                  ) : (
                    /* High-Fidelity Retro Pop Art Diner Fallback Illustration */
                    <div className="w-full aspect-video sm:aspect-[4/3] rounded-2xl border-2 border-[#171717] bg-[#FFE14D] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden select-none">
                      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#FF70A6] rounded-full border-4 border-[#171717] opacity-70" />
                      <div className="absolute -left-8 -top-8 w-28 h-28 bg-[#2678F3] rounded-full border-4 border-[#171717] opacity-70" />
                      <div className="relative z-10 space-y-2">
                        <div className="text-5xl sm:text-6xl animate-bounce">🥤✨🍔</div>
                        <h3 className="font-comic text-2xl sm:text-3xl font-black text-[#171717] uppercase drop-shadow-[2px_2px_0px_#FFF]">
                          FRIENDSHIP CAFÉ
                        </h3>
                        <div className="inline-block px-3 py-1 bg-white border-2 border-[#171717] rounded-full font-comic text-xs sm:text-sm font-black text-[#F44336] shadow-pop-sm">
                          RETRO POP ART DINER
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating comic speech bubble sticker */}
                  <div className="absolute top-4 right-4 bg-[#FFE14D] border-3 border-[#171717] px-3 py-1.5 rounded-2xl shadow-pop text-xs font-comic font-black text-[#171717] rotate-3 flex items-center gap-1.5 z-10">
                    <Heart className="w-4 h-4 fill-[#F44336] text-[#F44336]" />
                    <span>NUÔI TÔI ĐI BẠN ƠI!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Teaser: Top Popular Friendship Treats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2678F3] text-white font-display font-bold text-xs rounded-lg border-2 border-[#171717] mb-2 uppercase">
              <Coffee className="w-3.5 h-3.5 text-[#FFE14D]" />
              <span>Gợi ý chiêu đãi nhanh</span>
            </div>
            <h2 className="font-comic text-2xl sm:text-3xl font-black text-[#171717]">
              MÓN "CỨU ĐÓI" ĐƯỢC MỜI NHIỀU NHẤT
            </h2>
          </div>
          <button
            onClick={onNavigateToMenu}
            className="flex items-center gap-2 font-display font-bold text-sm text-[#F44336] hover:underline cursor-pointer"
          >
            <span>Xem toàn bộ 13 món ngon</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Featured Products */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredProducts.slice(0, 3).map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border-4 border-[#171717] shadow-pop-lg p-4 flex flex-col justify-between hover:translate-y-[-4px] transition-transform"
            >
              <div>
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#171717] mb-4 aspect-square bg-[#FFF4DF]">
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 bg-[#FFE14D] font-comic text-xs font-black px-2.5 py-1 rounded-xl border-2 border-[#171717] shadow-pop-sm">
                    {formatVND(prod.price)}
                  </span>
                </div>
                <h3 className="font-display font-black text-lg text-[#171717]">{prod.name}</h3>
                <p className="text-xs text-gray-700 italic mt-1 leading-relaxed">
                  "{prod.description}"
                </p>
              </div>

              <button
                onClick={() => addToCart(prod)}
                className="mt-5 w-full py-2.5 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic text-sm font-black rounded-xl border-2 border-[#171717] shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-pop-sm active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-2"
              >
                <Utensils className="w-4 h-4 text-[#F44336]" />
                <span>MỜI MÓN NÀY</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Friendship Hall of Fame Banner Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="bg-[#FF70A6] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-10 text-[#171717] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          {/* Halftone texture overlay */}
          <div className="space-y-4 max-w-xl text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white font-display font-bold text-xs rounded-xl border-2 border-[#171717]">
              <Award className="w-4 h-4 text-[#F44336]" />
              <span>Vinh danh những người bạn tuyệt vời</span>
            </div>
            <h2 className="font-comic text-2xl sm:text-4xl font-black leading-tight text-white drop-shadow-[2px_2px_0px_#171717]">
              BẢNG VÀNG TÌNH BẠN
            </h2>
            <p className="font-display font-semibold text-sm sm:text-base text-[#171717] leading-relaxed">
              Bạn có muốn tên mình được khắc trên bảng vàng tri ân với danh hiệu "Đại Gia Nuôi Chủ Quán"? Cùng xem ai đang đứng đầu bảng xếp hạng tình bạn nhé!
            </p>
            <button
              onClick={onNavigateToLeaderboard}
              className="px-6 py-3 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic font-black text-sm sm:text-base rounded-2xl border-3 border-[#171717] shadow-pop hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pop-sm transition-all inline-flex items-center gap-2"
            >
              <Star className="w-5 h-5 text-[#F44336] fill-[#F44336]" />
              <span>XEM BẢNG VÀNG NGAY</span>
            </button>
          </div>

          <div className="shrink-0 z-10 w-44 sm:w-56">
            <img
              src="/src/assets/images/hall_of_fame_trophy_1793702875889.jpg"
              alt="Cúp vàng tình bạn"
              className="w-full h-auto rounded-2xl border-4 border-[#171717] shadow-pop-lg rotate-2"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Funny Quote Comic Modal */}
      {funnyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-[#FFF4DF] rounded-3xl border-4 border-[#171717] shadow-pop-xl p-6 sm:p-8 text-center relative animate-pulse-subtle">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#F44336] border-4 border-[#171717] flex items-center justify-center text-4xl shadow-pop mb-4">
              👀
            </div>

            <div className="inline-block bg-[#FFE14D] px-3 py-1 rounded-full border-2 border-[#171717] font-comic text-xs font-bold text-[#171717] mb-3">
              PHẢN HỒI TỪ CHỦ QUÁN
            </div>

            <h3 className="font-comic text-xl sm:text-2xl font-black text-[#F44336] mb-3">
              "{currentFunnyQuote}"
            </h3>

            <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed mb-6">
              Tình bạn nhiều năm không lẽ lại thua một ly trà đá 5K sao? Hãy bấm nút suy nghĩ lại đi nào!
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setFunnyModalOpen(false);
                  onNavigateToMenu();
                }}
                className="flex-1 py-3 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic text-sm font-black rounded-xl border-2 border-[#171717] shadow-pop hover:translate-y-[1px] transition-all"
              >
                QUÝ LẮM, CHỌN MÓN NGAY!
              </button>
              <button
                onClick={() => setFunnyModalOpen(false)}
                className="py-3 px-5 bg-white hover:bg-gray-100 text-[#171717] font-display text-sm font-bold rounded-xl border-2 border-[#171717] shadow-pop-sm"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
