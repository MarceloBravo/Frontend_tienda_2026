import { useEffect, useState } from 'react'
import { useProducts } from '../../contexts/ProductContext.jsx'
import { useParams } from 'react-router'
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent.jsx'
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent.jsx'

import styles from './DetalleProductoPage.module.css'

export const DetalleProductoPage = () => {
    const params = useParams()
    const id = params.id
    const { state, getProduct } = useProducts();
    const [ producto, setProducto ] = useState(null)

    useEffect(()=> {
        const obtenerProducto = async () => {
            try {
                const product = await getProduct(id);
                setProducto(product);
            } catch (error) {
                console.error('Error loading product:', error);
            }
        }
        obtenerProducto();
        // eslint-disable-next-line
    },[id])

    if(state.loading) return <SpinnerComponent/>
    if(state.error) return <EmptyStateComponent message={`Error: ${state.error}`} />
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
                <button className={styles.addToCartButton}>Add to Cart</button>
                <p className={styles.deliveryInfo}>{producto.delivery}</p>
            </div>
        </div>
    </>
  )
}