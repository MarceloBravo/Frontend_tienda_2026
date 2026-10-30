import { SpinnerComponent } from '../../components/spinner/SpinnerComponent';
import { ProductCard } from '../../components/productCard/ProductCard';
import { EmptyStateComponent } from '../../components/emptyState/EmptyStateComponent';
import { PaginationComponent } from '../../components/pagination/PaginationComponent';
import { SearchProductComponent } from '../../components/searchProduct/SearchProductComponent';
import { useHomePage } from './useHomePage';

import styles from './HomePage.module.css'

export const HomePage = () => {
    const {
        loading,
        error,
        productsList,
        filter,
        page,
        totalPages,
        handlePageChange
    } = useHomePage();

    if (loading) return <SpinnerComponent />;
    if (error) return <EmptyStateComponent message={`Error: ${error}`} />;

    return (
        <>
            <h2>Las mejores ofertas en smartphones</h2>
            <div className={styles.searchBar}>
                <SearchProductComponent/>
            </div>
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
