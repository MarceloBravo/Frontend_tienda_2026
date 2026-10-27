import { useEffect, useState } from "react"
import { useProductStore } from "../../store/productStore";
import { useToastStore } from "../../store/toastStore";
import { useShoppingCartStore } from "../../store/shoppingCartStore";
import { resolverUrlImagen } from '../../utils/images';

export const useFavoritesPage = () => {
    const getProduct = useProductStore((state) => state.getProduct);
    const addToast = useToastStore((store) => store.addToast);
    const [ arrFavoritos, setArrFavoritos ] = useState([]);
    const addToCart = useShoppingCartStore(store => store.addToCart);
    const setContadorFavoritos = useProductStore((state) => state.setContadorFavoritos);
    
    const buildFavoritoConImagen = async (item) => {
        if (!item?.asin) {
            return { ...item, product_photo: resolverUrlImagen(item?.product_photo) };
        }
        try {
            const freshProduct = await getProduct(item.asin, { silent: true });
            return {
                ...item,
                product_title: freshProduct?.product_title ?? item.product_title,
                product_price: freshProduct?.product_price ?? item.product_price,
                product_photo: resolverUrlImagen(freshProduct?.product_photo ?? item.product_photo),
            };
        } catch {
            return { ...item, product_photo: resolverUrlImagen(item.product_photo) };
        }
    }

    useEffect(()=> {
        const checkFavoritos = async () => {
            const fav = localStorage.getItem('favoritos')
            if(fav){
                try {
                    const parsed = JSON.parse(fav);
                    const favoritos = Array.isArray(parsed) ? parsed : [];
                    const resolved = await Promise.all(favoritos.map(buildFavoritoConImagen));
                    setArrFavoritos(resolved);
                } catch {
                    setArrFavoritos([])
                }
            } else {
                setArrFavoritos([])
            }
        }
        checkFavoritos()
        window.addEventListener('storage', checkFavoritos)
        return () => window.removeEventListener('storage', checkFavoritos)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    },[])


    const addItemToCart = async (productId, cant = 1) => {
        if (!productId) return;
        try {
            const freshProduct = await getProduct(productId, { forceRefresh: true, silent: true });
            const stock = Number(freshProduct?.stock ?? 0);
            if (stock < cant){
                addToast("Stock insuficiente", "error");
                return;
            } 
            addToCart(productId, cant, freshProduct?.product_title ?? '');
            removeFromFavorites(productId);
        } catch (error) {
            console.error('Error checking stock:', error);
        }
    }

    const removeFromFavorites = (productId) => {
        const fav = localStorage.getItem('favoritos');
        let storedFavorites = [];
        try {
            const parsed = JSON.parse(fav);
            storedFavorites = Array.isArray(parsed) ? parsed : [];
        } catch {
            storedFavorites = [];
        }
        const updatedFavorites = storedFavorites.filter(p => p.asin !== productId);
        setArrFavoritos(updatedFavorites.map((item) => ({
            ...item,
            product_photo: resolverUrlImagen(item.product_photo),
        })));
        setContadorFavoritos(updatedFavorites.length);
        localStorage.setItem('favoritos', JSON.stringify(updatedFavorites));
    }

    return {
        arrFavoritos,
        addItemToCart,
        removeFromFavorites
    };

}