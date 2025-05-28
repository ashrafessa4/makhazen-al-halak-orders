
import { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    onAddToCart(product, quantity);
    
    // Reset quantity and show feedback
    setTimeout(() => {
      setQuantity(1);
      setIsAdding(false);
    }, 300);
  };

  return (
    <Card className="group h-full bg-white/95 backdrop-blur-sm border-2 border-gray-100 hover:border-barber-blue/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-fade-in">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-40 sm:h-44 md:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Badge className="absolute top-2 right-2 bg-barber-gold text-white font-semibold">
            {product.category}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex-1">
          <CardTitle className="text-lg font-bold text-barber-dark mb-2 line-clamp-2 group-hover:text-barber-blue transition-colors duration-200">
            {product.name}
          </CardTitle>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.description}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-barber-green">
              ₪{product.price}
            </span>
          </div>
        </div>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-8 w-8 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <span className="w-12 text-center font-semibold text-lg">
              {quantity}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setQuantity(quantity + 1)}
              className="h-8 w-8 p-0 hover:bg-barber-blue hover:text-white transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full font-bold py-2 rounded-lg transition-all duration-200 transform ${
              isAdding 
                ? 'bg-green-500 text-white scale-95' 
                : 'bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white hover:scale-105'
            }`}
          >
            {isAdding ? (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                تمت الإضافة!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                أضف للسلة
              </span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
