
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { products } from '@/data/products';
import { Order, OrderFormData } from '@/types';
import { sendWhatsAppNotification, generateOrderNumber } from '@/utils/whatsapp';
import { toast } from '@/hooks/use-toast';

import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import CheckoutForm from '@/components/CheckoutForm';
import OrderConfirmation from '@/components/OrderConfirmation';
import AdminDashboard from '@/components/AdminDashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ViewState = 'store' | 'checkout' | 'confirmation' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>('store');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  
  const cart = useCart();

  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'الكل' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast({
        title: "السلة فارغة",
        description: "يرجى إضافة منتجات للمتابعة",
        variant: "destructive",
      });
      return;
    }
    setCurrentView('checkout');
  };

  const handleOrderSubmit = (formData: OrderFormData) => {
    const order: Order = {
      id: Date.now().toString(),
      orderNumber: generateOrderNumber(),
      ...formData,
      items: cart.items,
      total: cart.total,
      date: new Date(),
      status: 'pending'
    };

    setCurrentOrder(order);
    setAllOrders(prev => [...prev, order]);
    
    // Send WhatsApp notification
    sendWhatsAppNotification(order);
    
    // Clear cart and show confirmation
    cart.clearCart();
    setCurrentView('confirmation');
    
    toast({
      title: "تم إرسال الطلب بنجاح!",
      description: `رقم الطلب: ${order.orderNumber}`,
    });
  };

  const handleNewOrder = () => {
    setCurrentOrder(null);
    setCurrentView('store');
  };

  const renderStoreView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-barber-dark mb-2">
            متجر أدوات الحلاقة
          </h1>
          <p className="text-gray-600 text-lg">
            كل ما تحتاجه لصالونك في مكان واحد
          </p>
        </div>

        {/* Admin Button */}
        <div className="flex justify-center mb-6">
          <Button
            onClick={() => setCurrentView('admin')}
            variant="outline"
            className="bg-barber-gold text-white hover:bg-barber-gold/90"
          >
            لوحة التحكم
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedCategory === category
                    ? 'bg-barber-blue hover:bg-barber-blue/90'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={cart.addToCart}
                />
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Cart
              items={cart.items}
              onUpdateQuantity={cart.updateQuantity}
              onRemoveItem={cart.removeFromCart}
              total={cart.total}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCheckoutView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <CheckoutForm
        onSubmit={handleOrderSubmit}
        onBack={() => setCurrentView('store')}
        total={cart.total}
      />
    </div>
  );

  const renderConfirmationView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      {currentOrder && (
        <OrderConfirmation
          order={currentOrder}
          onNewOrder={handleNewOrder}
        />
      )}
    </div>
  );

  const renderAdminView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center p-6 bg-white border-b">
          <h1 className="text-2xl font-bold text-barber-dark">لوحة التحكم</h1>
          <Button
            onClick={() => setCurrentView('store')}
            variant="outline"
          >
            العودة للمتجر
          </Button>
        </div>
        <AdminDashboard orders={allOrders} />
      </div>
    </div>
  );

  switch (currentView) {
    case 'checkout':
      return renderCheckoutView();
    case 'confirmation':
      return renderConfirmationView();
    case 'admin':
      return renderAdminView();
    default:
      return renderStoreView();
  }
};

export default Index;
