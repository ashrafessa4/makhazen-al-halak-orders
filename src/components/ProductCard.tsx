
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
    <Card className="group bg-white/95 backdrop-blur-sm border-2 border-gray-100 hover:border-barber-blue/50 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fade-in max-w-full mx-auto">
      <CardContent className="p-0">
        <div className="flex flex-row h-32 sm:h-36">
          {/* Image Section - Left Side */}
          <div className="relative w-32 sm:w-36 flex-shrink-0">
            <div className="relative overflow-hidden rounded-l-lg h-full">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Badge className="absolute top-1 right-1 bg-barber-gold text-white font-semibold text-xs">
                {product.category}
              </Badge>
              
              {/* Admin Controls */}
              {isAdmin && (
                <div className="absolute top-1 left-1 flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-5 w-5 p-0 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      console.log('Edit product:', product.id);
                    }}
                  >
                    <Edit className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-5 w-5 p-0"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Content Section - Right Side */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-bold text-barber-dark text-center leading-tight group-hover:text-barber-blue transition-colors duration-200 line-clamp-2">
                {product.name}
              </CardTitle>
              
              <p className="text-gray-600 text-xs text-center leading-tight line-clamp-2">
                {product.description}
              </p>
            </div>
            
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-center">
                <span className="text-lg font-bold text-barber-green">
                  ₪{product.price}
                </span>
              </div>
              
              {/* Quantity and Add to Cart Controls */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 bg-gray-50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-6 w-6 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <span className="w-6 text-center font-semibold text-sm">
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
                  className={`w-full font-semibold py-1.5 rounded-lg transition-all duration-200 transform text-xs ${
                    isAdding 
                      ? 'bg-green-500 text-white scale-95' 
                      : 'bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white hover:scale-105'
                  }`}
                >
                  {isAdding ? (
                    <span className="flex items-center justify-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      تمت الإضافة!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1">
                      <ShoppingCart className="h-3 w-3" />
                      أضف للسلة
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
