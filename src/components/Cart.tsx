
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  onCheckout: () => void;
}

const Cart = ({ items, onUpdateQuantity, onRemoveItem, total, onCheckout }: CartProps) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Desktop Cart - Sidebar */}
      <Card className="hidden lg:block sticky top-4 h-fit bg-white/95 backdrop-blur-sm border-2 border-gray-100 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-barber-dark">
            <ShoppingCart className="h-5 w-5" />
            سلة المشتريات
            {itemCount > 0 && (
              <Badge className="bg-barber-green text-white animate-pulse">
                {itemCount}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>السلة فارغة</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-start gap-3">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-xs text-barber-dark truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          ₪{item.product.price} × {item.quantity}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 bg-white rounded-md p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="h-5 w-5 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="h-5 w-5 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-barber-green text-xs">
                              ₪{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onRemoveItem(item.product.id)}
                              className="h-5 w-5 p-0 hover:bg-red-500 hover:text-white transition-colors duration-200"
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
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-barber-dark">المجموع الكلي:</span>
                  <span className="text-barber-green">₪{total.toFixed(2)}</span>
                </div>
                
                <Button
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-barber-green to-barber-blue hover:from-barber-green/90 hover:to-barber-blue/90 text-white font-bold py-3 text-lg rounded-lg transform hover:scale-105 transition-all duration-200"
                >
                  إتمام الطلب
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Mobile Floating Checkout Button */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-2xl animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-barber-blue" />
                  <span className="font-semibold text-barber-dark">
                    {itemCount} منتج
                  </span>
                </div>
                <span className="font-bold text-barber-green text-lg">
                  ₪{total.toFixed(2)}
                </span>
              </div>
              <Button
                onClick={onCheckout}
                className="w-full bg-gradient-to-r from-barber-green to-barber-blue hover:from-barber-green/90 hover:to-barber-blue/90 text-white font-bold py-3 text-lg rounded-lg transform hover:scale-105 transition-all duration-200"
              >
                إتمام الطلب ({itemCount})
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default Cart;
