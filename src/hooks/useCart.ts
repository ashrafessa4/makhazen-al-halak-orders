
import { useState, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { toast } from '@/hooks/use-toast';

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        toast({
          title: "تم تحديث الكمية",
          description: `تم تحديث كمية ${product.name}`,
        });
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        toast({
          title: "تم إضافة المنتج",
          description: `تم إضافة ${product.name} إلى السلة`,
        });
        return [...prevItems, { product, quantity }];
      }
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج من السلة",
      });
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({
      title: "تم حذف المنتج",
      description: "تم حذف المنتج من السلة",
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    total,
    itemCount
  };
};
