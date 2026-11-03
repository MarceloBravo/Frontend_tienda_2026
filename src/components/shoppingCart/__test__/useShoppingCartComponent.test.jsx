import { renderHook, act } from '@testing-library/react';
import { useShoppingCartComponent } from '../useShoppingCartComponent';
import { useShoppingCartStore } from '../../../store/shoppingCartStore';
import { useAuthStore, createInitialAuthState } from '../../../store/authStore';

const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: jest.fn() }),
}));

const product = { productId: 'A1', cant: 1, name: 'Producto uno' };

const resetStores = () => {
    localStorage.clear();
    useShoppingCartStore.setState({ products: [], productsInCart: 0, isOpen: false });
    useAuthStore.setState(createInitialAuthState());
};

const setSession = (userSession) => {
    useAuthStore.setState({ userSession });
};

describe('useShoppingCartComponent', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        resetStores();
    });

    it('navigates to checkout when the cart has products and the user is authenticated (happy path)', () => {
        useShoppingCartStore.setState({ products: [product], isOpen: true });
        setSession({ isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' });
        const { result } = renderHook(() => useShoppingCartComponent());

        act(() => {
            result.current.CheckoutHandleClic();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/checkout');
        expect(useShoppingCartStore.getState().isOpen).toBe(false);
    });

    it('navigates to login with checkout as origin when there is no session', () => {
        useShoppingCartStore.setState({ products: [product], isOpen: true });
        const { result } = renderHook(() => useShoppingCartComponent());

        act(() => {
            result.current.CheckoutHandleClic();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login', {
            state: { from: { pathname: '/checkout' } },
        });
    });

    it('navigates to login when isLoggedIn is true but the user is missing (inconsistent state)', () => {
        useShoppingCartStore.setState({ products: [product], isOpen: true });
        setSession({ isLoggedIn: true, user: null, accessToken: 'token' });
        const { result } = renderHook(() => useShoppingCartComponent());

        act(() => {
            result.current.CheckoutHandleClic();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login', {
            state: { from: { pathname: '/checkout' } },
        });
    });

    it('does not navigate and keeps the cart open when it is empty (edge case)', () => {
        useShoppingCartStore.setState({ products: [], isOpen: true });
        const { result } = renderHook(() => useShoppingCartComponent());

        act(() => {
            result.current.CheckoutHandleClic();
        });

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(useShoppingCartStore.getState().isOpen).toBe(true);
    });

    it('continues shopping navigating home and closing the cart', () => {
        useShoppingCartStore.setState({ products: [product], isOpen: true });
        const { result } = renderHook(() => useShoppingCartComponent());

        act(() => {
            result.current.continueShoppingHandleClic();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(useShoppingCartStore.getState().isOpen).toBe(false);
    });
});
