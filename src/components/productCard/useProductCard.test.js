import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductCard } from './useProductCard';
import { cargarImagen } from '../../utils/images';

const mockNavigate = jest.fn();
const mockSetContadorFavoritos = jest.fn();

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

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

describe('useProductCard', () => {
    beforeEach(() => {
        localStorage.clear();
        mockNavigate.mockReset();
        mockSetContadorFavoritos.mockReset();
        cargarImagen.mockReset();
        cargarImagen.mockResolvedValue('imagen-cargada');
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('splits the product title into four parts (happy path)', () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        expect(result.current.titles).toEqual([
            'Titulo uno',
            'Titulo dos',
            'Titulo tres',
            'Titulo cuatro',
        ]);
    });

    it('returns an empty title array when product_title is undefined (null safety)', () => {
        const { result } = renderHook(() => useProductCard({ ...baseProduct, product_title: undefined }));

        expect(result.current.titles).toEqual(['']);
        expect(result.current.asin).toBe('A1');
    });

    it('returns an empty string when product_title is empty (edge case)', () => {
        const { result } = renderHook(() => useProductCard({ ...baseProduct, product_title: '' }));

        expect(result.current.titles).toEqual(['']);
    });

    it('starts as not favorite when localStorage is empty', () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        expect(result.current.isFavorite).toBe(false);
    });

    it('syncs the favorite state from localStorage on mount', () => {
        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }]));
        const { result } = renderHook(() => useProductCard(baseProduct));

        expect(result.current.isFavorite).toBe(true);
    });

    it('does not crash with corrupted favorites JSON in localStorage (negative case)', () => {
        localStorage.setItem('favoritos', 'esto-no-es-json');
        const { result } = renderHook(() => useProductCard(baseProduct));

        expect(result.current.isFavorite).toBe(false);
    });

    it('does not crash when stored favorites are not an array (edge case)', () => {
        localStorage.setItem('favoritos', JSON.stringify({ asin: 'A1' }));
        const { result } = renderHook(() => useProductCard(baseProduct));

        expect(result.current.isFavorite).toBe(false);
    });

    it('adds the product to favorites when toggled with empty storage', () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        act(() => {
            result.current.toggleFavorite({ stopPropagation: jest.fn() });
        });

        expect(result.current.isFavorite).toBe(true);
        expect(JSON.parse(localStorage.getItem('favoritos'))).toHaveLength(1);
        expect(mockSetContadorFavoritos).toHaveBeenCalledWith(1);
    });

    it('removes the product from favorites when toggled twice', () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        act(() => {
            result.current.toggleFavorite({ stopPropagation: jest.fn() });
        });
        act(() => {
            result.current.toggleFavorite({ stopPropagation: jest.fn() });
        });

        expect(result.current.isFavorite).toBe(false);
        expect(JSON.parse(localStorage.getItem('favoritos'))).toHaveLength(0);
        expect(mockSetContadorFavoritos).toHaveBeenLastCalledWith(0);
    });

    it('recovers from corrupted storage when toggling (error recovery)', () => {
        localStorage.setItem('favoritos', '{{corrupto');
        const { result } = renderHook(() => useProductCard(baseProduct));

        act(() => {
            result.current.toggleFavorite({ stopPropagation: jest.fn() });
        });

        expect(result.current.isFavorite).toBe(true);
        expect(JSON.parse(localStorage.getItem('favoritos'))).toHaveLength(1);
    });

    it('loads the product image URL', async () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        await waitFor(() => {
            expect(result.current.urlImagen).toBe('imagen-cargada');
        });
        expect(cargarImagen).toHaveBeenCalledWith('photo.png');
    });

    it('logs the error and leaves the image undefined when loading fails (API failure)', async () => {
        cargarImagen.mockRejectedValueOnce(new Error('image not found'));
        const { result } = renderHook(() => useProductCard(baseProduct));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalled();
        });
        expect(result.current.urlImagen).toBeUndefined();
    });

    it('navigates to the product detail when the card is clicked', () => {
        const { result } = renderHook(() => useProductCard(baseProduct));

        act(() => {
            result.current.handleProdictoClick();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/detalle-producto/A1');
    });
});
