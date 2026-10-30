import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ShoppingCartComponent } from './ShoppingCartComponent';
import { useShoppingCartStore } from '../../store/shoppingCartStore';

const mockAddToast = jest.fn();

jest.mock('../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: mockAddToast }),
}));

const resetStore = () => {
    useShoppingCartStore.setState({ products: [], isOpen: true });
};

const renderCart = () => render(
    <MemoryRouter>
        <ShoppingCartComponent />
    </MemoryRouter>
);

beforeEach(() => {
    resetStore();
    mockAddToast.mockReset();
});

describe('ShoppingCartComponent', () => {
    test('se muestra abierto al montarse con el estado vacío', () => {
        renderCart();

        const cart = screen.getByRole('dialog', { name: 'Carrito de compras' });
        expect(cart).toHaveAttribute('aria-hidden', 'false');
        expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
    });

    test('lista cada producto con su nombre y cantidad', () => {
        useShoppingCartStore.setState({
            products: [
                { productId: 'B001', cant: 2, name: 'Producto uno' },
                { productId: 'B002', cant: 1, name: 'Producto dos' },
            ],
        });

        renderCart();

        expect(screen.getByText('Producto uno')).toBeInTheDocument();
        expect(screen.getByText('Producto dos')).toBeInTheDocument();
        expect(screen.getByLabelText('Cantidad de Producto uno')).toHaveTextContent('2');
        expect(screen.getByLabelText('Cantidad de Producto dos')).toHaveTextContent('1');
    });

    test('usa el id como nombre cuando el producto no tiene nombre (edge case)', () => {
        useShoppingCartStore.setState({
            products: [{ productId: 'B001', cant: 1, name: '' }],
        });

        renderCart();

        expect(screen.getByText('B001')).toBeInTheDocument();
    });

    test('el botón agregar incrementa la cantidad del producto', () => {
        useShoppingCartStore.setState({
            products: [{ productId: 'B001', cant: 1, name: 'Producto uno' }],
        });

        renderCart();
        fireEvent.click(screen.getByRole('button', { name: 'Agregar Producto uno' }));

        expect(screen.getByLabelText('Cantidad de Producto uno')).toHaveTextContent('2');
    });

    test('el botón disminuir resta una unidad sin eliminar el producto', () => {
        useShoppingCartStore.setState({
            products: [{ productId: 'B001', cant: 2, name: 'Producto uno' }],
        });

        renderCart();
        fireEvent.click(screen.getByRole('button', { name: 'Disminuir Producto uno' }));

        expect(screen.getByLabelText('Cantidad de Producto uno')).toHaveTextContent('1');
        expect(screen.getByText('Producto uno')).toBeInTheDocument();
    });

    test('el botón disminuir elimina la línea al llegar a una unidad', () => {
        useShoppingCartStore.setState({
            products: [{ productId: 'B001', cant: 1, name: 'Producto uno' }],
        });

        renderCart();
        fireEvent.click(screen.getByRole('button', { name: 'Disminuir Producto uno' }));

        expect(screen.queryByText('Producto uno')).not.toBeInTheDocument();
        expect(screen.getByText('El carrito está vacío')).toBeInTheDocument();
    });

    test('el botón cerrar oculta el panel', () => {
        renderCart();

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar carrito' }));

        const cart = screen.getByRole('dialog', { hidden: true });
        expect(cart).toHaveAttribute('aria-hidden', 'true');
        expect(cart).toHaveAttribute('inert');
    });
});
