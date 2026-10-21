import React from 'react';
import { useProductCard } from './useProductCard';

import styles from './ProductCard.module.css'

export const ProductCard = React.memo((data) => {
    const {
        asin,
        titles,
        urlImagen, 
        product_star_rating, 
        product_num_ratings, 
        priceLabel,
        isFavorite,
        toggleFavorite,
        handleProdictoClick
    } = useProductCard(data);

    

    return (
        <div className={styles.productCard}>
            <button className={styles.favoriteButton} onClick={toggleFavorite}>
                {isFavorite ? '♥' : '♡'}
            </button>
            <img src={urlImagen} alt={asin} onClick={handleProdictoClick}/>
            <div className={styles.productInfo}>
                <div className={styles.productTitle}>{titles[0]}</div>
                <div className={styles.productTitle}>{titles[1]}</div>
                <div className={styles.productTitle}>{titles[2]}</div>
                <div className={styles.productTitle}>{titles[3]}</div>
                <div className={styles.productTating}>
                    {product_star_rating != null && (
                        <div className={styles.productStarRating}>{product_star_rating}</div>
                    )}
                    {product_num_ratings != null && (
                        <div className={styles.productNumRatings}>Rating {product_num_ratings}</div>
                    )}
                    <div className={styles.productNumRatings}>{priceLabel}</div>
                </div>
            </div>
        </div>
    )
})