
import { Order } from '@/types';

// Detect if the user is on iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

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
  
  // For iOS, use different WhatsApp URL format
  let whatsappUrl;
  if (isIOS()) {
    // iOS specific WhatsApp URL
    whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
  } else {
    // Standard web WhatsApp URL for Android and other platforms
    whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
  
  console.log('Platform detected:', isIOS() ? 'iOS' : 'Other');
  console.log('WhatsApp URL:', whatsappUrl);
  
  // Try to open WhatsApp
  try {
    if (isIOS()) {
      // For iOS, try the app first, then fallback to web
      window.location.href = whatsappUrl;
      
      // Fallback to web version after a short delay if app doesn't open
      setTimeout(() => {
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(webUrl, '_blank');
      }, 1000);
    } else {
      // For other platforms, open in new tab
      window.open(whatsappUrl, '_blank');
    }
  } catch (error) {
    console.error('Error opening WhatsApp:', error);
    // Fallback to web version
    const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(webUrl, '_blank');
  }
  
  console.log('WhatsApp notification sent for order:', order.orderNumber);
  console.log('Message:', message);
  console.log('Phone number:', whatsappNumber);
};

export const generateOrderNumber = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
