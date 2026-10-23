import { useShoppingCartStore } from './shoppingCartStore';

const resetStore = () => {
    useShoppingCartStore.setState({ products: [], productsInCart: 0, isOpen: true });
};

beforeEach(resetStore);

describe('shoppingCartStore', () => {
    test('addToCart agrega un producto nuevo con nombre y cantidad', () => {
        useShoppingCartStore.getState().addToCart('B001', 2, 'Producto uno');

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 2, name: 'Producto uno' },
        ]);
    });

    test('addToCart usa cantidad 1 y nombre vacío por defecto', () => {
        useShoppingCartStore.getState().addToCart('B001');

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 1, name: '' },
        ]);
    });

    test('addToCart normaliza cantidades inválidas a 1 (edge case)', () => {
        useShoppingCartStore.getState().addToCart('B001', -5, 'Producto uno');
        useShoppingCartStore.getState().addToCart('B002', 'no-numero', 'Producto dos');

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 1, name: 'Producto uno' },
            { productId: 'B002', cant: 1, name: 'Producto dos' },
        ]);
    });

    test('addToCart acumula la cantidad si el producto ya existe', () => {
        useShoppingCartStore.getState().addToCart('B001', 2, 'Producto uno');
        useShoppingCartStore.getState().addToCart('B001', 3);

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 5, name: 'Producto uno' },
        ]);
    });

    test('addToCart actualiza productsInCart con el total de unidades', () => {
        useShoppingCartStore.getState().addToCart('B001', 2, 'Producto uno');
        useShoppingCartStore.getState().addToCart('B002', 1, 'Producto dos');
        useShoppingCartStore.getState().addToCart('B001', 3);

        expect(useShoppingCartStore.getState().productsInCart).toBe(6);
    });

    test('decrementProduct y reemoveProduct mantienen productsInCart actualizado', () => {
        useShoppingCartStore.getState().addToCart('B001', 2, 'Producto uno');
        useShoppingCartStore.getState().addToCart('B002', 3, 'Producto dos');

        useShoppingCartStore.getState().decrementProduct('B001');
        expect(useShoppingCartStore.getState().productsInCart).toBe(4);

        useShoppingCartStore.getState().reemoveProduct('B002');
        expect(useShoppingCartStore.getState().productsInCart).toBe(1);
    });

    test('addToCart no muta el estado previo', () => {
        const stateBefore = useShoppingCartStore.getState().products;

        useShoppingCartStore.getState().addToCart('B001', 1, 'Producto uno');

        expect(stateBefore).toEqual([]);
        expect(useShoppingCartStore.getState().products).not.toBe(stateBefore);
    });

    test('decrementProduct resta una unidad si hay más de una', () => {
        useShoppingCartStore.getState().addToCart('B001', 3, 'Producto uno');

        useShoppingCartStore.getState().decrementProduct('B001');

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 2, name: 'Producto uno' },
        ]);
    });

    test('decrementProduct elimina el producto cuando la cantidad llega a 1', () => {
        useShoppingCartStore.getState().addToCart('B001', 1, 'Producto uno');

        useShoppingCartStore.getState().decrementProduct('B001');

        expect(useShoppingCartStore.getState().products).toEqual([]);
    });

    test('decrementProduct no falla si el producto no existe', () => {
        useShoppingCartStore.getState().addToCart('B001', 1, 'Producto uno');

        expect(() => useShoppingCartStore.getState().decrementProduct('NO-EXISTE')).not.toThrow();
        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 1, name: 'Producto uno' },
        ]);
    });

    test('reemoveProduct elimina el producto indicado', () => {
        useShoppingCartStore.getState().addToCart('B001', 1, 'Producto uno');
        useShoppingCartStore.getState().addToCart('B002', 2, 'Producto dos');

        useShoppingCartStore.getState().reemoveProduct('B001');

        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B002', cant: 2, name: 'Producto dos' },
        ]);
    });

    test('reemoveProduct no falla si el producto no existe', () => {
        useShoppingCartStore.getState().addToCart('B001', 1, 'Producto uno');

        expect(() => useShoppingCartStore.getState().reemoveProduct('NO-EXISTE')).not.toThrow();
        expect(useShoppingCartStore.getState().products).toEqual([
            { productId: 'B001', cant: 1, name: 'Producto uno' },
        ]);
    });

    test('findProduct devuelve el producto existente', () => {
        useShoppingCartStore.getState().addToCart('B001', 4, 'Producto uno');

        expect(useShoppingCartStore.getState().findProduct('B001')).toEqual({
            productId: 'B001',
            cant: 4,
            name: 'Producto uno',
        });
    });

    test('findProduct devuelve undefined si no existe', () => {
        expect(useShoppingCartStore.getState().findProduct('NO-EXISTE')).toBeUndefined();
    });

    test('el carrito inicia abierto y se puede cerrar, abrir y alternar', () => {
        expect(useShoppingCartStore.getState().isOpen).toBe(true);

        useShoppingCartStore.getState().closeCart();
        expect(useShoppingCartStore.getState().isOpen).toBe(false);

        useShoppingCartStore.getState().openCart();
        expect(useShoppingCartStore.getState().isOpen).toBe(true);

        useShoppingCartStore.getState().toggleCart();
        expect(useShoppingCartStore.getState().isOpen).toBe(false);
    });
});
