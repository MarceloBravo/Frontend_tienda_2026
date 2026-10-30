import { renderHook, act } from '@testing-library/react';
import { useSearchProductComponent } from './useSearchProductComponent';
import { useProductStore, createInitialProductState } from '../../store/productStore';

const mockGetAllProducts = jest.fn();

const resetProductStore = () => {
    useProductStore.setState({
        ...createInitialProductState(),
        getAllProducts: mockGetAllProducts,
    });
};

describe('useSearchProductComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        resetProductStore();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('starts with an empty search text when there is no saved filter (happy path)', () => {
        const { result } = renderHook(() => useSearchProductComponent());

        expect(result.current.searchText).toBe('');
    });

    it('starts with the filter saved in localStorage (edge case)', () => {
        localStorage.setItem('filter', 'telefono');
        resetProductStore();

        const { result } = renderHook(() => useSearchProductComponent());

        expect(result.current.searchText).toBe('telefono');
    });

    it('updates the search text when typing (happy path)', () => {
        const { result } = renderHook(() => useSearchProductComponent());

        act(() => {
            result.current.handleSearchChange({ target: { value: 'telefono' } });
        });

        expect(result.current.searchText).toBe('telefono');
    });

    it('searches products with the typed text when clicking the search button (happy path)', async () => {
        const { result } = renderHook(() => useSearchProductComponent());

        act(() => {
            result.current.handleSearchChange({ target: { value: 'telefono' } });
        });
        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('telefono');
    });

    it('searches products when pressing Enter (happy path)', async () => {
        const { result } = renderHook(() => useSearchProductComponent());

        act(() => {
            result.current.handleSearchChange({ target: { value: 'tv' } });
        });
        await act(async () => {
            result.current.handleKeyDown({ key: 'Enter' });
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('tv');
    });

    it('does not search when pressing a key other than Enter (negative case)', async () => {
        const { result } = renderHook(() => useSearchProductComponent());

        await act(async () => {
            result.current.handleKeyDown({ key: 'a' });
        });

        expect(mockGetAllProducts).not.toHaveBeenCalled();
    });

    it('searches with an empty string without crashing (edge case)', async () => {
        const { result } = renderHook(() => useSearchProductComponent());

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('');
    });

    it('logs the error without throwing when the search fails (API failure)', async () => {
        mockGetAllProducts.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useSearchProductComponent());

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(console.error).toHaveBeenCalled();
    });
});
