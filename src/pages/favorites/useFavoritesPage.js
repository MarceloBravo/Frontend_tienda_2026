import { useEffect, useState } from "react"
import { useProductStore } from "../../store/productStore";
import { useToastStore } from "../../store/toastStore";
import { useShoppingCartStore } from "../../store/shoppingCartStore";

export const useFavoritesPage = () => {
    const getProduct = useProductStore((state) => state.getProduct);
    const addToast = useToastStore((store) => store.addToast);
    const [ arrFavoritos, setArrFavoritos ] = useState([]);
    const addToCart = useShoppingCartStore(store => store.addToCart);
    const setContadorFavoritos = useProductStore((state) => state.setContadorFavoritos);
    
    useEffect(()=> {
        const checkFavoritos = () => {
            const fav = localStorage.getItem('favoritos')
            if(fav){
                try {
                    setArrFavoritos(JSON.parse(fav))
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
        const updatedFavorites = arrFavoritos.filter(p => p.asin !== productId);
        setArrFavoritos(updatedFavorites);
        setContadorFavoritos(updatedFavorites.length);
        localStorage.setItem('favoritos', JSON.stringify(updatedFavorites));
    }

    return {
        arrFavoritos,
        addItemToCart,
        removeFromFavorites
    };

}