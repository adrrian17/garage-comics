import { defineCollection } from "astro:content";
import Stripe from "stripe";
import { stripePriceLoader, stripeProductLoader } from "stripe-astro-loader";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const products = defineCollection({
  loader: stripeProductLoader(stripe),
});

const prices = defineCollection({
  loader: stripePriceLoader(stripe),
});

export const collections = { products, prices };
