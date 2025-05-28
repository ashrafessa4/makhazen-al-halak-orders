import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { Order, OrderFormData } from '@/types';
import { sendWhatsAppNotification, generateOrderNumber } from '@/utils/whatsapp';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Components
import StoreLayout from '@/components/StoreLayout';
import StoreHeader from '@/components/StoreHeader';
import CategoryFilter from '@/components/CategoryFilter';
import ProductGrid from '@/components/ProductGrid';
import Cart from '@/components/Cart';
import CheckoutForm from '@/components/CheckoutForm';
import OrderConfirmation from '@/components/OrderConfirmation';
import AdminView from '@/components/AdminView';
import AdminLogin from '@/components/AdminLogin';
import AddProductModal from '@/components/AddProductModal';
import AdminSettings from '@/components/AdminSettings';

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
  const { isAuthenticated: isAdmin, logout: adminLogout } = useAdminAuth();
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

      // Save order to database
      const { error } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: formData.customerName,
          shop_name: formData.shopName,
          city: formData.city,
          notes: formData.notes,
          total: cart.total,
          items: cart.items as any,
          status: 'pending'
        });

      if (error) throw error;

      setCurrentOrder(order);
      
      // Send WhatsApp notification
      sendWhatsAppNotification(order, config?.whatsapp_number || '+972509617061');
      
      // Send email notification
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
        }
      }
      
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
    <StoreLayout>
      <StoreHeader
        isAdmin={isAdmin}
        onAdminLogin={() => setShowAdminLogin(true)}
        onAdminDashboard={() => setCurrentView('admin')}
        onAddProduct={() => setShowAddProduct(true)}
        onAdminSettings={() => setShowAdminSettings(true)}
        onAdminLogout={adminLogout}
      />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
        <div className="lg:col-span-3">
          <ProductGrid
            products={filteredProducts}
            onAddToCart={cart.addToCart}
            isAdmin={isAdmin}
          />
        </div>

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
    </StoreLayout>
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

  return (
    <>
      {(() => {
        switch (currentView) {
          case 'checkout':
            return renderCheckoutView();
          case 'confirmation':
            return renderConfirmationView();
          case 'admin':
            return <AdminView orders={orders} onBackToStore={() => setCurrentView('store')} />;
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
