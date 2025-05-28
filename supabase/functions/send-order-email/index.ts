
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

    // Use a simple sender address to avoid any delivery issues
    const emailResponse = await resend.emails.send({
      from: "orders@resend.dev",
      to: [adminEmail],
      subject: `New Order ${order.orderNumber} - ${order.customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">New Order Received!</h1>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #333; margin-top: 0;">Order Information</h2>
            <p><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p><strong>Customer Name:</strong> ${order.customerName}</p>
            <p><strong>Shop Name:</strong> ${order.shopName}</p>
            <p><strong>City:</strong> ${order.city}</p>
            <p><strong>Order Date:</strong> ${new Date(order.date).toLocaleDateString()}</p>
          </div>

          <div style="margin: 20px 0;">
            <h2 style="color: #333;">Ordered Items</h2>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
              <thead>
                <tr style="background-color: #f9f9f9;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Product</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Quantity</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Price</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #2d5a2d;">Order Total: ₪${order.total.toFixed(2)}</h3>
          </div>

          ${order.notes ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #856404; margin-top: 0;">Customer Notes:</h3>
              <p style="color: #856404; margin-bottom: 0;">${order.notes}</p>
            </div>
          ` : ''}

          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0c5460; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #0c5460; margin-bottom: 0;">
              <li>Contact the customer to confirm the order</li>
              <li>Prepare the requested products</li>
              <li>Arrange delivery</li>
              <li>Collect payment upon delivery</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              This email was sent automatically from the Barber Tools Store system
            </p>
          </div>
        </div>
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
