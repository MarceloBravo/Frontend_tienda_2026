import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchProductComponent } from './SearchProductComponent';
import { useProductStore, createInitialProductState } from '../../store/productStore';

const mockGetAllProducts = jest.fn();

const resetProductStore = () => {
    useProductStore.setState({
        ...createInitialProductState(),
        getAllProducts: mockGetAllProducts,
    });
};

const renderSearch = () => render(<SearchProductComponent />);

describe('SearchProductComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        resetProductStore();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the search input and the search button (happy path)', () => {
        renderSearch();

        expect(screen.getByPlaceholderText('Buscar producto...')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });

    it('starts empty when there is no saved filter (happy path)', () => {
        renderSearch();

        expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('shows the filter saved in localStorage (edge case)', () => {
        localStorage.setItem('filter', 'telefono');
        resetProductStore();

        renderSearch();

        expect(screen.getByRole('textbox')).toHaveValue('telefono');
    });

    it('updates the input value when typing (happy path)', () => {
        renderSearch();

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'telefono' } });

        expect(screen.getByRole('textbox')).toHaveValue('telefono');
    });

    it('searches products when clicking the search button (happy path)', async () => {
        renderSearch();

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'telefono' } });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('telefono');
    });

    it('searches products when pressing Enter (happy path)', async () => {
        renderSearch();

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'tv' } });
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('tv');
    });

    it('does not search when pressing a key other than Enter (negative case)', async () => {
        renderSearch();

        await act(async () => {
            fireEvent.keyDown(screen.getByRole('textbox'), { key: 'a' });
        });

        expect(mockGetAllProducts).not.toHaveBeenCalled();
    });

    it('searches with an empty string without crashing (edge case)', async () => {
        renderSearch();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('');
    });

    it('logs the error without crashing when the search fails (API failure)', async () => {
        mockGetAllProducts.mockRejectedValueOnce(new Error('Network Error'));
        renderSearch();

        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Buscar' }));
        });

        expect(console.error).toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument();
    });
});
