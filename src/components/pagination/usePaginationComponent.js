import { useEffect, useMemo, useState } from 'react';

export const WINDOW_SIZE = 5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const computeWindowStart = (currentPage, totalPages, direction = 'right') => {
    if (!Number.isFinite(totalPages) || totalPages <= WINDOW_SIZE) {
        return 1;
    }

    const maxStart = totalPages - WINDOW_SIZE + 1;
    const start = direction === 'left' ? currentPage - 1 : currentPage - 3;

    return clamp(start, 1, maxStart);
};

export const usePaginationComponent = ({ currentPage = 1, totalPages = 0, onPageChange }) => {
    const [windowState, setWindowState] = useState(() => ({
        currentPage,
        totalPages,
        start: computeWindowStart(currentPage, totalPages, 'right'),
    }));

    const isSameContext = windowState.currentPage === currentPage
        && windowState.totalPages === totalPages;
    const direction = isSameContext || currentPage >= windowState.currentPage ? 'right' : 'left';
    const windowStart = isSameContext
        ? windowState.start
        : computeWindowStart(currentPage, totalPages, direction);

    useEffect(() => {
        setWindowState({ currentPage, totalPages, start: windowStart });
    }, [currentPage, totalPages, windowStart]);

    const windowEnd = Math.min(windowStart + WINDOW_SIZE - 1, totalPages);

    const pages = useMemo(() => {
        const visiblePages = [];
        for (let page = windowStart; page <= windowEnd; page++) {
            visiblePages.push(page);
        }
        return visiblePages;
    }, [windowStart, windowEnd]);

    const isFirstPage = currentPage <= 1;
    const isLastPage = totalPages > 0 && currentPage >= totalPages;

    const handleFirstPageClick = () => {
        if (isFirstPage) return;
        onPageChange?.(1);
    };

    const handleLastPageClick = () => {
        if (isLastPage) return;
        onPageChange?.(totalPages);
    };

    const handlePageClick = (page) => {
        if (page === currentPage) return;
        onPageChange?.(page);
    };

    return {
        pages,
        currentPage,
        totalPages,
        isFirstPage,
        isLastPage,
        handleFirstPageClick,
        handleLastPageClick,
        handlePageClick,
    };
};
