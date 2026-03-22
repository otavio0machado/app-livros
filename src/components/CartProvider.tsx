'use client';

import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (bookId: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (bookId: number) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      if (state.items.some((item) => item.bookId === action.payload.bookId)) {
        return state;
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter((item) => item.bookId !== action.payload) };
    case 'CLEAR_CART':
      return { items: [] };
    case 'LOAD_CART':
      return { items: action.payload };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('livros-cart');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_CART', payload: JSON.parse(saved) });
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('livros-cart', JSON.stringify(state.items));
  }, [state.items]);

  const value: CartContextType = {
    items: state.items,
    addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
    removeItem: (bookId) => dispatch({ type: 'REMOVE_ITEM', payload: bookId }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    totalItems: state.items.length,
    totalPrice: state.items.reduce((sum, item) => sum + item.price_cents, 0),
    isInCart: (bookId) => state.items.some((item) => item.bookId === bookId),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
