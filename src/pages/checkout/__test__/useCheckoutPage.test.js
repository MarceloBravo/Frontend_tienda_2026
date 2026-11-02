import { renderHook, act, waitFor } from '@testing-library/react';
import { useCheckoutPage } from '../useCheckoutPage';

const mockNavigate = jest.fn();
const mockCrearOrden = jest.fn();
const mockIniciarPago = jest.fn();
const mockRedirectToWebpay = jest.fn();
const mockGetProduct = jest.fn();
const mockClearProductCache = jest.fn();
const mockAddToCart = jest.fn();
const mockDecrementProduct = jest.fn();

let mockCartState;
let mockAuthState;

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('../../../api/pagosApi', () => ({
    crearOrden: (...args) => mockCrearOrden(...args),
    iniciarPago: (...args) => mockIniciarPago(...args),
}));

jest.mock('../../../utils/webpay', () => ({
    redirectToWebpay: (...args) => mockRedirectToWebpay(...args),
}));

jest.mock('../../../store/shoppingCartStore', () => ({
    useShoppingCartStore: (selector) => selector(mockCartState),
}));

jest.mock('../../../store/productStore', () => ({
    useProductStore: (selector) => selector({
        getProduct: mockGetProduct,
        clearCache: mockClearProductCache,
    }),
}));

jest.mock('../../../store/authStore', () => ({
    useAuthStore: (selector) => selector(mockAuthState),
}));

const validShipping = {
    nombreDestinatario: 'Ana Pérez',
    telefono: '+56 9 1234 5678',
    calle: 'Av. Siempre Viva',
    numero: '742',
    departamento: 'Depto 4B',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    region: 'Metropolitana',
    referencias: 'Portón azul',
};

const fillShipping = async (result) => {
    for (const [name, value] of Object.entries(validShipping)) {
        await act(async () => {
            result.current.handleShippingChange({ target: { name, value } });
        });
    }
};

const setupCart = (products) => {
    mockCartState = {
        products,
        addToCart: mockAddToCart,
        decrementProduct: mockDecrementProduct,
    };
};

const setupAuth = (isLoggedIn) => {
    mockAuthState = { userSession: { isLoggedIn, user: null, accessToken: null } };
};

