import { drizzle } from "drizzle-orm/postgres-js";
import { api } from "encore.dev/api";
import { Subscription, Topic } from "encore.dev/pubsub";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { db } from "../database";
import { orders } from "../schema";

interface OrderItem {
  productName: string;
  productImage?: string;
  productSlug: string;
  amount: number;
}

export interface OrderMessage {
  orderId: string;
  customerEmail: string;
  customerName: string | null;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
  sessionId: string;
}

interface ProcessOrderResponse {
  success: boolean;
  orderId: string;
  message: string;
}

export const ordersTopic = new Topic<OrderMessage>("orders", {
  deliveryGuarantee: "at-least-once",
});

// API endpoint to manually publish an order (for testing or external integrations)
export const publishOrder = api(
  { method: "POST", path: "/orders", expose: true },
  async (order: OrderMessage): Promise<ProcessOrderResponse> => {
    try {
      const messageId = await ordersTopic.publish(order);

      return {
        success: true,
        orderId: order.orderId,
        message: `Order published successfully with message ID: ${messageId}`,
      };
    } catch (error) {
      console.error("Error publishing order:", error);

      return {
        success: false,
        orderId: order.orderId,
        message: `Failed to publish order: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
);

// Subscribe to orders from the topic
const _ = new Subscription(ordersTopic, "process-orders", {
  handler: async (order: OrderMessage) => {
    console.log(`Processing order: ${order.orderId}`);

    try {
      // Save the order message to the database
      await db.insert(orders).values({
        order,
      });

      console.log(`Order ${order.orderId} saved to database successfully`);
    } catch (error) {
      console.error(`Error processing order ${order.orderId}:`, error);
      throw error; // This will trigger retry mechanism
    }
  },
});
