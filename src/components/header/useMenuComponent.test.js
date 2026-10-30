import { renderHook, act } from '@testing-library/react';
import { useMenuComponent } from './useMenuComponent';
import { useProductStore, createInitialProductState } from '../../store/productStore';
import { useAuthStore, createInitialAuthState } from '../../store/authStore';
import { useShoppingCartStore } from '../../store/shoppingCartStore';

const mockLogout = jest.fn();

jest.mock('react-router', () => ({
    useLocation: () => ({ pathname: '/' }),
}));

const resetProductStore = () => {
    useProductStore.setState(createInitialProductState());
};

describe('useMenuComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState(createInitialAuthState());
        mockLogout.mockReset();
        resetProductStore();
        useShoppingCartStore.setState({ products: [], productsInCart: 0, isOpen: false });
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

    it('gets the favorites count on mount (happy path)', () => {
        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        resetProductStore();
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' } });

        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.favoritos).toBe(2);
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

    it('returns the user session from the auth store', () => {
        const session = { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' };
        useAuthStore.setState({ ...useAuthStore.getState(), userSession: session });
        const { result } = renderHook(() => useMenuComponent());

        expect(result.current.userSession).toBe(session);
    });

    it('exposes the cart actions from the shopping cart store', () => {
        const { result } = renderHook(() => useMenuComponent());

        expect(typeof result.current.openCart).toBe('function');
        expect(result.current.countProductsInCart).toBe(0);
    });
});
