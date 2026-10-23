import { create } from "zustand";

const CART_STORAGE_KEY = 'shopping_cart';

const countProductsInCart = (products) =>
    Array.isArray(products) ? products.reduce((acum, item) => acum + (Number(item?.cant) || 0), 0) : 0;

const readJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return null;
    }
};

const getInitialCartState = () => {
    const parsed = readJSON(CART_STORAGE_KEY, null);
    if (!parsed || typeof parsed !== 'object') {
        return { products: [], productsInCart: 0, isOpen: false };
    }

    const products = Array.isArray(parsed.products) ? parsed.products : [];
    const productsInCart = Number.isFinite(Number(parsed.productsInCart))
        ? Number(parsed.productsInCart)
        : countProductsInCart(products);

    return { products, productsInCart, isOpen: false };
};

const syncFromStorage = (set) => {
    const parsed = readJSON(CART_STORAGE_KEY, null);
    if (!parsed || typeof parsed !== 'object') {
        set({ products: [], productsInCart: 0 });
        return;
    }

    const products = Array.isArray(parsed.products) ? parsed.products : [];
    const productsInCart = Number.isFinite(Number(parsed.productsInCart))
        ? Number(parsed.productsInCart)
        : countProductsInCart(products);

    set({ products, productsInCart });
};

if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            syncFromStorage((state) => useShoppingCartStore.setState(state));
        }
    });
}

export const useShoppingCartStore = create((set, get) => ({
    ...getInitialCartState(),

    openCart: () => set({ isOpen: true }),

    closeCart: () => set({ isOpen: false }),

    toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

    addToCart: (productId, cant = 1, name = '') => {
        const parsedCant = Number(cant);
        const safeCant = Number.isFinite(parsedCant) && parsedCant > 0 ? parsedCant : 1;

        set(state => {
            const productExists = state.products.some(item => item.productId === productId);
            const products = productExists
                ? state.products.map(item =>
                    item.productId === productId
                        ? { ...item, cant: (Number(item.cant) || 0) + safeCant, name: item.name || name }
                        : item
                )
                : [...state.products, { productId, cant: safeCant, name }];

            const productsInCart = countProductsInCart(products);
            writeJSON(CART_STORAGE_KEY, { products, productsInCart });

            return {
                products,
                productsInCart,
            };
        });
    },

    decrementProduct: (productId) => {
        set(state => {
            const product = state.products.find(item => item.productId === productId);
            if (!product) return state;

            const products = (Number(product.cant) || 0) <= 1
                ? state.products.filter(item => item.productId !== productId)
                : state.products.map(item =>
                    item.productId === productId
                        ? { ...item, cant: (Number(item.cant) || 0) - 1 }
                        : item
                );

            const productsInCart = countProductsInCart(products);
            writeJSON(CART_STORAGE_KEY, { products, productsInCart });

            return {
                products,
                productsInCart,
            };
        });
    },

    reemoveProduct: (productId) => {
        set(state => {
            const products = state.products.filter(prod => prod.productId !== productId);
            const productsInCart = countProductsInCart(products);
            writeJSON(CART_STORAGE_KEY, { products, productsInCart });

            return {
                products,
                productsInCart,
            };
        });
    },

    findProduct: (productId) => {
        return get().products.find(prod => prod.productId === productId);
    },
}));