import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Define status enum for type safety
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    correo: varchar("correo", { length: 254 }).notNull(),
    portafolio: text("portafolio").notNull(),
    pitch: text("pitch").notNull(),
    status: submissionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("email_idx").on(table.correo),
    index("status_idx").on(table.status),
    index("created_at_idx").on(table.createdAt),
  ],
);

// Infer types from schema
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];
