
import { useState, useEffect } from 'react';
import { Order, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/products';

interface AdminDashboardProps {
  orders: Order[];
}

const AdminDashboard = ({ orders }: AdminDashboardProps) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topProducts: [] as { product: Product; sales: number }[]
  });

  useEffect(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top products
    const productSales: { [key: string]: number } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        productSales[item.product.id] = (productSales[item.product.id] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(productSales)
      .map(([productId, sales]) => ({
        product: products.find(p => p.id === productId)!,
        sales
      }))
      .filter(item => item.product)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    setStats({ totalOrders, totalRevenue, avgOrderValue, topProducts });
  }, [orders]);

  const recentOrders = orders.slice(-10).reverse();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-barber-dark">لوحة التحكم</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إجمالي الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-barber-blue">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">إجمالي المبيعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-barber-green">₪{stats.totalRevenue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">متوسط قيمة الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-barber-gold">₪{stats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">الطلبات الأخيرة</TabsTrigger>
          <TabsTrigger value="products">المنتجات الأكثر مبيعاً</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آخر 10 طلبات</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-500">لا توجد طلبات بعد</p>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-sm text-gray-600">{order.customerName} - {order.shopName}</div>
                        <div className="text-sm text-gray-500">{order.city}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-barber-blue">₪{order.total}</div>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                          {order.status === 'pending' ? 'في الانتظار' :
                           order.status === 'processing' ? 'قيد التنفيذ' : 'مكتمل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المنتجات الأكثر مبيعاً</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-gray-500">لا توجد مبيعات بعد</p>
              ) : (
                <div className="space-y-3">
                  {stats.topProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-barber-blue text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{item.product.name}</div>
                        <div className="text-sm text-gray-600">{item.product.category}</div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-barber-green">{item.sales} قطعة</div>
                        <div className="text-sm text-gray-500">₪{item.product.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
