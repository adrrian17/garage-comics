import { Button } from "@/components/ui/button";
import type { Price, Product } from "@/content/config";
import { useCartStore } from "@/stores/cart-store";

interface AddToCartBtnProps {
	product: Product;
	price: Price;
}

export function AddToCartBtn({ product, price }: AddToCartBtnProps) {
	const addToCart = useCartStore((state) => state.addProduct);
	const products = useCartStore((state) => state.line_items);

	const isInCart = products.some((item) => item.productId === product.id);

	return (
		<Button
			className="w-full"
			disabled={isInCart}
			onClick={() => {
				addToCart(product, price);
			}}
		>
			{isInCart ? "En el carrito" : "Agregar al carrito"}
		</Button>
	);
}
