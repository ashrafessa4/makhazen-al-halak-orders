
import { Product, CartItem } from '@/types';
import ProductCard from '@/components/ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  isAdmin?: boolean;
}

const ProductGrid = ({ products, onAddToCart, isAdmin = false }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <ProductCard
            product={product}
            onAddToCart={onAddToCart}
            isAdmin={isAdmin}
          />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
