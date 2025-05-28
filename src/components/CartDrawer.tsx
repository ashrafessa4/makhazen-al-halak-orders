
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CartItem } from '@/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  onCheckout: () => void;
}

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  total, 
  onCheckout 
}: CartDrawerProps) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    onCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-barber-dark">
            <ShoppingCart className="h-5 w-5" />
            سلة المشتريات
            {itemCount > 0 && (
              <Badge className="bg-barber-green text-white">
                {itemCount}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 flex-1 flex items-center justify-center flex-col">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 flex-1 overflow-y-auto py-4">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-barber-dark mb-1">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-3">
                          ₪{item.product.price} × {item.quantity}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-white rounded-md p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-barber-green text-sm">
                              ₪{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white transition-colors duration-200"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-3 flex-shrink-0">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-barber-dark">المجموع الكلي:</span>
                  <span className="text-barber-green">₪{total.toFixed(2)}</span>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-barber-green to-barber-blue hover:from-barber-green/90 hover:to-barber-blue/90 text-white font-bold py-3 text-lg rounded-lg transform hover:scale-105 transition-all duration-200"
                >
                  إتمام الطلب
                </Button>
              </div>
            </>
          )}
          
          {/* Always visible Go Back button */}
          <div className="border-t pt-3 flex-shrink-0">
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 text-lg rounded-lg transition-all duration-200"
            >
              <ArrowRight className="ml-2 h-5 w-5" />
              العودة للتسوق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartDrawer;
