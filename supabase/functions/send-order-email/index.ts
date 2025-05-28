
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  order: {
    orderNumber: string;
    customerName: string;
    shopName: string;
    city: string;
    total: number;
    items: Array<{
      product: {
        name: string;
        price: number;
      };
      quantity: number;
    }>;
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

    const itemsList = order.items.map(item => 
      `• ${item.product.name} - الكمية: ${item.quantity} - السعر: ₪${item.product.price * item.quantity}`
    ).join('\n');

    const emailContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1e40af; text-align: center;">طلب جديد - ${order.orderNumber}</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">تفاصيل العميل:</h2>
          <p><strong>الاسم:</strong> ${order.customerName}</p>
          <p><strong>الصالون:</strong> ${order.shopName}</p>
          <p><strong>المدينة:</strong> ${order.city}</p>
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">المنتجات المطلوبة:</h2>
          <div style="white-space: pre-line; line-height: 1.6;">${itemsList}</div>
          <hr style="margin: 15px 0;">
          <p style="font-size: 18px; font-weight: bold; color: #059669;">المجموع: ₪${order.total}</p>
        </div>

        ${order.notes ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">ملاحظات:</h2>
          <p>${order.notes}</p>
        </div>
        ` : ''}

        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>تاريخ الطلب:</strong> ${new Date(order.date).toLocaleString('ar-EG')}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #6b7280;">متجر أدوات الحلاقة</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "متجر أدوات الحلاقة <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `طلب جديد رقم ${order.orderNumber} من ${order.customerName}`,
      html: emailContent,
    });

    console.log("Order email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
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
