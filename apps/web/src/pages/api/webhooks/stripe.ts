export const prerender = false;

import { Redis } from "@upstash/redis";
import type { APIRoute } from "astro";
import Stripe from "stripe";
import { type OrderItem, sendOrderConfirmation } from "@/lib/email";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const redis = new Redis({
  url: import.meta.env.UPSTASH_REDIS_REST_URL,
  token: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
});

const STRIPE_CARD_FEE_PERCENT = 3.6;
const STRIPE_OXXO_FEE_PERCENT = 3.6;
const STRIPE_FIXED_FEE_MXN = 3;
const STRIPE_INTERNATIONAL_FEE_PERCENT = 0.5;
const STRIPE_CURRENCY_CONVERSION_FEE_PERCENT = 2.0;

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("No signature provided", { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      endpointSecret,
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const session = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        try {
          if (!session.data[0]?.metadata?.products) {
            console.error("No products were found in the session metadata");

            return new Response(
              JSON.stringify({ error: "No products found" }),
              {
                status: 400,
              },
            );
          }

          const priceIds = JSON.parse(session.data[0].metadata.products);
          const orderItems: OrderItem[] = [];

          for (const priceId of priceIds) {
            const price = await stripe.prices.retrieve(priceId);

            const amount = Number(price.unit_amount);
            if (Number.isNaN(amount)) {
              console.error(`Invalid price: ${priceId}`);
              continue;
            }

            const productInfo = await stripe.products.retrieve(
              price.product as string,
            );

            orderItems.push({
              productName: productInfo.name,
              productImage: productInfo.images?.[0],
              productSlug: productInfo.metadata.slug,
              amount: amount,
            });

            const paymentMethod = paymentIntent.payment_method_types[0];
            const paymentMethodDetails = await stripe.paymentMethods.retrieve(
              paymentIntent.payment_method as string,
            );
            const isInternationalCard =
              paymentMethodDetails.card?.country !== "MX";
            const requiresCurrencyConversion = paymentIntent.currency !== "mxn";

            let stripeFeePercent =
              paymentMethod === "oxxo"
                ? STRIPE_OXXO_FEE_PERCENT
                : STRIPE_CARD_FEE_PERCENT;

            if (isInternationalCard && paymentMethod !== "oxxo") {
              stripeFeePercent += STRIPE_INTERNATIONAL_FEE_PERCENT;
            }

            if (requiresCurrencyConversion) {
              stripeFeePercent += STRIPE_CURRENCY_CONVERSION_FEE_PERCENT;
            }

            const stripeFee = Math.round(
              (amount * stripeFeePercent) / 100 + STRIPE_FIXED_FEE_MXN,
            );

            const transferAmount = amount - stripeFee;

            const connectedAccountId = price.metadata.account as string;

            if (!connectedAccountId) {
              console.error(
                `No connected account found for product ${price.product}`,
              );
              continue;
            }

            const roundedTransferAmount = Math.round(transferAmount);
            await stripe.transfers.create({
              amount: roundedTransferAmount,
              currency: "mxn",
              destination: connectedAccountId,
              source_transaction: paymentIntent.latest_charge as string,
            });

            console.log(
              `Transfer created for product ${price.product}: ${roundedTransferAmount} MXN`,
            );
          }

          try {
            const customerEmail = session.data[0].customer_details?.email;
            const customerName = session.data[0].customer_details?.name;

            if (customerEmail && orderItems.length > 0) {
              await sendOrderConfirmation({
                customerEmail,
                customerName: customerName || undefined,
                orderId: paymentIntent.id,
                items: orderItems,
                total: paymentIntent.amount,
                paymentMethod: paymentIntent.payment_method_types[0],
              });

              console.log(`Order confirmation email sent to ${customerEmail}`);
            } else {
              console.log("No customer email found or no items to send");
            }
          } catch (emailError) {
            console.error(
              "Error sending order confirmation email:",
              emailError,
            );
          }

          try {
            const customerEmail = session.data[0].customer_details?.email;
            const customerName = session.data[0].customer_details?.name;

            if (customerEmail && orderItems.length > 0) {
              const orderData = {
                orderId: paymentIntent.id,
                customerEmail,
                customerName: customerName || null,
                items: orderItems.map((item) => ({
                  productName: item.productName,
                  productImage: item.productImage,
                  productSlug: item.productSlug,
                  amount: item.amount,
                })),
                total: paymentIntent.amount,
                paymentMethod: paymentIntent.payment_method_types[0],
                createdAt: new Date().toISOString(),
                sessionId: session.data[0].id,
                processed: false,
              };

              await redis.set(`order:${paymentIntent.id}`, orderData);

              await redis.sadd(
                `customer:${customerEmail}:orders`,
                paymentIntent.id,
              );

              console.log(
                `Order data successfully saved to Upstash for ${customerEmail}`,
              );
            } else {
              console.log(
                "No customer email found or no items to save in Upstash",
              );
            }
          } catch (upstashError) {
            console.error(
              `Failed to save order data to Upstash after retries for order ${paymentIntent.id}:`,
              upstashError,
            );
          }
        } catch (error) {
          console.error("Error processing payment intent:", error);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        if (
          account.payouts_enabled &&
          account.charges_enabled &&
          account.details_submitted &&
          account.capabilities?.transfers === "active" &&
          !account.requirements?.currently_due?.length &&
          !account.requirements?.pending_verification?.length
        ) {
          console.log(
            `The account ${account.id} is verified and ready to receive payments`,
          );

          try {
            await stripe.accounts.update(account.id, {
              settings: {
                payouts: {
                  schedule: {
                    interval: "daily",
                    delay_days: 7,
                  },
                },
              },
            });

            console.log(`Payouts configured for account ${account.id}`);
          } catch (error) {
            console.error(
              `Error configuring payouts for account ${account.id}:`,
              error,
            );
          }
        }
        break;
      }

      case "payout.paid": {
        const payout = event.data.object as Stripe.Payout;
        console.log(`Payout ${payout.id} processed successfuly`);
        break;
      }

      case "payout.failed": {
        const payout = event.data.object as Stripe.Payout;
        console.error(`Payout ${payout.id} failed`);
        break;
      }

      default:
        console.log(`Event not handled: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Error in webhook:", err);
    return new Response(JSON.stringify({ error: "Error processing webhook" }), {
      status: 400,
    });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
