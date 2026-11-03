import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Check, Coffee, Sparkles } from 'lucide-react';
import { Product, Category } from '../types';
import { formatVND } from '../utils/format';
import { useCart } from '../context/CartContext';

interface MenuPageProps {
  products: Product[];
  categories: Category[];
}

export const MenuPage: React.FC<MenuPageProps> = ({ products, categories }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('cat-all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get quantity in cart for a specific product
  const getProductQuantityInCart = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchCategory =
        selectedCategory === 'cat-all' || product.category_id === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Menu Header Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFE14D] border-2 border-[#171717] rounded-full shadow-pop-sm text-xs font-comic font-black uppercase">
          <Sparkles className="w-4 h-4 text-[#F44336]" />
          <span>THỰC ĐƠN TÌNH NGHĨA ANH EM</span>
        </div>
        <h1 className="font-comic text-3xl sm:text-5xl font-black text-[#171717]">
          CHỌN MÓN ĐỂ <span className="text-[#F44336]">NUÔI CHỦ QUÁN</span>
        </h1>
        <p className="font-display font-medium text-sm sm:text-base text-gray-700 max-w-xl mx-auto">
          Mỗi ly nước, mỗi đĩa bánh là một lời khẳng định: "Tụi mình mãi là bạn tốt!". Hãy chọn món bạn muốn mời nhé.
        </p>
      </div>

      {/* Search Bar & Categories Tabs */}
      <div className="space-y-4">
        {/* Search */}
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm trà đá, bim bim, bánh tráng..."
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border-3 border-[#171717] shadow-pop text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2678F3] placeholder:text-gray-400"
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-black"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Category Filter Pills (Functional Filter Buttons) */}
        <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-bold border-2 border-[#171717] transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#F44336] text-white shadow-pop translate-x-[1px] translate-y-[1px]'
                    : 'bg-white text-[#171717] shadow-pop-sm hover:bg-[#FFE14D]'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border-4 border-[#171717] shadow-pop-lg max-w-lg mx-auto p-8 space-y-4">
          <div className="text-5xl">🔍</div>
          <h3 className="font-comic text-xl font-bold text-[#171717]">
            Không tìm thấy món nào!
          </h3>
          <p className="text-sm text-gray-600">
            Thử tìm với từ khóa khác hoặc bấm nút bên dưới để xem tất cả thực đơn nhé.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('cat-all');
            }}
            className="px-5 py-2.5 bg-[#FFE14D] font-comic text-xs font-black rounded-xl border-2 border-[#171717] shadow-pop"
          >
            XEM TẤT CẢ MÓN
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const qtyInCart = getProductQuantityInCart(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border-3 sm:border-4 border-[#171717] shadow-pop-lg p-4 flex flex-col justify-between hover:translate-y-[-2px] transition-transform relative group"
              >
                {/* Image */}
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-[#171717] bg-[#FFF4DF] mb-3">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (product.image_url.includes('street_snack')) {
                          e.currentTarget.src = '/images/product_street_snack_1793702876247.jpg';
                        } else {
                          e.currentTarget.src = '/images/product_bubble_tea_1793702875693.jpg';
                        }
                      }}
                    />

                    {/* Price Tag Badge */}
                    <div className="absolute top-2.5 left-2.5 bg-[#FFE14D] font-comic text-xs sm:text-sm font-black text-[#171717] px-2.5 py-1 rounded-xl border-2 border-[#171717] shadow-pop-sm">
                      {formatVND(product.price)}
                    </div>

                    {/* Cart status badge */}
                    {qtyInCart > 0 && (
                      <div className="absolute top-2.5 right-2.5 bg-[#F44336] text-white font-comic text-xs font-black px-2 py-1 rounded-xl border-2 border-[#171717] shadow-pop-sm flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>x{qtyInCart}</span>
                      </div>
                    )}
                  </div>

                  {/* Title and Witty Description */}
                  <h3 className="font-display font-black text-base sm:text-lg text-[#171717] leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-700 italic mt-1 leading-relaxed line-clamp-2">
                    "{product.description}"
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-200">
                  {qtyInCart > 0 ? (
                    <div className="flex items-center justify-between bg-[#FFF4DF] p-1.5 rounded-2xl border-2 border-[#171717]">
                      <button
                        onClick={() => updateQuantity(product.id, qtyInCart - 1)}
                        className="w-8 h-8 rounded-xl bg-white hover:bg-gray-100 border-2 border-[#171717] flex items-center justify-center font-black shadow-pop-sm active:translate-y-[1px]"
                      >
                        <Minus className="w-3.5 h-3.5 text-[#171717]" />
                      </button>
                      <span className="font-comic text-sm font-black text-[#171717]">
                        {qtyInCart} ly/phần
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, qtyInCart + 1)}
                        className="w-8 h-8 rounded-xl bg-[#FFE14D] hover:bg-yellow-400 border-2 border-[#171717] flex items-center justify-center font-black shadow-pop-sm active:translate-y-[1px]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#171717]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2.5 bg-[#FFE14D] hover:bg-yellow-400 text-[#171717] font-comic text-xs sm:text-sm font-black rounded-xl border-2 border-[#171717] shadow-pop hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-pop-sm active:translate-x-[2px] active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Coffee className="w-4 h-4 text-[#F44336]" />
                      <span>MỜI MÓN NÀY</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
