
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
import { Check, X, Clock, RotateCcw, ShoppingCart, DollarSign, TrendingUp, Package, BarChart3, Search, Eye } from 'lucide-react';

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
      if (error) throw error;
      setOrders(prev => prev.map(order => order.id === orderId ? {
        ...order,
        status: newStatus,
        adminNotes: note
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
    return new Intl.DateTimeFormat('ar-SA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return <div className="space-y-6 p-4 bg-slate-50 min-h-screen">
      {/* Compact Stats Grid - Rearranged */}
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

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Left: Pending Orders */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4 border-b bg-slate-50">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
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
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">رقم الطلب</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">العميل</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المتجر</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المدينة</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المبلغ</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map(order => (
                      <TableRow key={order.id} className="hover:bg-slate-50" style={{ height: '40px' }}>
                        <TableCell className="font-mono text-xs font-medium text-blue-600 px-1 cursor-pointer hover:underline" onClick={() => openOrderDetails(order)}>
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-slate-800 px-1">{order.customerName}</TableCell>
                        <TableCell className="text-xs text-slate-600 px-1">{order.shopName}</TableCell>
                        <TableCell className="text-xs text-slate-600 px-1">{order.city}</TableCell>
                        <TableCell className="font-bold text-xs text-emerald-600 px-1">₪{order.total}</TableCell>
                        <TableCell className="px-1">
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

        {/* Top Right: Most Sold Items */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4 border-b bg-slate-50">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
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
                  <div key={item.product.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 object-cover rounded-lg border-2 border-white shadow-sm" />
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

        {/* Bottom Left: All Orders with Search */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4 border-b bg-slate-50">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              جميع الطلبات ({orders.length})
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Search className="h-4 w-4 text-slate-500" />
              <Input
                placeholder="البحث في الطلبات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>لا توجد طلبات</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">رقم الطلب</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">العميل</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المتجر</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المدينة</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">المبلغ</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">الحالة</TableHead>
                      <TableHead className="text-slate-700 font-semibold text-xs px-1">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map(order => (
                      <TableRow key={order.id} className="hover:bg-slate-50" style={{ height: '40px' }}>
                        <TableCell className="font-mono text-xs font-medium text-blue-600 px-1 cursor-pointer hover:underline" onClick={() => openOrderDetails(order)}>
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell className="font-medium text-xs text-slate-800 px-1">{order.customerName}</TableCell>
                        <TableCell className="text-xs text-slate-600 px-1">{order.shopName}</TableCell>
                        <TableCell className="text-xs text-slate-600 px-1">{order.city}</TableCell>
                        <TableCell className="font-bold text-xs text-emerald-600 px-1">₪{order.total}</TableCell>
                        <TableCell className="px-1">{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="px-1">
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

        {/* Bottom Right: Least Sold Items */}
        <Card className="shadow-sm border-0 bg-white">
          <CardHeader className="pb-4 border-b bg-slate-50">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
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
                  <div key={item.product.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <img src={item.product.image} alt={item.product.name} className="w-10 h-10 object-cover rounded-lg border-2 border-white shadow-sm" />
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
      </div>

      {/* Analytics Button - Disabled */}
      <div className="flex justify-center pt-8 pb-4">
        <Button 
          disabled
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BarChart3 className="h-5 w-5 mr-2" />
          التحليلات المتقدمة (قريباً)
        </Button>
      </div>

      {/* Cancel Order Dialog */}
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

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              تفاصيل الطلب #{orderDetailsData?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {orderDetailsData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">اسم العميل</Label>
                  <p className="text-sm text-slate-900">{orderDetailsData.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">اسم المتجر</Label>
                  <p className="text-sm text-slate-900">{orderDetailsData.shopName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">المدينة</Label>
                  <p className="text-sm text-slate-900">{orderDetailsData.city}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">الحالة</Label>
                  <div className="mt-1">{getStatusBadge(orderDetailsData.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">تاريخ الطلب</Label>
                  <p className="text-sm text-slate-900">{formatDate(orderDetailsData.date)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">إجمالي المبلغ</Label>
                  <p className="text-sm font-bold text-emerald-600">₪{orderDetailsData.total}</p>
                </div>
              </div>
              
              {orderDetailsData.notes && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">ملاحظات العميل</Label>
                  <p className="text-sm text-slate-900 bg-slate-50 p-2 rounded">{orderDetailsData.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-slate-700">المنتجات المطلوبة</Label>
                <div className="mt-2 space-y-2">
                  {orderDetailsData.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-slate-500">{item.product.category}</p>
                        <p className="text-xs text-slate-600">الكمية: {item.quantity} × ₪{item.product.price} = ₪{item.quantity * item.product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsOrderDetailsOpen(false)} className="text-sm">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};

export default AdminDashboard;
