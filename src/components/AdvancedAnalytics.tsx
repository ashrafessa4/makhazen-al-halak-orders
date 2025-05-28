import { useState, useMemo } from 'react';
import { Order, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users, Calendar, BarChart3, PieChart, Target, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Cell, AreaChart, Area, Pie } from 'recharts';

interface AdvancedAnalyticsProps {
  orders: Order[];
  products: Product[];
  onBack: () => void;
}

const AdvancedAnalytics = ({ orders, products, onBack }: AdvancedAnalyticsProps) => {
  const analytics = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

    // Monthly revenue trend
    const monthlyData = completedOrders.reduce((acc, order) => {
      const month = new Date(order.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + order.total;
      return acc;
    }, {} as Record<string, number>);

    const monthlyRevenue = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue,
      orders: completedOrders.filter(o => 
        new Date(o.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' }) === month
      ).length
    }));

    // Daily orders for last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const dailyOrders = last30Days.map(date => {
      const dayOrders = orders.filter(o => 
        new Date(o.date).toDateString() === date.toDateString()
      );
      return {
        date: date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }),
        orders: dayOrders.length,
        revenue: dayOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.total, 0)
      };
    });

    // Product performance
    const productSales = {} as Record<string, { sales: number; revenue: number; product: Product }>;
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales[item.product.id]) {
          productSales[item.product.id] = { sales: 0, revenue: 0, product: item.product };
        }
        productSales[item.product.id].sales += item.quantity;
        productSales[item.product.id].revenue += item.quantity * item.product.price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category performance
    const categoryData = {} as Record<string, { sales: number; revenue: number }>;
    Object.values(productSales).forEach(({ product, sales, revenue }) => {
      if (!categoryData[product.category]) {
        categoryData[product.category] = { sales: 0, revenue: 0 };
      }
      categoryData[product.category].sales += sales;
      categoryData[product.category].revenue += revenue;
    });

    const categoryPerformance = Object.entries(categoryData).map(([category, data]) => ({
      name: category,
      value: data.revenue,
      sales: data.sales
    }));

    // Customer insights
    const customerData = {} as Record<string, { orders: number; revenue: number; lastOrder: Date }>;
    completedOrders.forEach(order => {
      if (!customerData[order.customerName]) {
        customerData[order.customerName] = { orders: 0, revenue: 0, lastOrder: order.date };
      }
      customerData[order.customerName].orders += 1;
      customerData[order.customerName].revenue += order.total;
      if (order.date > customerData[order.customerName].lastOrder) {
        customerData[order.customerName].lastOrder = order.date;
      }
    });

    const topCustomers = Object.entries(customerData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // City analysis
    const cityData = {} as Record<string, number>;
    completedOrders.forEach(order => {
      cityData[order.city] = (cityData[order.city] || 0) + order.total;
    });

    const topCities = Object.entries(cityData)
      .map(([city, revenue]) => ({ city, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      monthlyRevenue,
      dailyOrders,
      topProducts,
      categoryPerformance,
      topCustomers,
      topCities,
      completedOrdersCount: completedOrders.length,
      pendingOrdersCount: orders.filter(o => o.status === 'pending').length,
      cancelledOrdersCount: orders.filter(o => o.status === 'cancelled').length,
      conversionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
    };
  }, [orders, products]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Button>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              التحليلات المتقدمة
            </h1>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs mb-1">إجمالي المبيعات</p>
                  <p className="text-xl font-bold">₪{analytics.totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs mb-1">طلبات مكتملة</p>
                  <p className="text-xl font-bold">{analytics.completedOrdersCount}</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs mb-1">متوسط الطلب</p>
                  <p className="text-xl font-bold">₪{analytics.avgOrderValue.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-5 w-5 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs mb-1">في الانتظار</p>
                  <p className="text-xl font-bold">{analytics.pendingOrdersCount}</p>
                </div>
                <Clock className="h-5 w-5 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs mb-1">معدل التحويل</p>
                  <p className="text-xl font-bold">{analytics.conversionRate.toFixed(1)}%</p>
                </div>
                <Target className="h-5 w-5 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs mb-1">عدد المنتجات</p>
                  <p className="text-xl font-bold">{products.length}</p>
                </div>
                <Package className="h-5 w-5 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
            <TabsTrigger value="geography">الجغرافيا</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    المبيعات الشهرية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    الطلبات اليومية (آخر 30 يوم)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.dailyOrders}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    أداء الفئات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={analytics.categoryPerformance}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.categoryPerformance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    أفضل المنتجات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topProducts.slice(0, 8).map((item, index) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <img src={item.product.image} alt={item.product.name} className="w-8 h-8 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-slate-500">{item.sales} مبيعة - ₪{item.revenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  أفضل العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analytics.topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-slate-600">{customer.orders} طلبات - ₪{customer.revenue}</p>
                        <p className="text-xs text-slate-500">آخر طلب: {new Date(customer.lastOrder).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  المبيعات حسب المدينة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.topCities} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="city" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
