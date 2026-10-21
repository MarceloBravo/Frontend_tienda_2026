import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent';
import { ProductCard } from '../../components/productCard/ProductCard';
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent';
import { PaginationComponent } from '../../components/pagination/PaginationComponent';
import { useProducts } from '../../contexts/ProductContext';

import styles from './HomePage.module.css'

export const HomePage = () => {
    const { state, getAllProducts} = useProducts();
    const location = useLocation();
    const products = state.products ?? [];

    useEffect(() => {
        const getAll = async () => {
            try {
                await getAllProducts();
            } catch (error) {
                console.error('Error loading products:', error);
            }
        }
        
        getAll();
        // eslint-disable-next-line
    }, [location.pathname]);

    const handlePageChange = async (page) => {
        try {
            await getAllProducts(state.filter, page);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    if (state.loading) return <SpinnerComponent />;
    if (state.error) return <EmptyStateComponent message={`Error: ${state.error}`} />;

    return (
        <>
            <h2>Las mejores ofertas en smartphones</h2>
            {products.length === 0 ? (
                <EmptyStateComponent message={state.filter
                    ? 'No se encontraron productos para tu búsqueda'
                    : 'No hay productos disponibles'} />
            ) : (
                <>
                    <div className={styles.productsGrid}>
                        {products.map(product => 
                            <ProductCard key={product.asin} {...product}/>
                        )}
                    </div>
                    <PaginationComponent
                        currentPage={state.page}
                        totalPages={state.totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </>
    )
}
