import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Price, Product } from "@/content/config";

type CartState = {
  line_items: {
    productId: string;
    priceId: string;
    productName: string;
  }[];
  total: number;
  addProduct: (product: Product, price: Price) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    immer((set) => ({
      line_items: [],
      total: 0,
      addProduct: (product, price) =>
        set((state) => {
          state.line_items.push({
            productId: product.data.id,
            priceId: price.data.id,
            productName: product.data.name,
          });
          state.total += price.data.unit_amount;
        }),
    })),
    { name: "cart-store" },
  ),
);
