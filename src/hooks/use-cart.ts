'use client';

import { useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  priceVnd: number;
  quantity: number;
  images?: string;
  stock: number;
}

const CART_STORAGE_KEY = 'webmmo-cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error('Failed to parse cart:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      
      // Dispatch event for cross-tab sync
      window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
    }
  }, [cart, isLoaded]);

  // Listen for cart updates from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to sync cart:', error);
        }
      }
    };

    const handleCartUpdate = (e: CustomEvent) => {
      // This handles same-tab updates
      setCart(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cart-updated', handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
    };
  }, []);

  // Add item to cart
  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item exists
        if (existingItem.quantity >= product.stock) {
          // Don't exceed stock
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Add new item
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQuantity = Math.min(quantity, item.stock);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  // Get cart total
  const getTotal = () => {
    return cart.reduce((total, item) => total + item.priceVnd * item.quantity, 0);
  };

  // Get cart count
  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Check if item is in cart
  const isInCart = (productId: string) => {
    return cart.some((item) => item.id === productId);
  };

  // Get item quantity
  const getItemQuantity = (productId: string) => {
    const item = cart.find((item) => item.id === productId);
    return item?.quantity || 0;
  };

  return {
    cart,
    isLoaded,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
    isInCart,
    getItemQuantity,
  };
}
