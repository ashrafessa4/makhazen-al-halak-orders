
import { Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Phone } from 'lucide-react';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
}

const OrderConfirmation = ({ order, onNewOrder }: OrderConfirmationProps) => {
  const handleWhatsAppContact = () => {
    const message = `مرحباً، أريد الاستفسار عن طلبي رقم ${order.orderNumber}`;
    const phoneNumber = "+972123456789"; // Replace with your actual WhatsApp number
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="max-w-md mx-auto text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-barber-green" />
        </div>
        <CardTitle className="text-barber-dark">شكراً لك، {order.customerName}!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-barber-blue/10 p-4 rounded-lg">
          <h3 className="font-semibold text-barber-dark mb-2">تفاصيل الطلب</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">رقم الطلب:</span> {order.orderNumber}</p>
            <p><span className="font-medium">الصالون:</span> {order.shopName}</p>
            <p><span className="font-medium">المدينة:</span> {order.city}</p>
            <p><span className="font-medium">المبلغ الإجمالي:</span> ₪{order.total}</p>
          </div>
        </div>

        <div className="bg-barber-green/10 p-4 rounded-lg">
          <h4 className="font-semibold text-barber-dark mb-2">الخطوات التالية:</h4>
          <ul className="text-sm text-gray-600 space-y-1 text-right">
            <li>• سنتواصل معك قريباً لتأكيد الطلب</li>
            <li>• سيتم توصيل الطلب لصالونك</li>
            <li>• الدفع عند الاستلام نقداً</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleWhatsAppContact}
            variant="outline"
            className="flex-1"
          >
            <Phone className="w-4 h-4 ml-2" />
            واتساب
          </Button>
          <Button 
            onClick={onNewOrder}
            className="flex-1 bg-barber-blue hover:bg-barber-blue/90"
          >
            طلب جديد
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderConfirmation;
