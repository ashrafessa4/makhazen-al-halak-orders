
import { Order } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export const generateOrderNumber = async (): Promise<string> => {
  let orderNumber: string;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 5-digit number (10000-99999)
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    orderNumber = randomNum.toString();
    
    // Check if this order number already exists
    const { data: existingOrder, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No existing order found, this number is unique
      isUnique = true;
    } else if (error) {
      console.error('Error checking order number uniqueness:', error);
      // If there's an error, generate a new number and try again
      continue;
    } else {
      // Order number exists, generate a new one
      continue;
    }
  }
  
  return orderNumber!;
};

export const sendWhatsAppNotification = (order: Order, phoneNumber: string) => {
  const itemsList = order.items
    .map(item => `${item.product.name} (x${item.quantity}) - ₪${item.product.price * item.quantity}`)
    .join('\n');

  const message = `🛒 *طلب جديد رقم ${order.orderNumber}*

👤 *العميل:* ${order.customerName}
🏪 *المتجر:* ${order.shopName}
📍 *المدينة:* ${order.city}

📦 *المنتجات:*
${itemsList}

💰 *المبلغ الإجمالي:* ₪${order.total}

📝 *ملاحظات:* ${order.notes || 'لا توجد ملاحظات'}

📅 *التاريخ:* ${order.date.toLocaleDateString('ar-SA')}`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
  
  window.open(whatsappUrl, '_blank');
};
