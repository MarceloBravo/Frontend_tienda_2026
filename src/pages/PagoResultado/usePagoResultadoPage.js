import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useProductStore } from '../../store/productStore';
import { obtenerEstadoPago } from '../../api/pagosApi';

export const usePagoResultadoPage = () => {
    const [searchParams] = useSearchParams();
    const estado = searchParams.get('estado');
    const buyOrder = searchParams.get('buyOrder') || '';
    const ordenId = Number(searchParams.get('ordenId')) || null;

    const isLoggedIn = useAuthStore((store) => store.userSession.isLoggedIn);
    const clearCart = useShoppingCartStore((store) => store.clearCart);
    const clearProductCache = useProductStore((store) => store.clearCache);
    const [detalle, setDetalle] = useState(null);

    useEffect(() => {
        clearProductCache();
    }, [clearProductCache]);

    useEffect(() => {
        if (estado === 'success') {
            clearCart();
        }
    }, [estado, clearCart]);

    useEffect(() => {
        if (!ordenId || !isLoggedIn) return;

        let cancelled = false;

        obtenerEstadoPago(ordenId)
            .then((data) => {
                if (!cancelled) setDetalle(data);
            })
            .catch(() => {
                // La sesión pudo expirar al volver de Transbank: el resultado igual se muestra.
            });

        return () => {
            cancelled = true;
        };
    }, [ordenId, isLoggedIn]);

    return { estado, buyOrder, ordenId, detalle };
};
