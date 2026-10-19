import { renderHook, act } from '@testing-library/react';
import { useMenuComponent } from './useMenuComponent';
import AuthContext from '../../contexts/AuthContext';

const mockLogout = jest.fn();
const mockGetAllProducts = jest.fn();
const mockGetFavoritosCount = jest.fn();
const mockState = { loading: false, products: [] };

jest.mock('react-router', () => ({
    useLocation: () => ({ pathname: '/' }),
}));

jest.mock('../../contexts/ProductContext', () => ({
    useProducts: () => ({
        state: mockState,
        getAllProducts: mockGetAllProducts,
        getFavoritosCount: mockGetFavoritosCount,
    }),
}));

const createWrapper = (userSession) => ({ children }) => (
    <AuthContext.Provider value={{ logout: mockLogout, userSession }}>
        {children}
    </AuthContext.Provider>
);

describe('useMenuComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLogout.mockReset();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        mockGetFavoritosCount.mockReset().mockReturnValue(2);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('starts with the filter from localStorage', () => {
        localStorage.setItem('filter', 'telefono');
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        expect(result.current.searchText).toBe('telefono');
    });

    it('gets the favorites count on mount (happy path)', () => {
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        expect(result.current.favoritos).toBe(2);
    });

    it('searches products with the typed text', async () => {
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        act(() => {
            result.current.handleSearchChange({ target: { value: 'telefono' } });
        });
        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(result.current.searchText).toBe('telefono');
        expect(mockGetAllProducts).toHaveBeenCalledWith('telefono');
    });

    it('still searches with an empty string (edge case)', async () => {
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('');
    });

    it('logs the error without throwing when the search fails (API failure)', async () => {
        mockGetAllProducts.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(console.error).toHaveBeenCalled();
    });

    it('calls logout when ending the session', async () => {
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        await act(async () => {
            await result.current.endSession();
        });

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('logs the error without throwing when logout fails (negative case)', async () => {
        mockLogout.mockRejectedValueOnce(new Error('logout failed'));
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        await act(async () => {
            await result.current.endSession();
        });

        expect(console.error).toHaveBeenCalled();
    });

    it('handles a corrupted favorites entry in localStorage (edge case)', () => {
        localStorage.setItem('favoritos', 'no-es-json');
        mockGetFavoritosCount.mockReturnValue(0);
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: false, user: null }),
        });

        expect(result.current.favoritos).toBe(0);
    });

    it('updates the favorites count on a storage event', () => {
        mockGetFavoritosCount.mockReturnValue(0);
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        act(() => {
            window.dispatchEvent(new Event('storage'));
        });

        expect(result.current.favoritos).toBe(2);
    });

    it('detects the scroll state', () => {
        Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper({ isLoggedIn: true, user: { username: 'ana' } }),
        });

        act(() => {
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.isScrolled).toBe(true);
    });

    it('returns the user session from the auth context', () => {
        const session = { isLoggedIn: true, user: { username: 'ana' } };
        const { result } = renderHook(() => useMenuComponent(), {
            wrapper: createWrapper(session),
        });

        expect(result.current.userSession).toBe(session);
    });
});
