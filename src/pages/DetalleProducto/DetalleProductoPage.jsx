import { useCallback, useEffect, useState } from 'react'
import { useProductStore } from '../../store/productStore'
import { useParams } from 'react-router'
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent.jsx'
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent.jsx';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useToastStore } from '../../store/toastStore.js';

import styles from './DetalleProductoPage.module.css'
import { cargarImagen } from '../../utils/images.js';

export const DetalleProductoPage = () => {
    const params = useParams()
    const id = params.id
    const loading = useProductStore((state) => state.loading);
    const error = useProductStore((state) => state.error);
    const getProduct = useProductStore((state) => state.getProduct);
    const [ producto, setProducto ] = useState(null);
    const [ isCheckingStock, setIsCheckingStock ] = useState(false);
    const addToCart = useShoppingCartStore(store => store.addToCart);
    const addToast = useToastStore((store) => store.addToast);
    const [ urlImagen, setUrlImagen ] = useState(null);

    const cargarProducto = useCallback(async (options) => {
        const product = await getProduct(id, options);
        setProducto(product);
        const img = await cargarImagen(product.product_photo);
        setUrlImagen(img);
        return product;
    }, [id, getProduct]);

    useEffect(()=> {
        cargarProducto().catch((error) => {
            console.error('Error loading product:', error);
        });
    },[cargarProducto])

    const addItemToCart = async (productId, cant = 1) => {
        if (isCheckingStock) return;
        setIsCheckingStock(true);
        try {
            const freshProduct = await cargarProducto({ forceRefresh: true, silent: true });
            const stock = Number(freshProduct?.stock ?? 0);
            if (stock < cant){
                addToast("Stock insuficiente", "error");
                return;
            } 
            addToCart(productId, cant, freshProduct?.product_title ?? '');
        } catch (error) {
            console.error('Error checking stock:', error);
        } finally {
            setIsCheckingStock(false);
        }
    }

    if(loading) return <SpinnerComponent/>
    if(error) return <EmptyStateComponent message={`Error: ${error}`} />
    if(!producto) return <EmptyStateComponent message="Producto no encontrado" />


  return (
    <>  
        <div className={styles.productContainer}>
            <div className={styles.imageContainer}>
                <img src={urlImagen} alt={producto.product_title} className={styles.productImage}/>
            </div>
            <div className={styles.detailsContainer}>
                <h1 className={styles.productTitle}>{producto.product_title}</h1>
                <p className={styles.productRating}>
                    <span>{producto.product_star_rating} ★</span> ({producto.product_num_ratings} ratings)
                </p>
                <p className={styles.productPrice}>
                    <span className={styles.currentPrice}>{`$ ` + producto.product_price}</span>
                    {producto.product_original_price && <span className={styles.originalPrice}>{`$ ` + producto.product_original_price}</span>}
                </p>
                <p className={styles.salesVolume}>Stock: {producto.stock}</p>
                <div className={styles.badges}>
                    {producto.is_amazon_choice === 1 && <span className={`${styles.badge} ${styles.amazonChoice}`}>Amazon's Choice</span>}
                    {producto.is_best_seller === 1 && <span className={`${styles.badge} ${styles.bestSeller}`}>Best Seller</span>}
                    {producto.climate_pledge_friendly === 1 && <span className={`${styles.badge} ${styles.climatePledge}`}>Climate Pledge Friendly</span>}
                </div>
                <button
                    type="button"
                    className={styles.addToCartButton}
                    onClick={() => addItemToCart(producto.asin ?? id, 1)}
                    disabled={isCheckingStock}
                >
                    Agregar al carrito
                </button>
                <p className={styles.deliveryInfo}>{(producto.delivery && producto.delivery !== 'null')? producto.delivery : 'Envío normal'}</p>
            </div>
        </div>
    </>
  )
}