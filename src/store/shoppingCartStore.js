import { create } from "zustand";

const countProductsInCart = (products) =>
    products.reduce((acum, item) => acum + item.cant, 0);

export const useShoppingCartStore = create((set, get) => ({
    products: [],
    isOpen: false,
    productsInCart: 0,

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
                        ? { ...item, cant: item.cant + safeCant, name: item.name || name }
                        : item
                )
                : [...state.products, { productId, cant: safeCant, name }];

            return {
                products,
                productsInCart: countProductsInCart(products),
            };
        });
    },

    decrementProduct: (productId) => {
        set(state => {
            const product = state.products.find(item => item.productId === productId);
            if (!product) return state;

            const products = product.cant <= 1
                ? state.products.filter(item => item.productId !== productId)
                : state.products.map(item =>
                    item.productId === productId
                        ? { ...item, cant: item.cant - 1 }
                        : item
                );

            return {
                products,
                productsInCart: countProductsInCart(products),
            };
        });
    },

    reemoveProduct: (productId) => {
        set(state => {
            const products = state.products.filter(prod => prod.productId !== productId);

            return {
                products,
                productsInCart: countProductsInCart(products),
            };
        });
    },

    findProduct: (productId) => {
        return get().products.find(prod => prod.productId === productId);
    },
}));