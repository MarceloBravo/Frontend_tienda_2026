import { useEffect, useRef } from 'react';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useToastStore } from '../../store/toastStore';
import { useNavigate } from 'react-router';
import { useAuthStore, selectIsAuthenticated } from '../../store/authStore';

export const useShoppingCartComponent = () => {
    const products = useShoppingCartStore((store) => store.products);
    const isOpen = useShoppingCartStore((store) => store.isOpen);
    const closeCart = useShoppingCartStore((store) => store.closeCart);
    const addToCart = useShoppingCartStore((store) => store.addToCart);
    const decrementProduct = useShoppingCartStore((store) => store.decrementProduct);
    const addToast = useToastStore((store) => store.addToast);
    const previousCount = useRef(products.length);
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const navigate = useNavigate();

    useEffect(() => {
        if (previousCount.current < products.length) {
            addToast('El producto ha sido agregado al carrito', 'success');
        }
        if (previousCount.current > products.length) {
            addToast('El producto ha sido eliminado de carrito', 'success');
        }
        previousCount.current = products.length;
    }, [products.length, addToast]);

    const continueShoppingHandleClic = () => {
        closeCart();
        navigate("/");
    }

    const CheckoutHandleClic = () => {
        if (!Array.isArray(products) || products.length === 0) {
            return;
        }
        closeCart();
        if (!isAuthenticated) {
            navigate("/login", { state: { from: { pathname: "/checkout" } } });
            return;
        }
        navigate("/checkout");
    }

    return {
        products,
        isOpen,
        closeCart,
        addToCart,
        decrementProduct,
        continueShoppingHandleClic,
        CheckoutHandleClic,
    };
};
