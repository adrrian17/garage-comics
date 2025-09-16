import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import Stripe from "stripe";

export const server = {
  createConnectedAccount: defineAction({
    input: z.object({
      email: z.string().email(),
    }),
    handler: async (input) => {
      try {
        const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

        // Create Express connected account
        const account = await stripe.accounts.create({
          type: "express",
          country: "MX",
          email: input.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "individual",
          settings: {
            payouts: {
              schedule: {
                interval: "daily",
                delay_days: 7,
              },
            },
          },
        });

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${import.meta.env.SITE_URL || "http://localhost:4321"}/connect/refresh`,
          return_url: `${import.meta.env.SITE_URL || "http://localhost:4321"}/connect/return`,
          type: "account_onboarding",
        });

        return {
          accountId: account.id,
          onboardingUrl: accountLink.url,
          account: {
            id: account.id,
            email: account.email,
            created: account.created,
            country: account.country,
            type: account.type,
            details_submitted: account.details_submitted,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
          },
        };
      } catch (error) {
        console.error("Error creating connected account:", error);

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Error creating connected account",
        });
      }
    },
  }),
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
};
