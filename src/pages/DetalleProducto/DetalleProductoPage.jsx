import { useCallback, useEffect, useState } from 'react'
import { useProductStore } from '../../store/productStore'
import { useParams } from 'react-router'
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent.jsx'
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent.jsx';
import { useShoppingCartStore } from '../../store/shoppingCartStore';
import { useToastStore } from '../../store/toastStore.js';

import styles from './DetalleProductoPage.module.css'

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

    const cargarProducto = useCallback(async (options) => {
        const product = await getProduct(id, options);
        setProducto(product);
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
                <img src={producto.product_photo} alt={producto.product_title} className={styles.productImage}/>
            </div>
            <div className={styles.detailsContainer}>
                <h1 className={styles.productTitle}>{producto.product_title}</h1>
                <p className={styles.productRating}>
                    <span>{producto.product_star_rating} ★</span> ({producto.product_num_ratings} ratings)
                </p>
                <p className={styles.productPrice}>
                    <span className={styles.currentPrice}>{producto.product_price}</span>
                    {producto.product_original_price && <span className={styles.originalPrice}>{producto.product_original_price}</span>}
                </p>
                <p className={styles.salesVolume}>{producto.sales_volume}</p>
                <div className={styles.badges}>
                    {producto.is_amazon_choice && <span className={`${styles.badge} ${styles.amazonChoice}`}>Amazon's Choice</span>}
                    {producto.is_best_seller && <span className={`${styles.badge} ${styles.bestSeller}`}>Best Seller</span>}
                    {producto.climate_pledge_friendly && <span className={`${styles.badge} ${styles.climatePledge}`}>Climate Pledge Friendly</span>}
                </div>
                <button
                    type="button"
                    className={styles.addToCartButton}
                    onClick={() => addItemToCart(producto.asin ?? id, 1)}
                    disabled={isCheckingStock}
                >
                    Add to Cart
                </button>
                <p className={styles.deliveryInfo}>{producto.delivery}</p>
            </div>
        </div>
    </>
  )
}