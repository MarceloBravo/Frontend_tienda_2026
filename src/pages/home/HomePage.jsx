import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent';
import { ProductCard } from '../../components/productCard/ProductCard';
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent';
import { PaginationComponent } from '../../components/pagination/PaginationComponent';
import { useProductStore } from '../../store/productStore';

import styles from './HomePage.module.css'

export const HomePage = () => {
    const products = useProductStore((state) => state.products);
    const loading = useProductStore((state) => state.loading);
    const error = useProductStore((state) => state.error);
    const filter = useProductStore((state) => state.filter);
    const page = useProductStore((state) => state.page);
    const totalPages = useProductStore((state) => state.totalPages);
    const getAllProducts = useProductStore((state) => state.getAllProducts);
    const location = useLocation();
    const productsList = products ?? [];

    useEffect(() => {
        const getAll = async () => {
            try {
                await getAllProducts();
            } catch (error) {
                console.error('Error loading products:', error);
            }
        }
        
        getAll();
    }, [location.pathname, getAllProducts]);

    const handlePageChange = async (nextPage) => {
        try {
            await getAllProducts(filter, nextPage);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    if (loading) return <SpinnerComponent />;
    if (error) return <EmptyStateComponent message={`Error: ${error}`} />;

    return (
        <>
            <h2>Las mejores ofertas en smartphones</h2>
            {productsList.length === 0 ? (
                <EmptyStateComponent message={filter
                    ? 'No se encontraron productos para tu búsqueda'
                    : 'No hay productos disponibles'} />
            ) : (
                <>
                    <div className={styles.productsGrid}>
                        {productsList.map(product => 
                            <ProductCard key={product.asin} {...product}/>
                        )}
                    </div>
                    <PaginationComponent
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </>
    )
}
