import instance from '../axios/axiosInstance';
import {
    useProductStore,
    createInitialProductState,
    CACHE_TTL,
} from './productStore';

jest.mock('../axios/axiosInstance', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const productsResponse = (data, totProd = data.length, totPages = 1, page = 1) => ({
    status: 'success',
    data,
    totProd,
    totPages,
    page,
});

const resetStore = () => {
    useProductStore.setState(createInitialProductState());
};

describe('productStore', () => {
    beforeEach(() => {
        localStorage.clear();
        instance.mockReset();
        resetStore();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('stores the products of the new envelope (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 42, 7, 2) });

        await useProductStore.getState().getAllProducts();

        const state = useProductStore.getState();
        expect(state.products).toEqual([{ asin: 'A1' }]);
        expect(state.total).toBe(42);
        expect(state.totalPages).toBe(7);
        expect(state.page).toBe(2);
        expect(state.status).toBe('success');
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
    });

    it('returns the products, the total, the pages and the page (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 42, 7, 2) });

        const payload = await useProductStore.getState().getAllProducts();

        expect(payload).toEqual({
            status: 'success',
            products: [{ asin: 'A1' }],
            total: 42,
            totalPages: 7,
            page: 2,
        });
    });

    it('requests the first page by default (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 1, 1) });

        await useProductStore.getState().getAllProducts();

        expect(instance).toHaveBeenCalledWith({
            url: '/api/productos?page=1',
            method: 'GET',
        });
    });

    it('requests the selected page with the search (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 42, 7, 3) });

        await useProductStore.getState().getAllProducts('phone', 3);

        expect(instance).toHaveBeenCalledWith({
            url: '/api/productos?search=phone&page=3',
            method: 'GET',
        });
        expect(useProductStore.getState().page).toBe(3);
        expect(useProductStore.getState().totalPages).toBe(7);
    });

    it('stores an empty list when the envelope has no products (edge case)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([], 0, 0, 1) });

        await useProductStore.getState().getAllProducts();

        const state = useProductStore.getState();
        expect(state.products).toEqual([]);
        expect(state.total).toBe(0);
        expect(state.totalPages).toBe(0);
    });

    it('sets the error state when the API returns a failed status (negative case)', async () => {
        instance.mockResolvedValueOnce({
            data: { status: 'error', data: [], totProd: 0, totPages: 0, page: 1 },
        });

        await expect(useProductStore.getState().getAllProducts()).rejects.toThrow();

        const state = useProductStore.getState();
        expect(state.error).not.toBeNull();
        expect(state.products).toEqual([]);
        expect(state.loading).toBe(false);
    });

    it('reuses the cached products instead of calling the API again (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 1, 1) });

        await useProductStore.getState().getAllProducts();
        await useProductStore.getState().getAllProducts();

        expect(instance).toHaveBeenCalledTimes(1);
        expect(useProductStore.getState().products).toEqual([{ asin: 'A1' }]);
    });

    it('clears a previous error when serving cached products (edge case)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 1, 1) });
        await useProductStore.getState().getAllProducts();

        useProductStore.setState({ error: 'Request failed with status code 404' });
        await useProductStore.getState().getAllProducts();

        expect(instance).toHaveBeenCalledTimes(1);
        expect(useProductStore.getState().error).toBeNull();
    });

    it('does not reuse the cache for a different page (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 3, 1) });
        await useProductStore.getState().getAllProducts('', 1);

        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A2' }], 1, 3, 2) });
        await useProductStore.getState().getAllProducts('', 2);

        expect(instance).toHaveBeenCalledTimes(2);
        expect(useProductStore.getState().products).toEqual([{ asin: 'A2' }]);
        expect(useProductStore.getState().page).toBe(2);
    });

    it('calls the API again when the cached page expired (edge case)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 1, 1) });
        await useProductStore.getState().getAllProducts();

        const cacheKey = '|1';
        const { productsCache } = useProductStore.getState();
        useProductStore.setState({
            productsCache: {
                ...productsCache,
                [cacheKey]: {
                    ...productsCache[cacheKey],
                    timestamp: Date.now() - CACHE_TTL - 1,
                },
            },
        });

        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A2' }], 1, 1, 1) });
        await useProductStore.getState().getAllProducts();

        expect(instance).toHaveBeenCalledTimes(2);
        expect(useProductStore.getState().products).toEqual([{ asin: 'A2' }]);
    });

    it('unwraps the product detail from the envelope (happy path)', async () => {
        instance.mockResolvedValueOnce({
            data: { status: 'success', data: { asin: 'A1', product_title: 'Uno' } },
        });

        const product = await useProductStore.getState().getProduct('A1');

        expect(instance).toHaveBeenCalledWith({
            url: '/api/productos/A1',
            method: 'GET',
        });
        expect(product).toEqual({ asin: 'A1', product_title: 'Uno' });
    });

    it('reuses the cached product detail (happy path)', async () => {
        instance.mockResolvedValueOnce({
            data: { status: 'success', data: { asin: 'A1', product_title: 'Uno' } },
        });

        await useProductStore.getState().getProduct('A1');
        await useProductStore.getState().getProduct('A1');

        expect(instance).toHaveBeenCalledTimes(1);
    });

    it('ignores the cached detail when forceRefresh is enabled (happy path)', async () => {
        instance.mockResolvedValueOnce({
            data: { status: 'success', data: { asin: 'A1', stock: 1 } },
        });
        await useProductStore.getState().getProduct('A1');

        instance.mockResolvedValueOnce({
            data: { status: 'success', data: { asin: 'A1', stock: 5 } },
        });
        const product = await useProductStore.getState().getProduct('A1', { forceRefresh: true });

        expect(instance).toHaveBeenCalledTimes(2);
        expect(product.stock).toBe(5);
        expect(useProductStore.getState().productDetailCache.A1.data.stock).toBe(5);
    });

    it('does not toggle loading when the detail refresh is silent (edge case)', async () => {
        instance.mockResolvedValueOnce({
            data: { status: 'success', data: { asin: 'A1', stock: 3 } },
        });
        const loadingStates = [];
        const unsubscribe = useProductStore.subscribe((state) => {
            loadingStates.push(state.loading);
        });

        await useProductStore.getState().getProduct('A1', { forceRefresh: true, silent: true });

        unsubscribe();
        expect(loadingStates.every((loading) => loading === false)).toBe(true);
    });

    it('throws when the detail request fails (API failure)', async () => {
        instance.mockRejectedValueOnce(new Error('Network Error'));

        await expect(useProductStore.getState().getProduct('A1')).rejects.toThrow('Network Error');

        expect(useProductStore.getState().error).toBe('Network Error');
        expect(useProductStore.getState().loading).toBe(false);
    });

    it('rejects an invalid product id without calling the API (negative case)', async () => {
        await expect(useProductStore.getState().getProduct()).rejects.toThrow('ID de producto inválido');

        expect(instance).not.toHaveBeenCalled();
        expect(useProductStore.getState().error).toBe('ID de producto inválido');
        expect(useProductStore.getState().loading).toBe(false);
    });

    it('does not store a global error when a silent detail request fails (edge case)', async () => {
        instance.mockRejectedValueOnce(new Error('Network Error'));

        await expect(
            useProductStore.getState().getProduct('A1', { forceRefresh: true, silent: true })
        ).rejects.toThrow('Network Error');

        expect(useProductStore.getState().error).toBeNull();
        expect(useProductStore.getState().loading).toBe(false);
    });

    it('initializes the cache and favorites from localStorage (edge case)', () => {
        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        localStorage.setItem('filter', 'phone');
        localStorage.setItem('productListCache', JSON.stringify({
            'phone|1': {
                data: { products: [{ asin: 'A1' }], total: 1, totalPages: 1, page: 1, status: 'success' },
                timestamp: Date.now(),
            },
        }));

        resetStore();

        const state = useProductStore.getState();
        expect(state.favoritos).toBe(2);
        expect(state.filter).toBe('phone');
        expect(state.productsCache['phone|1'].data.products).toEqual([{ asin: 'A1' }]);
    });

    it('ignores corrupted localStorage values (negative case)', () => {
        localStorage.setItem('favoritos', 'no-es-json');
        localStorage.setItem('productListCache', '{corrupto');
        localStorage.setItem('productDetailCache', 'no-es-json');

        resetStore();

        const state = useProductStore.getState();
        expect(state.favoritos).toBe(0);
        expect(state.productsCache).toEqual({});
        expect(state.productDetailCache).toEqual({});
    });

    it('clears the caches and localStorage entries (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: productsResponse([{ asin: 'A1' }], 1, 1, 1) });
        await useProductStore.getState().getAllProducts();

        useProductStore.getState().clearCache();

        expect(useProductStore.getState().productsCache).toEqual({});
        expect(useProductStore.getState().productDetailCache).toEqual({});
        expect(localStorage.getItem('productListCache')).toBeNull();
        expect(localStorage.getItem('productDetailCache')).toBeNull();
    });

    it('does not accept a negative favorites counter (negative case)', () => {
        useProductStore.getState().setContadorFavoritos(-3);
        expect(useProductStore.getState().favoritos).toBe(0);

        useProductStore.getState().setContadorFavoritos('4');
        expect(useProductStore.getState().favoritos).toBe(4);
    });
});
