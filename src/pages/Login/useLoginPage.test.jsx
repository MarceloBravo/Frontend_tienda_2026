import { renderHook, act } from '@testing-library/react';
import { useLoginPage } from './useLoginPage';
import { useAuthStore, createInitialAuthState } from '../../store/authStore';

const mockNavigate = jest.fn();
const mockAddToast = jest.fn();
const mockLogin = jest.fn();

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: mockAddToast }),
}));

const defaultAuth = {
    login: mockLogin,
    isLoading: false,
    error: null,
    userSession: { isLoggedIn: false, user: null, accessToken: null },
};

describe('useLoginPage', () => {
    beforeEach(() => {
        useAuthStore.setState(createInitialAuthState());
        mockNavigate.mockReset();
        mockAddToast.mockReset();
        mockLogin.mockReset().mockResolvedValue();
        useAuthStore.setState({
            ...createInitialAuthState(),
            login: mockLogin,
            isLoading: false,
            error: null,
            userSession: { isLoggedIn: false, user: null, accessToken: null },
        });
    });

    it('starts with an empty form and no errors', () => {
        const { result } = renderHook(() => useLoginPage());

        expect(result.current.formLogin).toEqual({ email: '', password: '', rememberMe: false });
        expect(result.current.errorsLogin).toEqual({ email: '', password: '' });
    });

    it('sets a required error when an input is emptied (edge case)', () => {
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.handleInputChange({ target: { name: 'email', value: '' } });
        });

        expect(result.current.errorsLogin.email).toBe('Este campo es requerido');
    });

    it('clears the error when a valid value is typed (happy path)', () => {
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.handleInputChange({ target: { name: 'email', value: '' } });
        });
        act(() => {
            result.current.handleInputChange({ target: { name: 'email', value: 'user@test.com' } });
        });

        expect(result.current.errorsLogin.email).toBe('');
        expect(result.current.formLogin.email).toBe('user@test.com');
    });

    it('toggles the remember me option', () => {
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.handleRememberMeClick();
        });

        expect(result.current.formLogin.rememberMe).toBe(true);
    });

    it('calls login with the form data on submit', async () => {
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.handleInputChange({ target: { name: 'email', value: 'user@test.com' } });
        });
        act(() => {
            result.current.handleInputChange({ target: { name: 'password', value: 'secret' } });
        });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockLogin).toHaveBeenCalledWith({
            email: 'user@test.com',
            password: 'secret',
            rememberMe: false,
        });
    });

    it('shows an error toast when login fails (API failure)', async () => {
        mockLogin.mockRejectedValueOnce(new Error('Usuario y o contraseña no válidos.'));
        useAuthStore.setState({ ...useAuthStore.getState(), login: mockLogin });
        const { result } = renderHook(() => useLoginPage());

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockAddToast).toHaveBeenCalledWith('Usuario y o contraseña no válidos.', 'error');
    });

    it('redirects to home when the session is already logged in', () => {
        useAuthStore.setState({
            ...useAuthStore.getState(),
            userSession: { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' },
        });
        renderHook(() => useLoginPage());

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does not redirect when there is no session', () => {
        renderHook(() => useLoginPage());

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
