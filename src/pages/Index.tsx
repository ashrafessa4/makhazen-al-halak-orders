
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
      
      // Send email notification if admin email is configured
      if (config?.notification_email) {
        try {
          console.log('Sending email notification to:', config.notification_email);
          const emailResponse = await supabase.functions.invoke('send-order-email', {
            body: {
              order: {
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                shopName: order.shopName,
                city: order.city,
                total: order.total,
                items: order.items,
                notes: order.notes,
                date: order.date.toISOString()
              },
              adminEmail: config.notification_email
            }
          });

          if (emailResponse.error) {
            console.error('Email sending error:', emailResponse.error);
          } else {
            console.log('Email sent successfully:', emailResponse.data);
          }
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Don't block the order process if email fails
        }
      }
      
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
    <div className="min-h-screen relative pb-24 lg:pb-8">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747733461-0524ba8de5ad?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-3 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
      
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-barber-dark mb-3 drop-shadow-2xl animate-fade-in">
            متجر أدوات الحلاقة
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-barber-blue to-barber-green mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-700 text-lg sm:text-xl drop-shadow-lg font-medium">
            كل ما تحتاجه لصالونك في مكان واحد
          </p>
        </div>

        {/* Enhanced Admin Controls */}
        <div className="flex justify-center items-center gap-3 mb-8 flex-wrap">
          {!isAdmin ? (
            <Button
              onClick={() => setShowAdminLogin(true)}
              variant="outline"
              className="bg-gradient-to-r from-barber-gold to-barber-gold/80 text-white hover:from-barber-gold/90 hover:to-barber-gold/70 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              <UserCheck className="ml-2 h-4 w-4" />
              تسجيل دخول الإدارة
            </Button>
          ) : (
            <div className="flex gap-3 flex-wrap justify-center">
              <Button
                onClick={() => setCurrentView('admin')}
                variant="outline"
                className="bg-gradient-to-r from-barber-blue to-barber-blue/80 text-white hover:from-barber-blue/90 hover:to-barber-blue/70 border-none shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                لوحة التحكم
              </Button>
              <Button
                onClick={() => setShowAddProduct(true)}
                className="bg-gradient-to-r from-barber-green to-barber-green/80 hover:from-barber-green/90 hover:to-barber-green/70 shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة منتج
              </Button>
              <Button
                onClick={() => setShowAdminSettings(true)}
                variant="outline"
                className="bg-white/90 text-barber-dark border-2 border-barber-blue hover:bg-barber-blue hover:text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Settings className="ml-2 h-4 w-4" />
                الإعدادات
              </Button>
              <Button
                onClick={adminLogout}
                variant="outline"
                className="bg-white/90 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <LogOut className="ml-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Category Filter */}
        <div className="flex justify-center mb-8 sm:mb-10">
          <div className="flex flex-wrap gap-3 justify-center bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition-all duration-200 transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-barber-blue to-barber-green hover:from-barber-blue/90 hover:to-barber-green/90 text-white shadow-lg border-none'
                    : 'bg-white/90 text-barber-dark border-2 border-barber-blue/30 hover:bg-barber-blue/10 hover:border-barber-blue shadow-md'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Enhanced Products Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProductCard
                    product={product}
                    onAddToCart={cart.addToCart}
                  />
                </div>
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
