import { create } from 'zustand';
import instance from '../axios/axiosInstance';
import {
    normalizeProductResponse,
    normalizeProductsResponse,
    isSuccessfulStatus,
    API_ERROR_MESSAGE,
} from '../utils/apiResponse';
import { buildProductsQuery } from '../utils/productsQuery';

export const CACHE_TTL = 5 * 60 * 1000;

const PRODUCT_LIST_CACHE_KEY = 'productListCache';
const PRODUCT_DETAIL_CACHE_KEY = 'productDetailCache';
const FILTER_KEY = 'filter';
const FAVORITOS_KEY = 'favoritos';

const readStorage = (key) => {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        return null;
    }
};

const removeStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch {
        return null;
    }
};

const readJSON = (key, fallback) => {
    const raw = readStorage(key);
    if (!raw) return fallback;
    try {
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const readCache = (key) => {
    const cache = readJSON(key, {});
    return cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : {};
};

const readFavoritosCount = () => {
    const favoritos = readJSON(FAVORITOS_KEY, []);
    return Array.isArray(favoritos) ? favoritos.length : 0;
};

const isListCacheEntryValid = (entry) =>
    !!entry
    && typeof entry.timestamp === 'number'
    && Array.isArray(entry.data?.products);

const isDetailCacheEntryValid = (entry) =>
    !!entry && typeof entry.timestamp === 'number' && !!entry.data;

const getExpiredFilteredCache = (cache, isValidEntry) => {
    const now = Date.now();
    return Object.fromEntries(
        Object.entries(cache).filter(
            ([, entry]) => isValidEntry(entry) && now - entry.timestamp < CACHE_TTL
        )
    );
};

const buildProductsState = (payload, fallbackPage = 1) => ({
    products: Array.isArray(payload?.products) ? payload.products : [],
    total: payload?.total ?? 0,
    totalPages: payload?.totalPages ?? 0,
    page: payload?.page ?? fallbackPage,
    status: payload?.status ?? null,
});

export const createInitialProductState = () => ({
    productsCache: readCache(PRODUCT_LIST_CACHE_KEY),
    productDetailCache: readCache(PRODUCT_DETAIL_CACHE_KEY),
    products: [],
    total: 0,
    totalPages: 0,
    page: 1,
    status: null,
    loading: false,
    error: null,
    filter: readStorage(FILTER_KEY) || null,
    favoritos: readFavoritosCount(),
});

export const useProductStore = create((set, get) => ({
    ...createInitialProductState(),

    clearExpiredCache: () => {
        const { productsCache, productDetailCache } = get();
        const filteredProductsCache = getExpiredFilteredCache(productsCache, isListCacheEntryValid);
        const filteredDetailCache = getExpiredFilteredCache(productDetailCache, isDetailCacheEntryValid);

        writeStorage(PRODUCT_LIST_CACHE_KEY, JSON.stringify(filteredProductsCache));
        writeStorage(PRODUCT_DETAIL_CACHE_KEY, JSON.stringify(filteredDetailCache));

        set({
            productsCache: filteredProductsCache,
            productDetailCache: filteredDetailCache,
        });
    },

    getProduct: async (productId, { forceRefresh = false, silent = false } = {}) => {
        get().clearExpiredCache();

        if (!productId) {
            const invalidIdError = new Error('ID de producto inválido');
            if (!silent) {
                set({ loading: false, error: invalidIdError.message });
            }
            throw invalidIdError;
        }

        const cached = get().productDetailCache[productId];
        if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }

        if (!silent) {
            set({ loading: true, error: null });
        }

        try {
            const response = await instance({
                url: `/api/productos/${productId}`,
                method: 'GET',
            });
            const { status, product } = normalizeProductResponse(response.data);
            if (!isSuccessfulStatus(status)) {
                throw new Error(API_ERROR_MESSAGE);
            }

            if (product?.asin) {
                const updatedDetailCache = {
                    ...get().productDetailCache,
                    [product.asin]: {
                        data: product,
                        timestamp: Date.now(),
                    },
                };
                writeStorage(PRODUCT_DETAIL_CACHE_KEY, JSON.stringify(updatedDetailCache));
                set({
                    productDetailCache: updatedDetailCache,
                    ...(silent ? {} : { loading: false }),
                });
            } else if (!silent) {
                set({ loading: false });
            }

            return product;
        } catch (error) {
            if (!silent) {
                set({ loading: false, error: error.message });
            }
            throw error;
        }
    },

    getAllProducts: async (searchParams, page = 1) => {
        get().clearExpiredCache();

        const search = String(searchParams ?? get().filter ?? '');
        const currentPage = Number(page) >= 1 ? Math.floor(Number(page)) : 1;
        const cacheKey = `${search}|${currentPage}`;

        const cached = get().productsCache[cacheKey];
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            set({
                ...buildProductsState(cached.data, currentPage),
                loading: false,
                error: null,
            });
            return cached.data;
        }

        set({ loading: true, error: null });
        try {
            const query = buildProductsQuery({ search, page: currentPage });
            const response = await instance({
                url: `/api/productos${query}`,
                method: 'GET',
            });
            const { status, products, total, totalPages, page: responsePage } =
                normalizeProductsResponse(response.data);
            if (!isSuccessfulStatus(status)) {
                throw new Error(API_ERROR_MESSAGE);
            }

            const payload = {
                products,
                total,
                totalPages,
                page: responsePage ?? currentPage,
                status,
            };
            const updatedProductsCache = {
                ...get().productsCache,
                [cacheKey]: {
                    data: payload,
                    timestamp: Date.now(),
                },
            };

            writeStorage(PRODUCT_LIST_CACHE_KEY, JSON.stringify(updatedProductsCache));
            writeStorage(FILTER_KEY, search);

            set({
                productsCache: updatedProductsCache,
                ...buildProductsState(payload, currentPage),
                filter: search,
                loading: false,
            });

            return payload;
        } catch (error) {
            set({ loading: false, error: error.message });
            throw error;
        }
    },

    clearCache: () => {
        removeStorage(PRODUCT_LIST_CACHE_KEY);
        removeStorage(PRODUCT_DETAIL_CACHE_KEY);
        set({
            productsCache: {},
            productDetailCache: {},
        });
    },

    setContadorFavoritos: (totFavoritos = 0) => {
        const parsed = Number(totFavoritos);
        set({ favoritos: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0 });
    },
}));
