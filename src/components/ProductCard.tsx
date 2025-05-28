
import { useState } from 'react';
import { Plus, Minus, ShoppingCart, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { toast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  isAdmin?: boolean;
}

const ProductCard = ({ product, onAddToCart, isAdmin = false }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { deleteProduct } = useProducts();

  const handleAddToCart = async () => {
    setIsAdding(true);
    onAddToCart(product, quantity);
    
    // Reset quantity and show feedback
    setTimeout(() => {
      setQuantity(1);
      setIsAdding(false);
    }, 300);
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteProduct(product.id);
      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });
    }
  };

  return (
    <Card className="group h-full bg-white/95 backdrop-blur-sm border-2 border-gray-100 hover:border-barber-blue/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 sm:h-36 md:h-40 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Badge className="absolute top-2 right-2 bg-barber-gold text-white font-semibold text-xs">
            {product.category}
          </Badge>
          
          {/* Admin Controls */}
          {isAdmin && (
            <div className="absolute top-2 left-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  // This would open edit modal - functionality exists in parent component
                  console.log('Edit product:', product.id);
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 w-7 p-0"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-3 flex flex-col h-full">
        <div className="flex-1">
          <CardTitle className="text-base font-bold text-barber-dark mb-2 line-clamp-2 group-hover:text-barber-blue transition-colors duration-200">
            {product.name}
          </CardTitle>
          
          <p className="text-gray-600 text-xs mb-3 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-barber-green">
              ₪{product.price}
            </span>
          </div>
        </div>
        
        {!isAdmin && (
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="w-8 text-center font-semibold text-sm">
                {quantity}
              </span>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => setQuantity(quantity + 1)}
                className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              onClick={handleAddToCart}
              disabled={isAdding}
              className={`w-full font-bold py-2 rounded-lg transition-all duration-200 transform text-sm ${
                isAdding 
                  ? 'bg-green-500 text-white scale-95' 
                  : 'bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white hover:scale-105'
              }`}
            >
              {isAdding ? (
                <span className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  تمت الإضافة!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ShoppingCart className="h-3 w-3" />
                  أضف للسلة
                </span>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
