import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { Price, Product } from "@/content/config";

type CartState = {
  line_items: {
    productId: string;
    priceId: string;
    priceAmount: number;
    productName: string;
    productImage?: string;
  }[];
  total: number;
  addProduct: (product: Product, price: Price) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
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
            priceAmount: price.data.unit_amount,
            productName: product.data.name,
            productImage: product.data.images?.[0],
          });

          console.log(price);

          state.total += price.data.unit_amount;
        }),
      removeProduct: (productId) =>
        set((state) => {
          const itemIndex = state.line_items.findIndex(
            (item) => item.productId === productId,
          );

          if (itemIndex !== -1) {
            const item = state.line_items[itemIndex];
            state.total -= item.priceAmount;
            state.line_items.splice(itemIndex, 1);
          }
        }),

      clearCart: () =>
        set((state) => {
          state.line_items = [];
          state.total = 0;
        }),
    })),
    {
      name: "cart-store",
      storage: createJSONStorage(() => {
        // Return a storage object that gracefully handles SSR
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
    },
  ),
);
