import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product } from '../types';
import { playCash } from '../utils/audio';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  buyerName: string;
  setBuyerName: (name: string) => void;
  isAnonymous: boolean;
  setIsAnonymous: (anon: boolean) => void;
  friendNote: string;
  setFriendNote: (note: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('friendship_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [buyerName, setBuyerName] = useState(() => localStorage.getItem('friendship_buyer_name') || 'Bạn thân');
  const [isAnonymous, setIsAnonymous] = useState(() => localStorage.getItem('friendship_buyer_anon') === 'true');
  const [friendNote, setFriendNote] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('friendship_cart', JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem('friendship_buyer_name', buyerName);
  }, [buyerName]);

  useEffect(() => {
    localStorage.setItem('friendship_buyer_anon', String(isAnonymous));
  }, [isAnonymous]);

  const addToCart = (product: Product, quantity = 1) => {
    playCash();
    setItems(prev => {
      const index = prev.findIndex(item => item.product.id === product.id);
      if (index !== -1) {
        const next = [...prev];
        next[index] = {
          ...next[index],
          quantity: next[index].quantity + quantity,
        };
        return next;
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalCount,
        isCartOpen,
        setIsCartOpen,
        buyerName,
        setBuyerName,
        isAnonymous,
        setIsAnonymous,
        friendNote,
        setFriendNote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
