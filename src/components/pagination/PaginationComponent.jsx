import { usePaginationComponent } from './usePaginationComponent';

import styles from './PaginationComponent.module.css';

export const PaginationComponent = ({ currentPage = 1, totalPages = 0, onPageChange }) => {
    const {
        pages,
        isFirstPage,
        isLastPage,
        handleFirstPageClick,
        handleLastPageClick,
        handlePageClick,
    } = usePaginationComponent({ currentPage, totalPages, onPageChange });

    if (!totalPages || totalPages <= 1) {
        return null;
    }

    return (
        <nav className={styles.pagination} role="navigation" aria-label="Paginación de productos">
            <button
                type="button"
                className={styles.navButton}
                onClick={handleFirstPageClick}
                disabled={isFirstPage}
                aria-label="Primera página"
            >
                «
            </button>

            <div className={styles.pages}>
                {pages.map(page => (
                    <button
                        key={page}
                        type="button"
                        className={`${styles.pageButton} ${page === currentPage ? styles.activePage : ''}`}
                        onClick={() => handlePageClick(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        aria-label={`Página ${page}`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                type="button"
                className={styles.navButton}
                onClick={handleLastPageClick}
                disabled={isLastPage}
                aria-label="Última página"
            >
                »
            </button>
        </nav>
    );
};
