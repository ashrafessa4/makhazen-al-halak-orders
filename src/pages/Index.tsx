import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminConfig } from '@/hooks/useAdminConfig';
import { Order, OrderFormData, Product } from '@/types';
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
import ProductEditModal from '@/components/ProductEditModal';
import AdminSettings from '@/components/AdminSettings';

type ViewState = 'store' | 'checkout' | 'confirmation' | 'admin';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewState>('store');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditProduct(true);
  };

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
      
      // Send email notification with detailed logging
      if (config?.notification_email) {
        console.log('📧 Starting email sending process...');
        console.log('📧 Admin email:', config.notification_email);
        console.log('📧 Order data:', {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.total,
          itemsCount: order.items.length
        });

        try {
          const emailPayload = {
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
          };

          console.log('📧 Calling Supabase function with payload:', emailPayload);

          const emailResponse = await supabase.functions.invoke('send-order-email', {
            body: emailPayload
          });

          console.log('📧 Email function response:', emailResponse);

          if (emailResponse.error) {
            console.error('📧 Email sending error:', emailResponse.error);
            toast({
              description: "تم إرسال الطلب بنجاح ولكن فشل في إرسال البريد الإلكتروني",
              variant: "destructive",
            });
          } else {
            console.log('📧 Email sent successfully:', emailResponse.data);
            toast({
              description: "تم إرسال الطلب والبريد الإلكتروني بنجاح!",
            });
          }
        } catch (emailError) {
          console.error('📧 Email sending failed with exception:', emailError);
          toast({
            description: "تم إرسال الطلب بنجاح ولكن فشل في إرسال البريد الإلكتروني",
            variant: "destructive",
          });
        }
      } else {
        console.log('📧 No admin email configured, skipping email notification');
        toast({
          description: "تم إرسال الطلب بنجاح!",
        });
      }
      
      cart.clearCart();
      setCurrentView('confirmation');
      
      toast({
        description: `تم إرسال الطلب برقم ${orderNumber}`,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
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
            onEditProduct={handleEditProduct}
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
      {showEditProduct && editingProduct && (
        <ProductEditModal 
          product={editingProduct} 
          onClose={() => {
            setShowEditProduct(false);
            setEditingProduct(null);
          }} 
        />
      )}
      {showAdminSettings && (
        <AdminSettings onClose={() => setShowAdminSettings(false)} />
      )}
    </>
  );
};

export default Index;
