import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useProductStore } from '../../store/productStore';

export const useCheckoutPage = () => {
    const navigate = useNavigate();
    const productsInCart = useShoppingCartStore((store) => store.products);
    const addToCart = useShoppingCartStore((store) => store.addToCart);
    const decrementProduct = useShoppingCartStore((store) => store.decrementProduct);
    const getAllProducts = useProductStore((store) => store.getAllProducts);
    const productsList = useProductStore((store) => store.products);

    const [paymentMethod, setPaymentMethod] = useState(null);
    const [enriched, setEnriched] = useState({});

    useEffect(() => {
        if (!Array.isArray(productsInCart) || productsInCart.length === 0) {
            navigate('/', { replace: true });
            return;
        }
        // Try to load product catalog to enrich
        getAllProducts('', 1).catch(() => { });
    }, [productsInCart, navigate, getAllProducts]);

    useEffect(() => {
        const map = {};
        if (Array.isArray(productsList)) {
            productsList.forEach((p) => {
                const key = p.asin || p.id || p.productId;
                if (key) {
                    map[key] = p;
                }
            });
        }
        setEnriched(map);
    }, [productsList]);

    const items = useMemo(() => {
        if (!Array.isArray(productsInCart)) return [];
        return productsInCart.map((item) => {
            const key = item.productId || item.asin || item.id;
            const prod = enriched[key] || {};
            const price = prod.product_price ?? prod.price ?? prod.precio ?? 0;
            const priceNum = typeof price === 'string'
                ? Number(String(price).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
                : Number(price) || 0;
            const cant = Number(item.cant) || 0;
            return {
                productId: key,
                name: item.name || prod.product_title || prod.name || key,
                image: prod.product_photo || prod.image || prod.img || '',
                unitPrice: priceNum,
                cant,
                subtotal: priceNum * cant,
            };
        });
    }, [productsInCart, enriched]);

    const total = useMemo(() => {
        return items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    }, [items]);

    const incrementProduct = (productId) => {
        addToCart(productId, 1);
    };

    const decrement = (productId) => {
        decrementProduct(productId);
    };

    const selectPayment = (method) => {
        setPaymentMethod(method);
    };

    const canPay = total > 0 && (paymentMethod === 'redcompra' || paymentMethod === 'webpay');

    const handlePay = () => {
        if (!canPay) return;
        // No registration of stock reduction as requested
    };

    return {
        items,
        total,
        paymentMethod,
        selectPayment,
        incrementProduct,
        decrement,
        canPay,
        handlePay,
    };
};