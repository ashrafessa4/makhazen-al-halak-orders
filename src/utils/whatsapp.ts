
import { Order } from '@/types';

export const sendWhatsAppNotification = (order: Order, phoneNumber?: string) => {
  const message = `
🆕 طلب جديد - ${order.orderNumber}

👤 العميل: ${order.customerName}
🏪 الصالون: ${order.shopName}
📍 المدينة: ${order.city}
💰 المبلغ: ₪${order.total}

📦 المنتجات:
${order.items.map(item => 
  `• ${item.product.name} - الكمية: ${item.quantity} - السعر: ₪${item.product.price * item.quantity}`
).join('\n')}

${order.notes ? `📝 ملاحظات: ${order.notes}` : ''}

📅 تاريخ الطلب: ${order.date.toLocaleString('ar-EG')}
  `.trim();

  // Use provided phone number or default
  const whatsappNumber = phoneNumber || "+972509617061";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in a new tab
  window.open(whatsappUrl, '_blank');
  
  console.log('WhatsApp notification sent for order:', order.orderNumber);
  console.log('Message:', message);
  console.log('Phone number:', whatsappNumber);
};

export const generateOrderNumber = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
