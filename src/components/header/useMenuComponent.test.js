import { renderHook, act } from '@testing-library/react';
import { useMenuComponent } from './useMenuComponent';
import { useProductStore, createInitialProductState } from '../../store/productStore';
import { useAuthStore, createInitialAuthState } from '../../store/authStore';

const mockLogout = jest.fn();
const mockGetAllProducts = jest.fn();

jest.mock('react-router', () => ({
    useLocation: () => ({ pathname: '/' }),
}));

const resetProductStore = () => {
    useProductStore.setState({
        ...createInitialProductState(),
        getAllProducts: mockGetAllProducts,
    });
};

describe('useMenuComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState(createInitialAuthState());
        mockLogout.mockReset();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        resetProductStore();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        useAuthStore.setState({
            ...createInitialAuthState(),
            logout: mockLogout,
            userSession: { isLoggedIn: false, user: null, accessToken: null },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('starts with the filter from localStorage', () => {
        localStorage.setItem('filter', 'telefono');
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.searchText).toBe('telefono');
    });

    it('gets the favorites count on mount (happy path)', () => {
        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        resetProductStore();
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });

        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.favoritos).toBe(2);
    });

    it('searches products with the typed text', async () => {
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

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
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(mockGetAllProducts).toHaveBeenCalledWith('');
    });

    it('logs the error without throwing when the search fails (API failure)', async () => {
        mockGetAllProducts.mockRejectedValueOnce(new Error('Network Error'));
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        await act(async () => {
            await result.current.handleBtnBuscarClick();
        });

        expect(console.error).toHaveBeenCalled();
    });

    it('calls logout when ending the session', async () => {
        useAuthStore.setState({ ...useAuthStore.getState(), logout: mockLogout, userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        await act(async () => {
            await result.current.endSession();
        });

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('logs the error without throwing when logout fails (negative case)', async () => {
        mockLogout.mockRejectedValueOnce(new Error('logout failed'));
        useAuthStore.setState({ ...useAuthStore.getState(), logout: mockLogout, userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        await act(async () => {
            await result.current.endSession();
        });

        expect(console.error).toHaveBeenCalled();
    });

    it('handles a corrupted favorites entry in localStorage (edge case)', () => {
        localStorage.setItem('favoritos', 'no-es-json');
        resetProductStore();
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: false, user: null, accessToken: null } });

        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.favoritos).toBe(0);
    });

    it('updates the favorites count on a storage event', () => {
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        act(() => {
            window.dispatchEvent(new Event('storage'));
        });

        expect(result.current.favoritos).toBe(2);
    });

    it('detects the scroll state', () => {
        Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });
        const { result } = renderHook(() => useMenuComponent());

        act(() => {
            window.dispatchEvent(new Event('scroll'));
        });

        expect(result.current.isScrolled).toBe(true);
    });

    it('returns the user session from the auth context', () => {
        const session = { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' };
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: session });
        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.userSession).toBe(session);
    });
});
