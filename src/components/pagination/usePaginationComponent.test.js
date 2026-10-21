import { renderHook, act } from '@testing-library/react';
import { usePaginationComponent, computeWindowStart, WINDOW_SIZE } from './usePaginationComponent';

describe('computeWindowStart', () => {
    it('starts at the first page when there are 5 pages or less (edge case)', () => {
        expect(computeWindowStart(1, 5, 'right')).toBe(1);
        expect(computeWindowStart(3, 3, 'right')).toBe(1);
    });

    it('shows the first 5 pages when the current page is lower than 5 (happy path)', () => {
        expect(computeWindowStart(1, 10, 'right')).toBe(1);
        expect(computeWindowStart(3, 10, 'right')).toBe(1);
    });

    it('keeps the next page visible when navigating to the right (happy path)', () => {
        expect(computeWindowStart(5, 10, 'right')).toBe(2);
        expect(computeWindowStart(6, 10, 'right')).toBe(3);
    });

    it('keeps the previous page visible when navigating to the left (happy path)', () => {
        expect(computeWindowStart(6, 10, 'left')).toBe(5);
        expect(computeWindowStart(10, 16, 'left')).toBe(9);
    });

    it('clamps the window to the last valid window on the last page (edge case)', () => {
        expect(computeWindowStart(10, 10, 'left')).toBe(6);
        expect(computeWindowStart(16, 16, 'left')).toBe(12);
    });

    it('never exceeds the last window (edge case)', () => {
        expect(computeWindowStart(10, 10, 'right')).toBe(6);
        expect(computeWindowStart(16, 16, 'right')).toBe(12);
    });
});

describe('usePaginationComponent', () => {
    const renderPagination = (props) => renderHook(
        (initialProps) => usePaginationComponent(initialProps),
        { initialProps: props }
    );

    it('shows all the pages when there are less than 5 (happy path)', () => {
        const { result } = renderPagination({ currentPage: 1, totalPages: 3, onPageChange: jest.fn() });

        expect(result.current.pages).toEqual([1, 2, 3]);
        expect(result.current.isFirstPage).toBe(true);
        expect(result.current.isLastPage).toBe(false);
    });

    it('shows the first 5 pages on the first page (happy path)', () => {
        const { result } = renderPagination({ currentPage: 1, totalPages: 10, onPageChange: jest.fn() });

        expect(result.current.pages).toEqual([1, 2, 3, 4, 5]);
        expect(result.current.pages).toHaveLength(WINDOW_SIZE);
    });

    it('moves the window to the right when the page increases (happy path)', () => {
        const { result, rerender } = renderPagination({ currentPage: 4, totalPages: 10, onPageChange: jest.fn() });

        act(() => {
            rerender({ currentPage: 5, totalPages: 10, onPageChange: jest.fn() });
        });

        expect(result.current.pages).toEqual([2, 3, 4, 5, 6]);
    });

    it('moves the window to the left when the page decreases (happy path)', () => {
        const { result, rerender } = renderPagination({ currentPage: 7, totalPages: 10, onPageChange: jest.fn() });

        act(() => {
            rerender({ currentPage: 6, totalPages: 10, onPageChange: jest.fn() });
        });

        expect(result.current.pages).toEqual([5, 6, 7, 8, 9]);
    });

    it('keeps the window inside the last pages (edge case)', () => {
        const { result, rerender } = renderPagination({ currentPage: 15, totalPages: 16, onPageChange: jest.fn() });

        act(() => {
            rerender({ currentPage: 16, totalPages: 16, onPageChange: jest.fn() });
        });

        expect(result.current.pages).toEqual([12, 13, 14, 15, 16]);
        expect(result.current.isLastPage).toBe(true);
    });

    it('calls onPageChange with the first page (happy path)', () => {
        const onPageChange = jest.fn();
        const { result } = renderPagination({ currentPage: 3, totalPages: 10, onPageChange });

        act(() => {
            result.current.handleFirstPageClick();
        });

        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with the last page (happy path)', () => {
        const onPageChange = jest.fn();
        const { result } = renderPagination({ currentPage: 3, totalPages: 10, onPageChange });

        act(() => {
            result.current.handleLastPageClick();
        });

        expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('does not call onPageChange on the first or last page (edge case)', () => {
        const onPageChange = jest.fn();
        const { result } = renderPagination({ currentPage: 1, totalPages: 10, onPageChange });

        act(() => {
            result.current.handleFirstPageClick();
        });

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not call onPageChange when the clicked page is the current one (negative case)', () => {
        const onPageChange = jest.fn();
        const { result } = renderPagination({ currentPage: 3, totalPages: 10, onPageChange });

        act(() => {
            result.current.handlePageClick(3);
        });

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('calls onPageChange with the clicked page (happy path)', () => {
        const onPageChange = jest.fn();
        const { result } = renderPagination({ currentPage: 3, totalPages: 10, onPageChange });

        act(() => {
            result.current.handlePageClick(4);
        });

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('does not break when there is no onPageChange callback (negative case)', () => {
        const { result } = renderPagination({ currentPage: 3, totalPages: 10 });

        act(() => {
            result.current.handlePageClick(4);
            result.current.handleFirstPageClick();
            result.current.handleLastPageClick();
        });

        expect(result.current.pages).toEqual([1, 2, 3, 4, 5]);
    });
});
