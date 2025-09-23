import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { db, submissions } from "@garage-comics/database";
import Stripe from "stripe";

// Utility functions for sanitization and validation
function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>"'%;()&+\\]/g, "") // Remove potentially dangerous characters
    .replace(/\s+/g, " ")
    .substring(0, 1000);
}

function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>"'%;()&+\\]/g, "")
    .substring(0, 254);
}

function sanitizeUrl(url: string): string {
  return url
    .trim()
    .replace(/[<>"'%;()&+\\\s]/g, "") // Remove dangerous chars and whitespace
    .substring(0, 2048);
}

function validatePortfolioUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http/https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const submissionSchema = z.object({
  nombre: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .transform(sanitizeString)
    .refine(
      (name) => name.length >= 2,
      "Name must be at least 2 characters after sanitization",
    )
    .refine(
      (name) => /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(name),
      "Name can only contain letters and spaces",
    ),
  correo: z
    .string()
    .email("Please enter a valid email address")
    .transform(sanitizeEmail)
    .refine(
      (email) => email.includes("@") && email.includes("."),
      "Invalid email format",
    )
    .refine((email) => email.length <= 254, "Email address too long"),
  portafolio: z
    .string()
    .url("Please enter a valid URL")
    .transform(sanitizeUrl)
    .refine(
      validatePortfolioUrl,
      "URL must be valid and use http or https protocol",
    )
    .refine(
      (url) => url.startsWith("http"),
      "URL must include protocol (http:// or https://)",
    ),
  pitch: z
    .string()
    .min(1, "Pitch is required")
    .max(500, "Pitch cannot exceed 500 characters")
    .transform(sanitizeString)
    .refine(
      (pitch) => pitch.length >= 10,
      "Pitch must be at least 10 characters after sanitization",
    )
    .refine(
      (pitch) => pitch.length <= 500,
      "Pitch too long after sanitization",
    ),
});

export const server = {
  generateCheckout: defineAction({
    input: z.array(
      z.object({
        productId: z.string(),
        priceId: z.string(),
      }),
    ),
    handler: async (input) => {
      const lineItems = input.map((item) => {
        return {
          price: item.priceId,
          quantity: 1,
        };
      });

      try {
        const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

        const session: Stripe.Checkout.Session =
          await stripe.checkout.sessions.create({
            payment_method_types: ["card", "oxxo"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${import.meta.env.SITE_URL || "http://localhost:4321"}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${import.meta.env.SITE_URL || "http://localhost:4321"}/cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
              products: JSON.stringify(input.map((item) => item.priceId)),
            },
          });

        if (session) {
          return { url: session.url };
        } else {
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Couldn't generate Stripe checkout",
          });
        }
      } catch (error: unknown) {
        console.error(error);

        if (error instanceof ActionError) {
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          });
        } else {
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unexpected error",
          });
        }
      }
    },
  }),
  sendSubmission: defineAction({
    input: submissionSchema,
    handler: async (input) => {
      try {
        const { nombre, correo, portafolio, pitch } = input;

        const submissionData = {
          nombre,
          correo,
          portafolio,
          pitch,
          status: "pending" as const,
        };

        const result = await db
          .insert(submissions)
          .values(submissionData)
          .returning();

        console.log("Submission saved to database:", result[0]);

        return {
          success: true,
          message: "Submission received successfully",
          submissionId: result[0].id,
        };
      } catch (error) {
        console.error("Error processing submission:", {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to process submission. Please try again later.",
        });
      }
    },
  }),
};
