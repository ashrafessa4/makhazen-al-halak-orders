
import { useState } from 'react';
import { Product } from '@/types';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 animate-fade-in">
      <CardContent className="p-4">
        <div className="aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
        </div>
        <h3 className="font-semibold text-lg mb-2 text-barber-dark">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-barber-blue">₪{product.price}</span>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {product.category}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium">
              الكمية:
            </label>
            <Input
              id={`quantity-${product.id}`}
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20 text-center"
            />
          </div>
          <Button 
            onClick={handleAddToCart}
            className="w-full bg-barber-green hover:bg-barber-green/90 text-white font-medium"
          >
            <ShoppingCart className="w-4 h-4 ml-2" />
            إضافة للسلة
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
