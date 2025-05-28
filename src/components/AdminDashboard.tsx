import { useState, useEffect } from 'react';
import { Order, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Check, X, Clock } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
}

const AdminDashboard = ({ orders: propOrders }: AdminDashboardProps) => {
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topProducts: [] as { product: Product; sales: number }[]
  });
  const { products } = useProducts();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'completed' | 'cancelled' | null>(null);

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }

        // Transform database orders to match Order interface
        const transformedOrders: Order[] = data.map(order => ({
          id: order.id,
          orderNumber: order.order_number,
          customerName: order.customer_name,
          shopName: order.shop_name,
          city: order.city,
          notes: order.notes || '',
          items: order.items as any,
          total: Number(order.total),
          date: new Date(order.created_at),
          status: order.status as 'pending' | 'processing' | 'completed'
        }));

        setOrders(transformedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top products
    const productSales: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.product && item.product.id) {
            productSales[item.product.id] = (productSales[item.product.id] || 0) + item.quantity;
          }
        });
      }
    });

    const topProducts = Object.entries(productSales)
      .map(([productId, sales]) => {
        const product = products.find(p => p.id === productId);
        return product ? { product, sales } : null;
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.sales - a!.sales)
      .slice(0, 5) as { product: Product; sales: number }[];

    setStats({ totalOrders, totalRevenue, avgOrderValue, topProducts });
  }, [orders, products]);

  const handleStatusUpdate = async (orderId: string, newStatus: 'completed' | 'cancelled', note: string = '') => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          notes: note 
        })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, notes: note }
          : order
      ));

      toast(`تم ${newStatus === 'completed' ? 'تأكيد' : 'إلغاء'} الطلب بنجاح`);
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setStatusNote('');
      setPendingStatus(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const openStatusDialog = (order: Order, status: 'completed' | 'cancelled') => {
    setSelectedOrder(order);
    setPendingStatus(status);
    setStatusNote('');
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">مكتمل</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">ملغي</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">في الانتظار</Badge>;
    }
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-barber-dark">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-barber-blue">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-barber-green">₪{stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-barber-gold">₪{stats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">آخر الطلبات</TabsTrigger>
          <TabsTrigger value="products">الأكثر مبيعاً</TabsTrigger>
          <TabsTrigger value="all">جميع الطلبات</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">آخر 5 طلبات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد طلبات بعد</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                    <div className="flex-1">
                      <div className="font-medium">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-600">{order.customerName} - {order.shopName}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-barber-blue text-sm">₪{order.total}</div>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">المنتجات الأكثر مبيعاً</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد مبيعات بعد</p>
              ) : (
                stats.topProducts.map((item, index) => (
                  <div key={item.product.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <div className="flex-shrink-0 w-6 h-6 bg-barber-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.product.name}</div>
                      <div className="text-xs text-gray-600">{item.product.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-barber-green text-sm">{item.sales}</div>
                      <div className="text-xs text-gray-500">₪{item.product.price}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">جميع الطلبات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-4">لا توجد طلبات بعد</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-sm">#{order.orderNumber}</div>
                      <div className="text-xs text-gray-600">{order.customerName} - {order.shopName}</div>
                      <div className="text-xs text-gray-500">{order.city}</div>
                      {order.notes && <div className="text-xs text-gray-500 mt-1">ملاحظة: {order.notes}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold text-barber-blue text-sm">₪{order.total}</div>
                        {getStatusBadge(order.status)}
                      </div>
                      {order.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 bg-green-50 hover:bg-green-100 border-green-200"
                            onClick={() => openStatusDialog(order, 'completed')}
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 bg-red-50 hover:bg-red-100 border-red-200"
                            onClick={() => openStatusDialog(order, 'cancelled')}
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'completed' ? 'تأكيد الطلب' : 'إلغاء الطلب'}
            </DialogTitle>
            <DialogDescription>
              طلب رقم #{selectedOrder?.orderNumber}
              <br />
              {pendingStatus === 'completed' 
                ? 'هل أنت متأكد من تأكيد اكتمال هذا الطلب؟' 
                : 'هل أنت متأكد من إلغاء هذا الطلب؟'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm">ملاحظة (اختيارية)</Label>
            <Textarea
              id="note"
              placeholder="أضف ملاحظة..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="resize-none h-20 text-sm"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-sm">
              إلغاء
            </Button>
            <Button
              onClick={() => selectedOrder && handleStatusUpdate(selectedOrder.id, pendingStatus!, statusNote)}
              className={`text-sm ${pendingStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {pendingStatus === 'completed' ? 'تأكيد' : 'إلغاء الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
