import { render } from "@react-email/render";
import { Resend } from "resend";
import OrderConfirmationEmail from "../components/emails/OrderConfirmation";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export interface OrderItem {
  productName: string;
  productImage?: string;
  amount: number;
}

export interface OrderConfirmationData {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  try {
    const emailHtml = await render(OrderConfirmationEmail(data));

    const { data: emailData, error } = await resend.emails.send({
      from: "Garage Comics <hola@garagecomics.mx>",
      to: [data.customerEmail],
      subject: "¡Gracias por tu pedido!",
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Order confirmation email sent:", emailData?.id);
    return { success: true, emailId: emailData?.id };
  } catch (error) {
    console.error("Error in sendOrderConfirmation:", error);
    throw error;
  }
}