describe('useCheckoutPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockCrearOrden.mockReset();
        mockIniciarPago.mockReset();
        mockRedirectToWebpay.mockReset();
        mockGetProduct.mockReset();
        mockClearProductCache.mockReset();
        mockAddToCart.mockReset();
        mockDecrementProduct.mockReset();

        setupCart([{ productId: 'A1', cant: 2, name: 'Producto uno' }]);
        setupAuth(true);
        mockGetProduct.mockResolvedValue({
            asin: 'A1',
            product_title: 'Producto uno',
            product_price: '1500',
            product_photo: 'foto.png',
        });
        mockCrearOrden.mockResolvedValue({ ordenId: 99, montoTotal: 3000 });
        mockIniciarPago.mockResolvedValue({ url: 'https://webpay.test', token: 'tok' });
    });

    it('loads each product by id and calculates the total (happy path)', async () => {
        setupCart([
            { productId: 'A1', cant: 2, name: 'Producto uno' },
            { productId: 'Z99', cant: 1, name: 'Producto fuera de la página 1' },
        ]);
        mockGetProduct.mockImplementation(async (productId) => (
            productId === 'A1'
                ? { asin: 'A1', product_title: 'Producto uno', product_price: '1500' }
                : { asin: 'Z99', product_title: 'Producto fuera de la página 1', product_price: '500' }
        ));

        const { result } = renderHook(() => useCheckoutPage());

        await waitFor(() => expect(result.current.total).toBe(3500));
        expect(mockGetProduct).toHaveBeenCalledWith('A1');
        expect(mockGetProduct).toHaveBeenCalledWith('Z99');
    });

    it('redirects to home when the cart is empty (edge case)', () => {
        setupCart([]);

        renderHook(() => useCheckoutPage());

        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('keeps a price of 0 when a product cannot be loaded (error case)', async () => {
        mockGetProduct.mockRejectedValue(new Error('not found'));

        const { result } = renderHook(() => useCheckoutPage());

        await waitFor(() => expect(result.current.items).toHaveLength(1));
        expect(result.current.items[0].unitPrice).toBe(0);
        expect(result.current.canPay).toBe(false);
    });

    it('opens the shipping section when paying without a complete address', async () => {
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));

        await act(async () => {
            await result.current.handlePay();
        });

        expect(result.current.openSection).toBe('shipping');
        expect(mockCrearOrden).not.toHaveBeenCalled();
    });

    it('redirects to login with the checkout as origin when there is no session', async () => {
        setupAuth(false);
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));
        await fillShipping(result);

        await act(async () => {
            await result.current.handlePay();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login', {
            state: { from: { pathname: '/checkout' } },
        });
        expect(mockCrearOrden).not.toHaveBeenCalled();
    });

    it('creates the order, starts the payment and redirects to Webpay (happy path)', async () => {
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));
        await fillShipping(result);

        await waitFor(() => expect(result.current.canPay).toBe(true));

        await act(async () => {
            await result.current.handlePay();
        });

        expect(mockCrearOrden).toHaveBeenCalledWith({
            items: [{ asin: 'A1', cantidad: 2 }],
            direccionEnvio: expect.stringContaining('Ana Pérez'),
        });
        expect(mockIniciarPago).toHaveBeenCalledWith(99);
        expect(mockRedirectToWebpay).toHaveBeenCalledWith({ url: 'https://webpay.test', token: 'tok' });
        expect(mockClearProductCache).toHaveBeenCalled();
        expect(result.current.isProcessing).toBe(true);
    });

    it('exposes the API error message and stops processing (error case)', async () => {
        mockCrearOrden.mockRejectedValue({ response: { data: { message: 'Sin stock' } } });
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));
        await fillShipping(result);

        await act(async () => {
            await result.current.handlePay();
        });

        expect(result.current.payError).toBe('Sin stock');
        expect(result.current.isProcessing).toBe(false);
        expect(mockClearProductCache).not.toHaveBeenCalled();
        expect(mockRedirectToWebpay).not.toHaveBeenCalled();
    });

    it('uses a generic message when the API error has no message', async () => {
        mockIniciarPago.mockRejectedValue(new Error('network'));
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));
        await fillShipping(result);

        await act(async () => {
            await result.current.handlePay();
        });

        expect(result.current.payError).toBe('No se pudo iniciar el pago. Intenta nuevamente.');
    });

    it('does not create a duplicate order on a second call (double click)', async () => {
        const { result } = renderHook(() => useCheckoutPage());
        await waitFor(() => expect(result.current.total).toBe(3000));
        await fillShipping(result);

        await act(async () => {
            await result.current.handlePay();
        });
        await act(async () => {
            await result.current.handlePay();
        });

        expect(mockCrearOrden).toHaveBeenCalledTimes(1);
        expect(mockIniciarPago).toHaveBeenCalledTimes(1);
    });

    it('toggles sections and keeps only one open', async () => {
        const { result } = renderHook(() => useCheckoutPage());

        expect(result.current.openSection).toBe('products');

        await act(async () => {
            result.current.toggleSection('shipping');
        });
        expect(result.current.openSection).toBe('shipping');

        await act(async () => {
            result.current.toggleSection('shipping');
        });
        expect(result.current.openSection).toBeNull();
    });

    it('tracks shipping errors while typing and clears them when valid', async () => {
        const { result } = renderHook(() => useCheckoutPage());

        await act(async () => {
            result.current.handleShippingChange({ target: { name: 'telefono', value: '123' } });
        });
        expect(result.current.shippingErrors.telefono).toMatch(/Teléfono inválido/);
        expect(result.current.shippingComplete).toBe(false);

        await fillShipping(result);
        expect(result.current.shippingErrors).toEqual({});
        expect(result.current.shippingComplete).toBe(true);
    });

    it('increments and decrements products through the cart store', async () => {
        const { result } = renderHook(() => useCheckoutPage());

        await act(async () => {
            result.current.incrementProduct('A1');
            result.current.decrement('A1');
        });

        expect(mockAddToCart).toHaveBeenCalledWith('A1', 1);
        expect(mockDecrementProduct).toHaveBeenCalledWith('A1');
    });
});
