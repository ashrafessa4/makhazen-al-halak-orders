
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
  };
  quantity: number;
}

interface OrderEmailRequest {
  order: {
    orderNumber: string;
    customerName: string;
    shopName: string;
    city: string;
    total: number;
    items: OrderItem[];
    notes?: string;
    date: string;
  };
  adminEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order, adminEmail }: OrderEmailRequest = await req.json();

    console.log('Sending order email to:', adminEmail);
    console.log('Order details:', order);

    const itemsHtml = order.items.map(item => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; text-align: right;">${item.product.name}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: center;">₪${item.product.price}</td>
        <td style="padding: 12px; text-align: center;">₪${(item.product.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailResponse = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [adminEmail],
      subject: `طلب جديد رقم ${order.orderNumber} - ${order.customerName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>طلب جديد</title>
        </head>
        <body style="font-family: 'Cairo', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; direction: rtl;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e40af, #059669); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🆕 طلب جديد</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">رقم الطلب: ${order.orderNumber}</p>
            </div>

            <!-- Customer Info -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">معلومات العميل</h2>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #374151;">👤 اسم العميل:</span>
                    <span style="color: #1f2937;">${order.customerName}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #374151;">🏪 اسم الصالون:</span>
                    <span style="color: #1f2937;">${order.shopName}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #374151;">📍 المدينة:</span>
                    <span style="color: #1f2937;">${order.city}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #374151;">📅 تاريخ الطلب:</span>
                    <span style="color: #1f2937;">${new Date(order.date).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              </div>

              <!-- Products Table -->
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📦 المنتجات المطلوبة</h2>
              
              <div style="overflow-x: auto; margin-bottom: 30px;">
                <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                  <thead>
                    <tr style="background: linear-gradient(135deg, #1e40af, #059669); color: white;">
                      <th style="padding: 15px; text-align: right; font-weight: bold;">اسم المنتج</th>
                      <th style="padding: 15px; text-align: center; font-weight: bold;">الكمية</th>
                      <th style="padding: 15px; text-align: center; font-weight: bold;">السعر</th>
                      <th style="padding: 15px; text-align: center; font-weight: bold;">المجموع</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>
              </div>

              <!-- Total -->
              <div style="background: linear-gradient(135deg, #059669, #047857); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <h3 style="margin: 0; font-size: 24px; font-weight: bold;">💰 المبلغ الإجمالي: ₪${order.total.toFixed(2)}</h3>
              </div>

              ${order.notes ? `
                <!-- Notes -->
                <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">📝 ملاحظات العميل:</h3>
                  <p style="color: #92400e; margin: 0; font-size: 16px; line-height: 1.6;">${order.notes}</p>
                </div>
              ` : ''}

              <!-- Action Required -->
              <div style="background-color: #dbeafe; border-right: 4px solid #3b82f6; padding: 20px; border-radius: 8px;">
                <h3 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px;">⚡ الإجراءات المطلوبة:</h3>
                <ul style="color: #1e40af; margin: 0; padding-right: 20px; line-height: 1.8;">
                  <li>التواصل مع العميل لتأكيد الطلب</li>
                  <li>تحضير المنتجات المطلوبة</li>
                  <li>تنسيق عملية التوصيل</li>
                  <li>تحصيل المبلغ عند التسليم</li>
                </ul>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                تم إرسال هذا البريد الإلكتروني تلقائياً من نظام متجر أدوات الحلاقة
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
