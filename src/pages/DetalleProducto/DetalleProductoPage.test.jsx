import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { DetalleProductoPage } from './DetalleProductoPage';

const mockGetProduct = jest.fn();
const mockAddToCart = jest.fn();
const mockProductState = { loading: false, error: null };

jest.mock('../../store/productStore', () => ({
    useProductStore: (selector) => selector({
        ...mockProductState,
        getProduct: mockGetProduct,
    }),
}));

jest.mock('../../store/shoppingCartStore', () => ({
    useShoppingCartStore: (selector) => selector({ addToCart: mockAddToCart }),
}));

const baseProduct = {
    asin: 'A1',
    product_title: 'Producto uno',
    product_photo: 'photo.png',
    product_star_rating: '4.5',
    product_num_ratings: 100,
    product_price: '$10',
    stock: 3,
};

const renderPage = () => render(
    <MemoryRouter initialEntries={['/detalle-producto/A1']}>
        <Routes>
            <Route path="/detalle-producto/:id" element={<DetalleProductoPage />} />
        </Routes>
    </MemoryRouter>
);

describe('DetalleProductoPage', () => {
    beforeEach(() => {
        mockGetProduct.mockReset();
        mockAddToCart.mockReset();
        mockGetProduct.mockResolvedValue(baseProduct);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the product loaded on mount (happy path)', async () => {
        renderPage();

        expect(await screen.findByText('Producto uno')).toBeInTheDocument();
        expect(mockGetProduct).toHaveBeenCalledWith('A1', undefined);
    });

    it('refreshes the stock and adds the product when there is stock (happy path)', async () => {
        renderPage();
        await screen.findByText('Producto uno');

        mockGetProduct.mockResolvedValueOnce({ ...baseProduct, stock: 2 });
        fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        await waitFor(() => {
            expect(mockAddToCart).toHaveBeenCalledWith('A1', 1, 'Producto uno');
        });
        expect(mockGetProduct).toHaveBeenLastCalledWith('A1', {
            forceRefresh: true,
            silent: true,
        });
    });

    it('does not add the product when the refreshed stock is zero (edge case)', async () => {
        renderPage();
        await screen.findByText('Producto uno');

        mockGetProduct.mockResolvedValueOnce({ ...baseProduct, stock: 0 });
        fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        await waitFor(() => {
            expect(mockGetProduct).toHaveBeenCalledTimes(2);
        });
        expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('does not add the product when the stock is missing (negative case)', async () => {
        renderPage();
        await screen.findByText('Producto uno');

        mockGetProduct.mockResolvedValueOnce({ ...baseProduct, stock: undefined });
        fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        await waitFor(() => {
            expect(mockGetProduct).toHaveBeenCalledTimes(2);
        });
        expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('does not add the product when the stock request fails (API failure)', async () => {
        renderPage();
        await screen.findByText('Producto uno');

        mockGetProduct.mockRejectedValueOnce(new Error('Network Error'));
        fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
        });
        expect(mockAddToCart).not.toHaveBeenCalled();
    });

    it('shows the empty state when the product does not exist (edge case)', async () => {
        mockGetProduct.mockResolvedValueOnce(null);

        renderPage();

        expect(await screen.findByText('Producto no encontrado')).toBeInTheDocument();
    });
});
