import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useProductStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import { crearOrden, iniciarPago } from '../../api/pagosApi';
import { composeDireccionEnvio } from '../../utils/direccionEnvio';
import { redirectToWebpay } from '../../utils/webpay';
import { CheckoutSchema, mapZodErrors } from './CheckoutSchema';

const INITIAL_SHIPPING = {
    nombreDestinatario: '',
    telefono: '',
    calle: '',
    numero: '',
    departamento: '',
    comuna: '',
    ciudad: '',
    region: '',
    referencias: '',
};

export const useCheckoutPage = () => {
    const navigate = useNavigate();
    const productsInCart = useShoppingCartStore((store) => store.products);
    const addToCart = useShoppingCartStore((store) => store.addToCart);
    const decrementProduct = useShoppingCartStore((store) => store.decrementProduct);
    const getProduct = useProductStore((store) => store.getProduct);
    const clearProductCache = useProductStore((store) => store.clearCache);
    const userSession = useAuthStore((store) => store.userSession);

    const [enriched, setEnriched] = useState({});
    const [openSection, setOpenSection] = useState('products');
    const [isProcessing, setIsProcessing] = useState(false);
    const [payError, setPayError] = useState(null);
    const [shipping, setShipping] = useState(INITIAL_SHIPPING);
    const [shippingErrors, setShippingErrors] = useState({});

    useEffect(() => {
        if (!Array.isArray(productsInCart) || productsInCart.length === 0) {
            navigate('/', { replace: true });
            return;
        }

        let cancelled = false;

        const cargar = async () => {
            const entries = await Promise.all(
                productsInCart.map(async (item) => {
                    try {
                        const product = await getProduct(item.productId);
                        return [item.productId, product];
                    } catch {
                        return [item.productId, null];
                    }
                })
            );

            if (!cancelled) {
                setEnriched(Object.fromEntries(entries.filter(([, product]) => product)));
            }
        };

        cargar();

        return () => {
            cancelled = true;
        };
    }, [productsInCart, getProduct, navigate]);

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

    const total = useMemo(
        () => items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0),
        [items]
    );

    const shippingComplete = CheckoutSchema.safeParse(shipping).success;
    const canPay = total > 0 && shippingComplete && !isProcessing;

    const incrementProduct = (productId) => {
        addToCart(productId, 1);
    };

    const decrement = (productId) => {
        decrementProduct(productId);
    };

    const toggleSection = (section) => {
        setOpenSection((current) => (current === section ? null : section));
    };

    const handleShippingChange = (event) => {
        const { name, value } = event.target;
        const next = { ...shipping, [name]: value };
        setShipping(next);

        const result = CheckoutSchema.safeParse(next);
        setShippingErrors(result.success ? {} : mapZodErrors(result.error));
    };

    const handlePay = async () => {
        if (isProcessing) return;

        if (!shippingComplete) {
            setOpenSection('shipping');
            return;
        }

        if (!userSession?.isLoggedIn) {
            navigate('/login', { state: { from: { pathname: '/checkout' } } });
            return;
        }

        setIsProcessing(true);
        setPayError(null);

        try {
            const orden = await crearOrden({
                items: items.map((item) => ({ asin: item.productId, cantidad: item.cant })),
                direccionEnvio: composeDireccionEnvio(shipping),
            });
            clearProductCache();
            const pago = await iniciarPago(orden.ordenId);
            redirectToWebpay(pago);
            // No se resetea isProcessing: el navegador sale de la app.
        } catch (error) {
            setPayError(
                error.response?.data?.message || 'No se pudo iniciar el pago. Intenta nuevamente.'
            );
            setIsProcessing(false);
        }
    };

    return {
        items,
        total,
        openSection,
        toggleSection,
        shipping,
        shippingErrors,
        handleShippingChange,
        shippingComplete,
        canPay,
        isProcessing,
        payError,
        incrementProduct,
        decrement,
        handlePay,
    };
};
