
import { CartItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus } from 'lucide-react';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  total: number;
  onCheckout: () => void;
}

const Cart = ({ items, onUpdateQuantity, onRemoveItem, total, onCheckout }: CartProps) => {
  if (items.length === 0) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-center text-barber-dark">السلة فارغة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            أضف بعض المنتجات للمتابعة
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-barber-dark">سلة التسوق ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-12 h-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
              <p className="text-barber-blue font-semibold">₪{item.product.price}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                className="w-12 h-8 text-center text-xs"
                min="1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onRemoveItem(item.product.id)}
                className="h-8 w-8 p-0 mr-1"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-bold text-barber-dark">
            <span>المجموع:</span>
            <span>₪{total}</span>
          </div>
        </div>
        
        <Button 
          onClick={onCheckout}
          className="w-full bg-barber-blue hover:bg-barber-blue/90 text-white font-medium"
          size="lg"
        >
          متابعة الدفع
        </Button>
      </CardContent>
    </Card>
  );
};

export default Cart;
