import { boolean, index, jsonb, pgTable, serial } from "drizzle-orm/pg-core";
import type { OrderMessage } from "./orders/orders";

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    order: jsonb("message_payload").$type<OrderMessage>().notNull(),
    processed: boolean("processed").notNull().default(false),
    confirmed: boolean("confirmed").notNull().default(false),
  },
  (table) => [index("idx_message_payload_gin").using("gin", table.order)],
);
