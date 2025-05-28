
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useAdmin } from '@/hooks/useAdmin';
import { useProducts } from '@/hooks/useProducts';
import ProductEditModal from './ProductEditModal';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const { isAuthenticated: isAdmin } = useAdmin();
  const { deleteProduct, loading } = useProducts();

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setQuantity(1);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteProduct(product.id);
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 bg-white/95 backdrop-blur-sm border-2 border-gray-100">
        <div className="relative">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 sm:h-56 md:h-64 object-cover"
          />
          <Badge className="absolute top-2 right-2 bg-barber-blue text-white">
            {product.category}
          </Badge>
          {isAdmin && (
            <div className="absolute top-2 left-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowEditModal(true)}
                className="h-8 w-8 p-0 bg-barber-gold hover:bg-barber-gold/90"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <CardContent className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-barber-dark mb-2">{product.name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-barber-green">₪{product.price}</span>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-8 w-8 p-0 hover:bg-barber-blue hover:text-white rounded-md"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-semibold text-barber-dark">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99}
                className="h-8 w-8 p-0 hover:bg-barber-blue hover:text-white rounded-md"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">المجموع:</span>
              <span className="text-lg font-bold text-barber-green">
                ₪{(product.price * quantity).toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleAddToCart}
              className="w-full bg-barber-blue hover:bg-barber-blue/90 text-white font-semibold py-2.5 rounded-lg transition-all duration-200"
            >
              إضافة للسلة
            </Button>
          </div>
        </CardContent>
      </Card>

      {showEditModal && (
        <ProductEditModal
          product={product}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
