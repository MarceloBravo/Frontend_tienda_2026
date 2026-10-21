import { renderHook, act, waitFor } from '@testing-library/react';
import { ProductProvider, useProducts } from './ProductContext';

const mockSendRequest = jest.fn();

jest.mock('../hooks/useHttp', () => ({
    useHttp: () => ({ sendRequest: mockSendRequest }),
}));

const wrapper = ({ children }) => <ProductProvider>{children}</ProductProvider>;

const productsResponse = (data, totProd = data.length, page = 1) => ({
    status: 'success',
    data,
    totProd,
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
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 42, 2));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        await waitFor(() => {
            expect(result.current.state.products).toEqual([{ asin: 'A1' }]);
        });
        expect(result.current.state.total).toBe(42);
        expect(result.current.state.page).toBe(2);
        expect(result.current.state.status).toBe('success');
        expect(result.current.state.error).toBeNull();
    });

    it('returns the products, the total and the page (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 42, 2));
        const { result } = renderHook(() => useProducts(), { wrapper });

        let payload;
        await act(async () => {
            payload = await result.current.getAllProducts();
        });

        expect(payload).toEqual({
            status: 'success',
            products: [{ asin: 'A1' }],
            total: 42,
            page: 2,
        });
    });

    it('stores an empty list when the envelope has no products (edge case)', async () => {
        mockSendRequest.mockResolvedValueOnce(productsResponse([], 0, 1));
        const { result } = renderHook(() => useProducts(), { wrapper });

        await act(async () => {
            await result.current.getAllProducts();
        });

        expect(result.current.state.products).toEqual([]);
        expect(result.current.state.total).toBe(0);
    });

    it('sets the error state when the API returns a failed status (negative case)', async () => {
        mockSendRequest.mockResolvedValueOnce({ status: 'error', data: [], totProd: 0, page: 1 });
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
        mockSendRequest.mockResolvedValueOnce(productsResponse([{ asin: 'A1' }], 1, 1));
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
