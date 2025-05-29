import { useState, useEffect } from 'react';
import { Order, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { Check, X, Clock, RotateCcw, ShoppingCart, DollarSign, TrendingUp, Package, Search, Eye, MapPin, User, Store, Calendar, CreditCard, FileText, Shield } from 'lucide-react';

interface AdminDashboardProps {
  orders: Order[];
}

const AdminDashboard = ({
  orders: propOrders
}: AdminDashboardProps) => {
  const [orders, setOrders] = useState<Order[]>(propOrders);
  const [searchTerm, setSearchTerm] = useState('');
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
    }[],
    leastProducts: [] as {
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
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [orderDetailsData, setOrderDetailsData] = useState<Order | null>(null);
  const [pendingStatus, setPendingStatus] = useState<'pending' | 'completed' | 'cancelled' | null>(null);

  // Fetch orders from database
  const fetchOrders = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('orders').select('*').order('created_at', {
        ascending: false
      });
      if (error) {
        return;
      }
      const transformedOrders: Order[] = data.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        shopName: order.shop_name,
        city: order.city,
        notes: order.notes || '',
        adminNotes: order.admin_notes || '',
        items: order.items as any,
        total: Number(order.total),
        date: new Date(order.created_at),
        status: order.status as 'pending' | 'processing' | 'completed' | 'cancelled'
      }));
      setOrders(transformedOrders);
    } catch (error) {
      // Silent error handling for production
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const totalOrders = orders.length;
    // Only count completed orders for total revenue
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, order) => sum + order.total, 0);
    const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
    const avgOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    // Calculate top products with revenue (only from completed orders)
    const productSales: {
      [key: string]: {
        quantity: number;
        revenue: number;
      };
    } = {};
    orders.filter(o => o.status === 'completed').forEach(order => {
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
    
    const productsWithSales = Object.entries(productSales).map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      return product ? {
        product,
        sales: data.quantity,
        revenue: data.revenue
      } : null;
    }).filter(item => item !== null) as {
      product: Product;
      sales: number;
      revenue: number;
    }[];

    const topProducts = productsWithSales.sort((a, b) => b.sales - a.sales).slice(0, 10);
    const leastProducts = productsWithSales.sort((a, b) => a.sales - b.sales).slice(0, 10);

    setStats({
      totalOrders,
      totalRevenue,
      avgOrderValue,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      topProducts,
      leastProducts
    });
  }, [orders, products]);

  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'completed' | 'cancelled', note: string = '') => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        status: newStatus,
        admin_notes: note
      }).eq('id', orderId);
      
      if (error) {
        toast.error('حدث خطأ أثناء تحديث حالة الطلب');
        return;
      }
      
      // Update local state
      setOrders(prev => prev.map(order => order.id === orderId ? {
        ...order,
        status: newStatus,
        adminNotes: note
      } : order));
      
      // Refresh orders from database to ensure consistency
      await fetchOrders();
      
      const statusText = newStatus === 'completed' ? 'تأكيد' : newStatus === 'cancelled' ? 'إلغاء' : 'إرجاع إلى الانتظار';
      toast.success(`تم ${statusText} الطلب بنجاح`);
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setStatusNote('');
      setPendingStatus(null);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  const openStatusDialog = (order: Order, status: 'pending' | 'completed' | 'cancelled') => {
    setSelectedOrder(order);
    setPendingStatus(status);
    setStatusNote('');
    
    // Only show dialog for cancellation
    if (status === 'cancelled') {
      setIsDialogOpen(true);
    } else if (status === 'completed') {
      // Direct confirmation for completed orders
      handleStatusUpdate(order.id, status);
    } else {
      // Direct update for pending
      handleStatusUpdate(order.id, status);
    }
  };

  const openOrderDetails = (order: Order) => {
    setOrderDetailsData(order);
    setIsOrderDetailsOpen(true);
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
    return new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return <div className="space-y-6 p-2 sm:p-4 bg-slate-50 min-h-screen">
      {/* Compact Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-blue-100 text-xs font-medium mb-1">إجمالي الطلبات</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-blue-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-emerald-100 text-xs font-medium mb-1">إجمالي المبيعات</p>
                <p className="text-lg font-bold whitespace-nowrap">₪{stats.totalRevenue.toFixed(0)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-emerald-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-purple-100 text-xs font-medium mb-1">متوسط الطلب</p>
                <p className="text-lg font-bold whitespace-nowrap">₪{stats.avgOrderValue.toFixed(0)}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-purple-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-amber-100 text-xs font-medium mb-1">في الانتظار</p>
                <p className="text-lg font-bold">{stats.pendingOrders}</p>
              </div>
              <Clock className="h-5 w-5 text-amber-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-green-100 text-xs font-medium mb-1">مكتملة</p>
                <p className="text-lg font-bold">{stats.completedOrders}</p>
              </div>
              <Check className="h-5 w-5 text-green-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-center w-full">
                <p className="text-red-100 text-xs font-medium mb-1">ملغية</p>
                <p className="text-lg font-bold">{stats.cancelledOrders}</p>
              </div>
              <X className="h-5 w-5 text-red-200 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard with 4 Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm border h-auto">
          <TabsTrigger 
            value="pending" 
            className="flex items-center gap-2 p-3 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 data-[state=active]:border-amber-300 text-slate-700 hover:bg-slate-100"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">الطلبات المعلقة</span>
            <span className="sm:hidden font-medium">معلقة</span>
            <Badge variant="secondary" className="text-xs bg-amber-200 text-amber-800">{pendingOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            className="flex items-center gap-2 p-3 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-blue-300 text-slate-700 hover:bg-slate-100"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">جميع الطلبات</span>
            <span className="sm:hidden font-medium">الكل</span>
            <Badge variant="secondary" className="text-xs bg-blue-200 text-blue-800">{orders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="top" 
            className="flex items-center gap-2 p-3 data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 text-slate-700 hover:bg-slate-100"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">الأكثر مبيعاً</span>
            <span className="sm:hidden font-medium">الأكثر</span>
          </TabsTrigger>
          <TabsTrigger 
            value="least" 
            className="flex items-center gap-2 p-3 data-[state=active]:bg-red-100 data-[state=active]:text-red-800 data-[state=active]:border-red-300 text-slate-700 hover:bg-slate-100"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline font-medium">الأقل مبيعاً</span>
            <span className="sm:hidden font-medium">الأقل</span>
          </TabsTrigger>
        </TabsList>

        {/* Pending Orders Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                الطلبات المعلقة ({pendingOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد طلبات معلقة</p>
                </div>
              ) : (
                <div className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-slate-700 font-semibold text-xs px-2 w-16">رقم الطلب</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-20">العميل</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-20">المتجر</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">المدينة</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">المبلغ</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-slate-50 h-12">
                          <TableCell className="font-mono text-xs font-medium text-blue-600 px-2 cursor-pointer hover:underline py-1" onClick={() => openOrderDetails(order)}>
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell className="font-medium text-xs text-slate-800 px-1 py-1 max-w-20">
                            <div className="break-words leading-tight">{order.customerName}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 px-1 py-1 max-w-20">
                            <div className="break-words leading-tight">{order.shopName}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 px-1 py-1 max-w-16">
                            <div className="break-words leading-tight">{order.city}</div>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-600 px-1 py-1">₪{order.total}</TableCell>
                          <TableCell className="px-1 py-1">
                            <div className="flex gap-1">
                              <Button size="sm" className="h-6 w-6 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Orders Tab */}
        <TabsContent value="all" className="mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4 border-b bg-slate-50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  جميع الطلبات ({orders.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="البحث في الطلبات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-sm w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد طلبات</p>
                </div>
              ) : (
                <div className="w-full max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50 z-10">
                      <TableRow>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">رقم الطلب</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-20">العميل</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-20">المتجر</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">المدينة</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">المبلغ</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-14">الحالة</TableHead>
                        <TableHead className="text-slate-700 font-semibold text-xs px-1 w-16">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-slate-50 h-12">
                          <TableCell className="font-mono text-xs font-medium text-blue-600 px-1 cursor-pointer hover:underline py-1" onClick={() => openOrderDetails(order)}>
                            #{order.orderNumber}
                          </TableCell>
                          <TableCell className="font-medium text-xs text-slate-800 px-1 py-1 max-w-20">
                            <div className="break-words leading-tight">{order.customerName}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 px-1 py-1 max-w-20">
                            <div className="break-words leading-tight">{order.shopName}</div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 px-1 py-1 max-w-16">
                            <div className="break-words leading-tight">{order.city}</div>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-emerald-600 px-1 py-1">₪{order.total}</TableCell>
                          <TableCell className="px-1 py-1">{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="px-1 py-1">
                            <div className="flex gap-1">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" className="h-6 w-6 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {(order.status === 'completed' || order.status === 'cancelled') && (
                                <>
                                  <Button size="sm" className="h-6 w-6 p-0 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => openStatusDialog(order, 'pending')}>
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                  {order.status === 'completed' && (
                                    <Button size="sm" className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white" onClick={() => openStatusDialog(order, 'cancelled')}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {order.status === 'cancelled' && (
                                    <Button size="sm" className="h-6 w-6 p-0 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => openStatusDialog(order, 'completed')}>
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Most Sold Tab */}
        <TabsContent value="top" className="mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                الأكثر مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {stats.topProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد مبيعات بعد</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.topProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Least Sold Tab */}
        <TabsContent value="least" className="mt-6">
          <Card className="shadow-sm border-0 bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Package className="h-5 w-5" />
                الأقل مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {stats.leastProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد مبيعات بعد</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.leastProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Order Dialog - Fixed to prevent auto-keyboard popup */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">إلغاء الطلب</DialogTitle>
            <DialogDescription className="text-slate-600">
              طلب رقم #{selectedOrder?.orderNumber}
              <br />
              هل أنت متأكد من إلغاء هذا الطلب؟
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="note" className="text-sm text-slate-700">سبب الإلغاء (اختياري)</Label>
            <Textarea 
              id="note" 
              placeholder="أضف ملاحظة حول سبب الإلغاء..." 
              value={statusNote} 
              onChange={e => setStatusNote(e.target.value)} 
              className="resize-none h-20 text-sm border-slate-200 focus:border-blue-500"
              autoFocus={false}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-sm border-slate-200 text-slate-600 hover:bg-slate-50">
              إلغاء
            </Button>
            <Button 
              onClick={() => selectedOrder && handleStatusUpdate(selectedOrder.id, 'cancelled', statusNote)} 
              className="text-sm text-white bg-red-600 hover:bg-red-700"
            >
              إلغاء الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modern Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 to-white">
          <DialogHeader className="space-y-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-800">
                  Order #{orderDetailsData?.orderNumber}
                </DialogTitle>
                <p className="text-slate-500 text-sm mt-1">Complete order information and details</p>
              </div>
            </div>
          </DialogHeader>
          
          {orderDetailsData && (
            <div className="space-y-6 py-6">
              {/* Status and Date Row */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Order Date</p>
                    <p className="text-lg font-semibold text-slate-900">{formatDate(orderDetailsData.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">Status</p>
                    <div className="mt-1">{getStatusBadge(orderDetailsData.status)}</div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Customer Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-600">Customer Name</Label>
                    <p className="text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg">{orderDetailsData.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      Shop Name
                    </Label>
                    <p className="text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg">{orderDetailsData.shopName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      City
                    </Label>
                    <p className="text-base font-semibold text-slate-900 bg-slate-50 p-3 rounded-lg">{orderDetailsData.city}</p>
                  </div>
                </div>
              </div>

              {/* Customer Notes */}
              {orderDetailsData.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 bg-amber-100 rounded">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-amber-800">Customer Notes</h3>
                  </div>
                  <p className="text-amber-700 bg-white p-4 rounded-lg shadow-sm italic">"{orderDetailsData.notes}"</p>
                </div>
              )}

              {/* Admin Notes */}
              {orderDetailsData.adminNotes && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1 bg-blue-100 rounded">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-blue-800">Admin Notes</h3>
                  </div>
                  <p className="text-blue-700 bg-white p-4 rounded-lg shadow-sm italic">"{orderDetailsData.adminNotes}"</p>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Ordered Products</h3>
                </div>
                <div className="space-y-3">
                  {orderDetailsData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm" 
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 text-base">{item.product.name}</h4>
                        <p className="text-sm text-slate-500 mb-1">{item.product.category}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-slate-600">Quantity: <span className="font-semibold text-blue-600">{item.quantity}</span></span>
                          <span className="text-slate-600">Unit Price: <span className="font-semibold text-emerald-600">₪{item.product.price}</span></span>
                          <span className="text-slate-600">Total: <span className="font-bold text-emerald-700">₪{item.quantity * item.product.price}</span></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total */}
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Order Total</p>
                      <p className="text-3xl font-bold">₪{orderDetailsData.total}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-100 text-sm">Payment Status</p>
                    <p className="text-lg font-semibold">
                      {orderDetailsData.status === 'completed' ? 'Confirmed' : 
                       orderDetailsData.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-6 border-t border-slate-200">
            <Button 
              onClick={() => setIsOrderDetailsOpen(false)} 
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2"
            >
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};

export default AdminDashboard;
