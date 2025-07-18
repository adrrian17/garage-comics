import { type CollectionEntry, defineCollection, z } from "astro:content";
import Stripe from "stripe";
import { stripePriceLoader, stripeProductLoader } from "stripe-astro-loader";

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

const products = defineCollection({
  loader: stripeProductLoader(stripe),
});

const prices = defineCollection({
  loader: stripePriceLoader(stripe),
});

const authors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    role: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    socialMedia: z.array(
      z.object({
        url: z.string(),
        name: z.string(),
      }),
    ),
  }),
});

// Tipos individuales de las colecciones
export type Product = CollectionEntry<"products">;
export type Price = CollectionEntry<"prices">;
export type Author = CollectionEntry<"authors">;

export const collections = { products, prices, authors };
