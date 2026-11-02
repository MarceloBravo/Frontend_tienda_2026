import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { PagoResultadoPage } from '../PagoResultadoPage';
import { obtenerEstadoPago } from '../../../api/pagosApi';
import { useAuthStore, createInitialAuthState } from '../../../store/authStore';
import { useShoppingCartStore } from '../../../store/shoppingCartStore';

jest.mock('../../../api/pagosApi', () => ({
    obtenerEstadoPago: jest.fn(),
}));

const renderPage = (query) => render(
    <MemoryRouter initialEntries={[`/pago/resultado${query}`]}>
        <PagoResultadoPage />
    </MemoryRouter>
);

const login = () => {
    useAuthStore.setState({
        ...createInitialAuthState(),
        userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' },
    });
};

const addProductToCart = () => {
    useShoppingCartStore.setState({
        products: [{ productId: 'A1', cant: 1, name: 'Producto uno' }],
        productsInCart: 1,
    });
};

describe('PagoResultadoPage', () => {
    beforeEach(() => {
        obtenerEstadoPago.mockReset();
        useAuthStore.setState(createInitialAuthState());
        useShoppingCartStore.setState({ products: [], productsInCart: 0 });
        localStorage.clear();
    });

    it('shows the success details and clears the cart (happy path)', async () => {
        login();
        addProductToCart();
        obtenerEstadoPago.mockResolvedValue({
            orden: { id: 10, monto_total: 3000, estado: 'PAGADO' },
            pago: {
                authorization_code: 'AUTH123',
                card_detail: { card_number: '6623' },
                payment_type_code: 'VD',
            },
        });

        renderPage('?estado=success&buyOrder=BUY-1&ordenId=10');

        expect(await screen.findByText('Pago autorizado')).toBeInTheDocument();
        expect(await screen.findByText('$3.000')).toBeInTheDocument();
        expect(screen.getByText('AUTH123')).toBeInTheDocument();
        expect(screen.getByText('Débito / Redcompra ···· 6623')).toBeInTheDocument();
        expect(screen.getByText('BUY-1')).toBeInTheDocument();

        await waitFor(() => {
            expect(useShoppingCartStore.getState().products).toEqual([]);
        });
    });

    it('shows the rejection view and keeps the cart (error case)', async () => {
        addProductToCart();

        renderPage('?estado=fail&buyOrder=BUY-2&ordenId=11');

        expect(screen.getByText('Pago rechazado')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Reintentar' })).toHaveAttribute('href', '/checkout');
        expect(useShoppingCartStore.getState().products).toHaveLength(1);
        expect(obtenerEstadoPago).not.toHaveBeenCalled();
    });

    it('shows the timeout view', () => {
        renderPage('?estado=timeout');

        expect(screen.getByText('Tiempo de pago agotado')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Reintentar' })).toHaveAttribute('href', '/checkout');
    });

    it('invalida la caché de productos al volver del pago', async () => {
        localStorage.setItem('productListCache', JSON.stringify({ 'A1|1': { data: {} } }));
        localStorage.setItem('productDetailCache', JSON.stringify({ A1: { data: {} } }));

        renderPage('?estado=fail&buyOrder=BUY-6&ordenId=15');

        await waitFor(() => {
            expect(localStorage.getItem('productListCache')).toBeNull();
            expect(localStorage.getItem('productDetailCache')).toBeNull();
        });
    });

    it('shows a generic message when the state parameter is missing', () => {
        renderPage('');

        expect(screen.getByText('No encontramos el resultado del pago')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
    });

    it('shows a generic message for an unknown state (edge case)', () => {
        renderPage('?estado=unknown');

        expect(screen.getByText('No encontramos el resultado del pago')).toBeInTheDocument();
    });

    it('still renders the result when the status request fails', async () => {
        login();
        obtenerEstadoPago.mockRejectedValue(new Error('unauthorized'));

        renderPage('?estado=success&buyOrder=BUY-3&ordenId=12');

        expect(await screen.findByText('Pago autorizado')).toBeInTheDocument();
        expect(screen.getByText('BUY-3')).toBeInTheDocument();
    });

    it('does not request the status when there is no session', async () => {
        renderPage('?estado=success&ordenId=13');

        await waitFor(() => {
            expect(screen.getByText('Pago autorizado')).toBeInTheDocument();
        });
        expect(obtenerEstadoPago).not.toHaveBeenCalled();
    });

    it('does not request the status when ordenId is missing', () => {
        login();

        renderPage('?estado=success&buyOrder=BUY-4');

        expect(obtenerEstadoPago).not.toHaveBeenCalled();
    });

    it('renders without detail when the API response has no order (edge case)', async () => {
        login();
        obtenerEstadoPago.mockResolvedValue(null);

        renderPage('?estado=success&buyOrder=BUY-5&ordenId=14');

        expect(await screen.findByText('Pago autorizado')).toBeInTheDocument();
        expect(screen.getAllByText('Tarjeta').length).toBeGreaterThan(0);
    });
});
