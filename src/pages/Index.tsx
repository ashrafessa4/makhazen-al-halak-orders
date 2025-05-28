import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useAdmin, useAdminConfig } from '@/hooks/useAdmin';
import { Order, OrderFormData } from '@/types';
import { sendWhatsAppNotification, generateOrderNumber } from '@/utils/whatsapp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import ProductCard from '@/components/ProductCard';
import Cart from '@/components/Cart';
import CheckoutForm from '@/components/CheckoutForm';
import OrderConfirmation from '@/components/OrderConfirmation';
import AdminDashboard from '@/components/AdminDashboard';
import AdminLogin from '@/components/AdminLogin';
import AddProductModal from '@/components/AddProductModal';
import AdminSettings from '@/components/AdminSettings';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, LogOut, UserCheck } from 'lucide-react';

type ViewState = 'store' | 'checkout' | 'confirmation' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>('store');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAdminSettings, setShowAdminSettings] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const cart = useCart();
  const { products } = useProducts();
  const { isAuthenticated: isAdmin, logout: adminLogout } = useAdmin();
  const { config } = useAdminConfig();

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

  const handleOrderSubmit = async (formData: OrderFormData) => {
    try {
      const orderNumber = generateOrderNumber();
      const order: Order = {
        id: Date.now().toString(),
        orderNumber,
        ...formData,
        items: cart.items,
        total: cart.total,
        date: new Date(),
        status: 'pending'
      };

      // Save order to database - cast items to Json type
      const { error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.customerName,
          shop_name: formData.shopName,
          city: formData.city,
          notes: formData.notes,
          total: cart.total,
          items: cart.items as any, // Cast to Json type
          status: 'pending'
        });

      if (error) throw error;

      setCurrentOrder(order);
      
      // Send WhatsApp notification with configured number
      sendWhatsAppNotification(order, config?.whatsapp_number || '+972509617061');
      
      // Clear cart and show confirmation
      cart.clearCart();
      setCurrentView('confirmation');
      
      toast({
        title: "تم إرسال الطلب بنجاح!",
        description: `رقم الطلب: ${orderNumber}`,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "خطأ في إرسال الطلب",
        description: "حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleNewOrder = () => {
    setCurrentOrder(null);
    setCurrentView('store');
  };

  const renderStoreView = () => (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747733461-0524ba8de5ad?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-5 blur-sm"></div>
      
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-barber-dark mb-2 drop-shadow-lg">
            متجر أدوات الحلاقة
          </h1>
          <p className="text-gray-600 text-base sm:text-lg drop-shadow-sm">
            كل ما تحتاجه لصالونك في مكان واحد
          </p>
        </div>

        {/* Admin Controls */}
        <div className="flex justify-center items-center gap-2 mb-6 flex-wrap">
          {!isAdmin ? (
            <Button
              onClick={() => setShowAdminLogin(true)}
              variant="outline"
              className="bg-barber-gold text-white hover:bg-barber-gold/90 border-barber-gold"
            >
              <UserCheck className="ml-2 h-4 w-4" />
              تسجيل دخول الإدارة
            </Button>
          ) : (
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                onClick={() => setCurrentView('admin')}
                variant="outline"
                className="bg-barber-blue text-white hover:bg-barber-blue/90"
              >
                لوحة التحكم
              </Button>
              <Button
                onClick={() => setShowAddProduct(true)}
                className="bg-barber-green hover:bg-barber-green/90"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة منتج
              </Button>
              <Button
                onClick={() => setShowAdminSettings(true)}
                variant="outline"
              >
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </Button>
              <Button
                onClick={adminLogout}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer px-3 sm:px-4 py-2 text-sm sm:text-base ${
                  selectedCategory === category
                    ? 'bg-barber-blue hover:bg-barber-blue/90 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
    <CheckoutForm
      onSubmit={handleOrderSubmit}
      onBack={() => setCurrentView('store')}
      total={cart.total}
    />
  );

  const renderConfirmationView = () => (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747733461-0524ba8de5ad?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-5 blur-sm"></div>
      <div className="flex items-center justify-center p-4 relative z-10 min-h-screen">
        {currentOrder && (
          <OrderConfirmation
            order={currentOrder}
            onNewOrder={handleNewOrder}
          />
        )}
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center p-4 sm:p-6 bg-white border-b">
          <h1 className="text-xl sm:text-2xl font-bold text-barber-dark">لوحة التحكم</h1>
          <Button
            onClick={() => setCurrentView('store')}
            variant="outline"
          >
            العودة للمتجر
          </Button>
        </div>
        <AdminDashboard orders={orders} />
      </div>
    </div>
  );

  return (
    <>
      {(() => {
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
      })()}
      
      {/* Modals */}
      {showAdminLogin && (
        <AdminLogin onClose={() => setShowAdminLogin(false)} />
      )}
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} />
      )}
      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}
    </>
  );
};

export default Index;
