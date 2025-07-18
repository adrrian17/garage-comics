import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import Stripe from "stripe";

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
            success_url: `http://localhost:4321/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:4321/cancel?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
              products: JSON.stringify(input.map((item) => item.productId)),
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
};
