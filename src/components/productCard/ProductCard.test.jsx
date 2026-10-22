import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ProductCard } from './ProductCard';
import { cargarImagen } from '../../utils/images';

const mockSetContadorFavoritos = jest.fn();

jest.mock('../../store/productStore', () => ({
    useProductStore: (selector) => selector({ setContadorFavoritos: mockSetContadorFavoritos }),
}));

jest.mock('../../utils/images', () => ({
    cargarImagen: jest.fn(),
}));

const baseProduct = {
    asin: 'A1',
    product_title: 'Titulo uno|Titulo dos|Titulo tres|Titulo cuatro',
    product_photo: 'photo.png',
    product_star_rating: '4.5',
    product_num_ratings: 100,
    product_price: '$10',
};

const renderCard = (props) => render(
    <MemoryRouter initialEntries={['/']}>
        <Routes>
            <Route path="/" element={<ProductCard {...props} />} />
            <Route path="/detalle-producto/:id" element={<div>Pantalla detalle</div>} />
        </Routes>
    </MemoryRouter>
);

describe('ProductCard', () => {
    beforeEach(() => {
        localStorage.clear();
        mockSetContadorFavoritos.mockReset();
        cargarImagen.mockReset().mockResolvedValue('imagen-cargada');
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the product information (happy path)', () => {
        renderCard(baseProduct);

        expect(screen.getByText('Titulo uno')).toBeInTheDocument();
        expect(screen.getByText('Titulo dos')).toBeInTheDocument();
        expect(screen.getByText('4.5')).toBeInTheDocument();
        expect(screen.getByText('Rating 100')).toBeInTheDocument();
        expect(screen.getByText('$ $10')).toBeInTheDocument();
    });

    it('renders without crashing when the title is undefined (null safety)', () => {
        renderCard({ ...baseProduct, product_title: undefined });

        expect(screen.getByAltText('A1')).toBeInTheDocument();
    });

    it('renders without crashing with missing optional data (edge case)', () => {
        renderCard({ asin: 'A2', product_title: '' });

        expect(screen.getByAltText('A2')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent('♡');
    });

    it('renders a very long title without truncation (text overflow edge case)', () => {
        const longTitle = 'Producto muy largo '.repeat(50);
        renderCard({ ...baseProduct, product_title: longTitle });

        expect(screen.getByText(longTitle.trim())).toBeInTheDocument();
    });

    it('marks the product as favorite when the button is clicked (happy path)', () => {
        renderCard(baseProduct);

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toHaveTextContent('♥');
        expect(JSON.parse(localStorage.getItem('favoritos'))).toHaveLength(1);
        expect(mockSetContadorFavoritos).toHaveBeenCalledWith(1);
    });

    it('unmarks the favorite when clicked twice (edge case)', () => {
        renderCard(baseProduct);

        fireEvent.click(screen.getByRole('button'));
        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toHaveTextContent('♡');
        expect(JSON.parse(localStorage.getItem('favoritos'))).toHaveLength(0);
    });

    it('does not crash when localStorage holds corrupted data (negative case)', () => {
        localStorage.setItem('favoritos', 'no-es-json');
        renderCard(baseProduct);

        fireEvent.click(screen.getByRole('button'));

        expect(screen.getByRole('button')).toHaveTextContent('♥');
    });

    it('navigates to the detail page when the image is clicked', async () => {
        renderCard(baseProduct);

        fireEvent.click(screen.getByAltText('A1'));

        expect(await screen.findByText('Pantalla detalle')).toBeInTheDocument();
    });

    it('logs the error when the image fails to load (API failure)', async () => {
        cargarImagen.mockRejectedValueOnce(new Error('image not found'));
        renderCard(baseProduct);

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
        });
    });
});
