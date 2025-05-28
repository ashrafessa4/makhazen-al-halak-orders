
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
    <Card className="sticky top-4 h-fit bg-white/95 backdrop-blur-sm border-2 border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-barber-dark">
          <ShoppingCart className="h-5 w-5" />
          سلة المشتريات
          {itemCount > 0 && (
            <Badge className="bg-barber-green text-white">
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
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <div key={item.product.id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-barber-dark truncate">
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
                            className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white"
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
                            className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white"
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
                            className="h-6 w-6 p-0 hover:bg-red-500 hover:text-white"
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
                className="w-full bg-barber-green hover:bg-barber-green/90 text-white font-bold py-3 text-lg rounded-lg"
              >
                إتمام الطلب
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Cart;
