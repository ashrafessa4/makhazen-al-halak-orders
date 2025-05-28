
import { Order } from '@/types';

// Detect if the user is on iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Function to convert Arabic numbers to English numbers
const convertToEnglishNumbers = (str: string) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str;
  arabicNumbers.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), englishNumbers[index]);
  });
  
  return result;
};

export const sendWhatsAppNotification = (order: Order, phoneNumber?: string) => {
  // Format date with English numbers
  const dateString = convertToEnglishNumbers(order.date.toLocaleString('ar-EG'));
  
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

📅 تاريخ الطلب: ${dateString}
  `.trim();

  // Use provided phone number or default
  const whatsappNumber = phoneNumber || "+972509617061";
  
  // For iOS, use different WhatsApp URL format
  let whatsappUrl;
  if (isIOS()) {
    // iOS specific WhatsApp URL - try app scheme first
    whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    
    console.log('iOS detected - opening WhatsApp app directly');
    console.log('WhatsApp URL:', whatsappUrl);
    
    // For iOS, open the URL directly which should work better
    window.location.href = whatsappUrl;
    
    // Fallback to web version after a short delay if app doesn't open
    setTimeout(() => {
      if (document.hasFocus()) {
        console.log('App might not have opened, trying web fallback');
        const webUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(webUrl, '_blank');
      }
    }, 2000);
  } else {
    // Standard web WhatsApp URL for Android and other platforms
    whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    console.log('Android/Other platform detected');
    console.log('WhatsApp URL:', whatsappUrl);
    window.open(whatsappUrl, '_blank');
  }
  
  console.log('WhatsApp notification sent for order:', order.orderNumber);
  console.log('Message:', message);
  console.log('Phone number:', whatsappNumber);
};

export const generateOrderNumber = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
