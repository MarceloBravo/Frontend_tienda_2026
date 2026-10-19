import { renderHook, act } from '@testing-library/react';
import { useRegisterPage } from './useRegisterPage';

const mockNavigate = jest.fn();
const mockAddToast = jest.fn();
const mockSendRequest = jest.fn();

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('../../hooks/useHttp', () => ({
    useHttp: () => ({ loading: false, sendRequest: mockSendRequest }),
}));

jest.mock('../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: mockAddToast }),
}));

const validData = {
    username: 'usuario1',
    nombre: 'Nombre',
    apellido: 'Apellido',
    email: 'user@test.com',
    password: 'Abc123!@#',
    confirmPassword: 'Abc123!@#',
};

const fillForm = (result, data) => {
    Object.entries(data).forEach(([name, value]) => {
        act(() => {
            result.current.handleChange({ target: { name, value } });
        });
    });
};

describe('useRegisterPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockAddToast.mockReset();
        mockSendRequest.mockReset();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts with an empty form', () => {
        const { result } = renderHook(() => useRegisterPage());

        expect(result.current.formData.username).toBe('');
        expect(result.current.formErrors).toEqual({});
    });

    it('does not call the API and reports errors on an empty submit (edge case)', async () => {
        const { result } = renderHook(() => useRegisterPage());

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(result.current.formErrors.username).toBe('El campo es requerido');
        expect(result.current.formErrors.email).toBe('El formato del email no es válido');
    });

    it('reports an invalid email format (negative case)', async () => {
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, { ...validData, email: 'correo-invalido' });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(result.current.formErrors.email).toBe('El formato del email no es válido');
    });

    it('reports a password mismatch (edge case)', async () => {
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, { ...validData, confirmPassword: 'OtraClave123!' });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(result.current.formErrors.confirmPassword)
            .toBe('La contraseña y la confirmación de contraseña no son iguales');
    });

    it('reports an error when the username exceeds 20 characters (overflow edge case)', async () => {
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, { ...validData, username: 'a'.repeat(21) });

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(result.current.formErrors.username)
            .toBe('El nombre de usuario no puede tener más de 20 caracteres');
    });

    it('calculates the password strength as the password changes', () => {
        const { result } = renderHook(() => useRegisterPage());

        act(() => {
            result.current.handleChange({ target: { name: 'password', value: 'Abc123!@#' } });
        });

        expect(result.current.passwordStrength).toBe(4);
    });

    it('submits a valid form and shows a success toast (happy path)', async () => {
        jest.useFakeTimers();
        mockSendRequest.mockResolvedValue({ status: 'success', message: 'Creado' });
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, validData);

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/register', 'POST', expect.objectContaining({
            username: 'usuario1',
            email: 'user@test.com',
        }));
        expect(mockAddToast).toHaveBeenCalledWith('Creado', 'success');
    });

    it('navigates to login 5 seconds after a successful registration', async () => {
        jest.useFakeTimers();
        mockSendRequest.mockResolvedValue({ status: 'success', message: 'Creado' });
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, validData);

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });
        act(() => {
            jest.advanceTimersByTime(5000);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('shows an error toast when the backend rejects the registration (negative case)', async () => {
        mockSendRequest.mockResolvedValue({ status: 'error' });
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, validData);

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockAddToast).toHaveBeenCalledWith('No se pudo completar el registro. Inténtalo nuevamente.', 'error');
    });

    it('shows an error toast when the request rejects (API failure)', async () => {
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useRegisterPage());
        fillForm(result, validData);

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: jest.fn() });
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al registrar el usuario.', 'error');
    });
});
