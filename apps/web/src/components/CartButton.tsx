import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
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
  const removeProduct = useCartStore((state) => state.removeProduct);

  console.log(products);

  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { data, error } = await actions.generateCheckout(products);

      if (!error && data?.url) {
        navigate(data.url);
      } else {
        console.error("Error generating checkout:", error);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error:", error);
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
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito ({products.length})
          </SheetTitle>
          <SheetDescription>
            Revisa tus productos antes de continuar con el pago
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
              <p className="text-gray-400 text-sm">
                Agrega algunos productos para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-2 m-4 border rounded-lg bg-gray-50"
                >
                  {item.productImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-20 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                      {item.productName}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">
                        ${(item.priceAmount / 100).toFixed(2)}
                      </span>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeProduct(item.productId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {products.length > 0 && (
          <SheetFooter className="border-t pt-4">
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total:</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
              <Button
                onClick={handleClick}
                disabled={loading || products.length === 0}
                className="w-full"
                size="lg"
              >
                {loading
                  ? "Procesando..."
                  : `Pagar $${(total / 100).toFixed(2)}`}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
