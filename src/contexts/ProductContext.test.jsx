import { renderHook, act, waitFor } from '@testing-library/react';
import { ProductProvider, useProducts } from './ProductContext';

const mockSendRequest = jest.fn();

jest.mock('../hooks/useHttp', () => ({
    useHttp: () => ({ sendRequest: mockSendRequest }),
}));

const wrapper = ({ children }) => <ProductProvider>{children}</ProductProvider>;

const productsResponse = (data, totProd = data.length, totPages = 1, page = 1) => ({
    status: 'success',
    data,
    totProd,
    totPages,
    page,
});

describe('ProductContext', () => {
    beforeEach(() => {
        localStorage.clear();
        mockSendRequest.mockReset();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stores the products of the new envelope (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 42, 7, 2));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        await waitFor(() => {
            expect(result.current.state.products).toEqual([{ asin: 'A1' }]);
        });
        expect(result.current.state.total).toBe(42);
        expect(result.current.state.totalPages).toBe(7);
        expect(result.current.state.page).toBe(2);
        expect(result.current.state.status).toBe('success');
        expect(result.current.state.error).toBeNull();
    });

    it('returns the products, the total, the pages and the page (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 42, 7, 2));
        const { result } = renderHook(() => useProducts(), { wrapper });

        let payload;
        await act(async () => {
            payload = await result.current.getAllProducts();
        });

        expect(payload).toEqual({
            status: 'success',
            products: [{ asin: 'A1' }],
            total: 42,
            totalPages: 7,
            page: 2,
        });
    });

    it('requests the first page by default (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 1, 1, 1));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos?page=1', 'GET');
    });

    it('requests the selected page with the search (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 42, 7, 3));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts('phone', 3);
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos?search=phone&page=3', 'GET');
        expect(result.current.state.page).toBe(3);
        expect(result.current.state.totalPages).toBe(7);
    });

    it('stores an empty list when the envelope has no products (edge case)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([], 0, 0, 1));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        expect(result.current.state.products).toEqual([]);
        expect(result.current.state.total).toBe(0);
        expect(result.current.state.totalPages).toBe(0);
    });

    it('sets the error state when the API returns a failed status (negative case)', async () => {
        mockSendRequest.mockResolvedValueOnce({ status: 'error', data: [], totProd: 0, totPages: 0, page: 1 });
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await expect(result.current.getAllProducts()).rejects.toThrow();
        });

        await waitFor(() => {
            expect(result.current.state.error).not.toBeNull();
        });
        expect(result.current.state.products).toEqual([]);
    });

    it('reuses the cached products instead of calling the API again (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 1, 1, 1));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        expect(mockSendRequest).toHaveBeenCalledTimes(1);

        await act(async () => {
            await result.current.getAllProducts();
        });

        expect(mockSendRequest).toHaveBeenCalledTimes(1);
        expect(result.current.state.products).toEqual([{ asin: 'A1' }]);
    });

    it('does not reuse the cache for a different page (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 1, 3, 1));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts('', 1);
        });

        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A2' }], 1, 3, 2));
        await act(async () => {
            await result.current.getAllProducts('', 2);
        });

        expect(mockSendRequest).toHaveBeenCalledTimes(2);
        expect(result.current.state.products).toEqual([{ asin: 'A2' }]);
        expect(result.current.state.page).toBe(2);
    });

    it('unwraps the product detail from the envelope (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce({ status: 'success', data: { asin: 'A1', product_title: 'Uno' } });
        const { result } = renderHook(() => useProducts(), { wrapper });

        let product;
        await act(async () => {
            product = await result.current.getProduct('A1');
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos/A1', 'GET');
        expect(product).toEqual({ asin: 'A1', product_title: 'Uno' });
    });

    it('throws when the detail request fails (API failure)', async () => {
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await expect(result.current.getProduct('A1')).rejects.toThrow('Network Error');
        });

        await waitFor(() => {
            expect(result.current.state.error).toBe('Network Error');
        });
    });
});
