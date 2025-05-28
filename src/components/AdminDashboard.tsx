import { useState, useEffect } from 'react';
import { Order, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Check, X, Clock, RotateCcw, ShoppingCart, DollarSign, TrendingUp, Package, BarChart3 } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
}

const AdminDashboard = ({
  orders: propOrders
}: AdminDashboardProps) => {
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    topProducts: [] as {
      product: Product;
      sales: number;
      revenue: number;
    }[]
  });
  const {
    products
  } = useProducts();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'pending' | 'completed' | 'cancelled' | null>(null);

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('orders').select('*').order('created_at', {
          ascending: false
        });
        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }
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
          status: order.status as 'pending' | 'processing' | 'completed' | 'cancelled'
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
    const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Calculate top products with revenue
    const productSales: {
      [key: string]: {
        quantity: number;
        revenue: number;
      };
    } = {};
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.product && item.product.id) {
            if (!productSales[item.product.id]) {
              productSales[item.product.id] = {
                quantity: 0,
                revenue: 0
              };
            }
            productSales[item.product.id].quantity += item.quantity;
            productSales[item.product.id].revenue += item.quantity * item.product.price;
          }
        });
      }
    });
    const topProducts = Object.entries(productSales).map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      return product ? {
        product,
        sales: data.quantity,
        revenue: data.revenue
      } : null;
    }).filter(item => item !== null).sort((a, b) => b!.sales - a!.sales).slice(0, 10) as {
      product: Product;
      sales: number;
      revenue: number;
    }[];
    setStats({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      topProducts
    });
  }, [orders, products]);
  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled', note: string = '') => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        status: newStatus,
        notes: note
      }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(order => order.id === orderId ? {
        ...order,
        status: newStatus,
        notes: note
      } : order));
      const statusText = newStatus === 'completed' ? 'تأكيد' : newStatus === 'cancelled' ? 'إلغاء' : 'إرجاع إلى الانتظار';
      toast(`تم ${statusText} الطلب بنجاح`);
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setStatusNote('');
      setPendingStatus(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };
  const openStatusDialog = (order: Order, status: 'pending' | 'completed' | 'cancelled') => {
    setSelectedOrder(order);
    setPendingStatus(status);
    setStatusNote(order.notes || '');
    setIsDialogOpen(true);
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs px-2 py-0.5">مكتمل</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-2 py-0.5">ملغي</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-0.5">انتظار</Badge>;
    }
  };
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  const recentOrders = orders.slice(0, 8);
  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.date);
    return orderDate.toDateString() === today.toDateString();
  });
  return <div className="space-y-6 p-4 bg-slate-50 min-h-screen">
      
      
      {/* Compact Stats Grid - Rearranged */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-purple-100 text-xs font-medium mb-1">متوسط الطلب</p>
                <p className="text-xl font-bold whitespace-nowrap">₪{stats.avgOrderValue.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-emerald-100 text-xs font-medium mb-1">إجمالي المبيعات</p>
                <p className="text-xl font-bold whitespace-nowrap">₪{stats.totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-6 w-6 text-emerald-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-blue-100 text-xs font-medium mb-1">إجمالي الطلبات</p>
                <p className="text-xl font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-6 w-6 text-blue-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-amber-100 text-xs font-medium mb-1">في الانتظار</p>
                <p className="text-xl font-bold">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-6 w-6 text-amber-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-green-100 text-xs font-medium mb-1">مكتملة</p>
                <p className="text-xl font-bold">{stats.completedOrders}</p>
              </div>
              <Check className="h-6 w-6 text-green-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-red-100 text-xs font-medium mb-1">ملغية</p>
                <p className="text-xl font-bold">{stats.cancelledOrders}</p>
              </div>
              <X className="h-6 w-6 text-red-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
          <TabsTrigger value="recent" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-slate-700 data-[state=inactive]:bg-white font-medium">آخر الطلبات</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-slate-700 data-[state=inactive]:bg-white font-medium">الأكثر مبيعاً</TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=inactive]:text-slate-700 data-[state=inactive]:bg-white font-medium">جميع الطلبات</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4 mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b bg-slate-50">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5" />
                آخر 8 طلبات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد طلبات بعد</p>
                </div> : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">رقم الطلب</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">العميل</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px] hidden sm:table-cell">المتجر</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px] hidden md:table-cell">المدينة</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px]">المبلغ</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px]">الحالة</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[120px] hidden lg:table-cell">التاريخ</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map(order => <TableRow key={order.id} className="hover:bg-slate-50">
                          <TableCell className="font-mono text-sm font-medium text-blue-600">#{order.orderNumber}</TableCell>
                          <TableCell className="font-medium text-slate-800">{order.customerName}</TableCell>
                          <TableCell className="text-slate-600 hidden sm:table-cell">{order.shopName}</TableCell>
                          <TableCell className="text-slate-600 hidden md:table-cell">{order.city}</TableCell>
                          <TableCell className="font-bold text-emerald-600">₪{order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500 hidden lg:table-cell">{formatDate(order.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {order.status === 'pending' && <>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>}
                              {(order.status === 'completed' || order.status === 'cancelled') && <>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => openStatusDialog(order, 'pending')}>
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                  {order.status === 'completed' && <Button size="sm" className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                      <X className="h-3 w-3" />
                                    </Button>}
                                  {order.status === 'cancelled' && <Button size="sm" className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                      <Check className="h-3 w-3" />
                                    </Button>}
                                </>}
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b bg-slate-50">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                المنتجات الأكثر مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.topProducts.length === 0 ? <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد مبيعات بعد</p>
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topProducts.map((item, index) => <Card key={item.product.id} className="bg-gradient-to-br from-slate-50 to-slate-100 border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg border-2 border-white shadow-sm" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-slate-800 truncate">{item.product.name}</div>
                            <div className="text-xs text-slate-500">{item.product.category}</div>
                            <div className="flex gap-4 mt-1">
                              <div className="text-xs">
                                <span className="font-medium text-blue-600">{item.sales}</span>
                                <span className="text-slate-500"> قطعة</span>
                              </div>
                              <div className="text-xs">
                                <span className="font-medium text-emerald-600">₪{item.revenue}</span>
                                <span className="text-slate-500"> ربح</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b bg-slate-50">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                جميع الطلبات ({orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد طلبات بعد</p>
                </div> : <div className="max-h-96 overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10">
                      <TableRow>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">رقم الطلب</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">العميل</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px] hidden sm:table-cell">المتجر</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px] hidden md:table-cell">المدينة</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px]">المبلغ</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[80px]">الحالة</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[120px] hidden lg:table-cell">التاريخ</TableHead>
                        <TableHead className="text-slate-700 font-semibold min-w-[100px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(order => <TableRow key={order.id} className="hover:bg-slate-50">
                          <TableCell className="font-mono text-sm font-medium text-blue-600">#{order.orderNumber}</TableCell>
                          <TableCell className="font-medium text-slate-800">{order.customerName}</TableCell>
                          <TableCell className="text-slate-600 hidden sm:table-cell">{order.shopName}</TableCell>
                          <TableCell className="text-slate-600 hidden md:table-cell">{order.city}</TableCell>
                          <TableCell className="font-bold text-emerald-600">₪{order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-sm text-slate-500 hidden lg:table-cell">{formatDate(order.date)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {order.status === 'pending' && <>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>}
                              {(order.status === 'completed' || order.status === 'cancelled') && <>
                                  <Button size="sm" className="h-7 w-7 p-0 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => openStatusDialog(order, 'pending')}>
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                  {order.status === 'completed' && <Button size="sm" className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                      <X className="h-3 w-3" />
                                    </Button>}
                                  {order.status === 'cancelled' && <Button size="sm" className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                      <Check className="h-3 w-3" />
                                    </Button>}
                                </>}
                            </div>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analytics Button at the bottom */}
      <div className="flex justify-center pt-8 pb-4">
        <Button 
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => {
            // Navigate to analytics page - you can implement this navigation later
            toast("سيتم إضافة صفحة التحليلات قريباً");
          }}
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          التحليلات المتقدمة
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">
              {pendingStatus === 'completed' && 'تأكيد الطلب'}
              {pendingStatus === 'cancelled' && 'إلغاء الطلب'}
              {pendingStatus === 'pending' && 'إرجاع إلى الانتظار'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              طلب رقم #{selectedOrder?.orderNumber}
              <br />
              {pendingStatus === 'completed' && 'هل أنت متأكد من تأكيد اكتمال هذا الطلب؟'}
              {pendingStatus === 'cancelled' && 'هل أنت متأكد من إلغاء هذا الطلب؟'}
              {pendingStatus === 'pending' && 'هل أنت متأكد من إرجاع هذا الطلب إلى حالة الانتظار؟'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm text-slate-700">ملاحظة (اختيارية)</Label>
            <Textarea id="note" placeholder="أضف ملاحظة..." value={statusNote} onChange={e => setStatusNote(e.target.value)} className="resize-none h-20 text-sm border-slate-200 focus:border-blue-500" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-sm border-slate-200 text-slate-600 hover:bg-slate-50">
              إلغاء
            </Button>
            <Button onClick={() => selectedOrder && handleStatusUpdate(selectedOrder.id, pendingStatus!, statusNote)} className={`text-sm text-white ${pendingStatus === 'completed' ? 'bg-emerald-600 hover:bg-emerald-700' : pendingStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
              {pendingStatus === 'completed' && 'تأكيد'}
              {pendingStatus === 'cancelled' && 'إلغاء الطلب'}
              {pendingStatus === 'pending' && 'إرجاع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};

export default AdminDashboard;
