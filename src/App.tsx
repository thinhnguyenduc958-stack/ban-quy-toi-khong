/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CartProvider } from './context/CartContext';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { PaymentPage } from './pages/PaymentPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { HallOfFamePage } from './pages/HallOfFamePage';
import { OrderStatusLookupPage } from './pages/OrderStatusLookupPage';
import { AdminPage } from './pages/AdminPage';
import { Product, Category, Order, BankSettings } from './types';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from './data/initialData';
import { WifiOff } from 'lucide-react';

export default function App() {
  return (
    <CartProvider>
      <MainApp />
    </CartProvider>
  );
}

function MainApp() {
  const [currentTab, setCurrentTab] = useState<'home' | 'menu' | 'leaderboard' | 'lookup' | 'payment' | 'success' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(false);

  // Active payment state
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeBank, setActiveBank] = useState<BankSettings | null>(null);
  const [activeQrUrl, setActiveQrUrl] = useState<string>('');

  // Offline detection
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products').catch(() => null),
        fetch('/api/categories').catch(() => null),
      ]);

      if (prodRes && prodRes.ok && catRes && catRes.ok) {
        const prodType = prodRes.headers.get('content-type') || '';
        const catType = catRes.headers.get('content-type') || '';
        if (prodType.includes('application/json') && catType.includes('application/json')) {
          const prodData = await prodRes.json();
          const catData = await catRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            setProducts(prodData);
          }
          if (Array.isArray(catData) && catData.length > 0) {
            setCategories(catData);
          }
        }
      }
    } catch (e) {
      console.warn('Initial data fetch fallback active:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle proceeding from CartDrawer to VietQR Payment screen
  const handleProceedToPayment = (order: Order, bank: BankSettings, qrUrl: string) => {
    setActiveOrder(order);
    setActiveBank(bank);
    setActiveQrUrl(qrUrl);
    setCurrentTab('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle payment success confirmation
  const handlePaymentSuccess = (paidOrder: Order) => {
    setActiveOrder(paidOrder);
    setCurrentTab('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFF4DF] text-[#171717] bg-halftone-cream selection:bg-[#FFE14D]">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-[#F44336] text-white py-1.5 px-4 text-center text-xs font-bold border-b-2 border-[#171717] flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Bạn đang ở chế độ ngoại tuyến. Hãy kiểm tra kết nối mạng!</span>
        </div>
      )}

      {/* Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer onProceedToPayment={handleProceedToPayment} />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#FFE14D] border-4 border-[#171717] shadow-pop flex items-center justify-center text-3xl animate-bounce">
              🥤
            </div>
            <p className="font-comic text-xl font-black text-[#171717] animate-pulse">
              ĐANG KHỞI ĐỘNG FRIENDSHIP CAFÉ...
            </p>
          </div>
        ) : (
          <>
            {/* Tab: Home */}
            {currentTab === 'home' && (
              <HomePage
                featuredProducts={products}
                onNavigateToMenu={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onNavigateToLeaderboard={() => {
                  setCurrentTab('leaderboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Tab: Menu */}
            {currentTab === 'menu' && (
              <MenuPage products={products} categories={categories} />
            )}

            {/* Tab: Leaderboard / Hall of Fame */}
            {currentTab === 'leaderboard' && (
              <HallOfFamePage
                onBackToMenu={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Tab: Order Status Lookup */}
            {currentTab === 'lookup' && (
              <OrderStatusLookupPage
                onOpenPaymentForOrder={(order, bank, qrUrl) => {
                  setActiveOrder(order);
                  setActiveBank(bank);
                  setActiveQrUrl(qrUrl);
                  setCurrentTab('payment');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenSuccessForOrder={(order) => {
                  setActiveOrder(order);
                  setCurrentTab('success');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Tab: VietQR Payment */}
            {currentTab === 'payment' && activeOrder && activeBank && (
              <PaymentPage
                order={activeOrder}
                bank={activeBank}
                qrUrl={activeQrUrl}
                onBackToMenu={() => {
                  setCurrentTab('menu');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onSuccess={handlePaymentSuccess}
              />
            )}

            {/* Tab: Payment Success */}
            {currentTab === 'success' && activeOrder && (
              <PaymentSuccessPage
                order={activeOrder}
                onBackToMenu={() => {
                  setCurrentTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onViewLeaderboard={() => {
                  setCurrentTab('leaderboard');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {/* Tab: Admin Dashboard */}
            {currentTab === 'admin' && (
              <AdminPage
                onClose={() => {
                  setCurrentTab('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                categories={categories}
                onRefreshProducts={fetchInitialData}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={() => {
          setCurrentTab('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
