import { navigate } from "astro:transitions/client";
import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { server } from "@/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cart-store";

export default function CartButton() {
  const products = useCartStore((state) => state.line_items);
  const total = useCartStore((state) => state.total);

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const { data, error } = await server.generateCheckout(products);

    if (!error && data?.url) {
      navigate(data.url);
    }

    if (error) {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <ShoppingCart />
          {products.length}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Carrito</SheetTitle>
          <SheetDescription hidden>Carrito</SheetDescription>
        </SheetHeader>
        {products?.map((item) => {
          return (
            <div key={item.productId}>
              <span>{item.productName}</span>
            </div>
          );
        })}
        <SheetFooter>
          <div className="flex flex-col">
            <span>Total: ${total / 100}</span>
            <Button
              onClick={handleClick}
              disabled={loading || products.length === 0}
            >
              {loading ? "Cargando..." : "Pagar"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
