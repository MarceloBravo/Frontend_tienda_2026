import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { ProtectedRoutes } from '../ProtectedRoutes';
import { useAuthStore, createInitialAuthState } from '../../store/authStore';

const LoginRoute = () => {
    const location = useLocation();
    return (
        <div>
            <div>Pantalla login</div>
            <span data-testid="from">{location.state?.from?.pathname ?? 'sin origen'}</span>
        </div>
    );
};

const renderGuarded = (authValue = {}, requiredRole = 'admin') => {
    const initial = createInitialAuthState();
    useAuthStore.setState({
        ...initial,
        ...authValue,
    });
    return render(
        <MemoryRouter initialEntries={['/privado']}>
            <Routes>
                <Route
                    path="/privado"
                    element={(
                        <ProtectedRoutes requiredRole={requiredRole}>
                            <div>Zona protegida</div>
                        </ProtectedRoutes>
                    )}
                />
                <Route path="/login" element={<LoginRoute />} />
                <Route path="/unauthorized" element={<div>Acceso denegado</div>} />
            </Routes>
        </MemoryRouter>
    );
};

const adminSession = { isLoading: false, error: null, userSession: { isLoggedIn: true, user: { rol: 'admin' }, accessToken: 'token' } };

describe('ProtectedRoutes', () => {
    beforeEach(() => {
        useAuthStore.setState(createInitialAuthState());
    });

    it('renders the children for an authorized admin (happy path)', () => {
        renderGuarded(adminSession);

        expect(screen.getByText('Zona protegida')).toBeInTheDocument();
    });

    it('shows a loading message while the session is loading', () => {
        renderGuarded({ ...adminSession, isLoading: true });

        expect(screen.getByText('Cargando...')).toBeInTheDocument();
        expect(screen.queryByText('Zona protegida')).not.toBeInTheDocument();
    });

    it('redirects to login when there is no user (edge case)', () => {
        renderGuarded({ isLoading: false, error: null, userSession: { isLoggedIn: false, user: null, accessToken: null } });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    });

    it('redirects to login when isLoggedIn is false even if a user object exists (inconsistent state)', () => {
        renderGuarded({
            isLoading: false,
            error: null,
            userSession: { isLoggedIn: false, user: { rol: 'admin' }, accessToken: 'token' },
        });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
        expect(screen.queryByText('Zona protegida')).not.toBeInTheDocument();
    });

    it('redirects to login when isLoggedIn is missing (edge case)', () => {
        renderGuarded({
            isLoading: false,
            error: null,
            userSession: { user: { rol: 'admin' }, accessToken: 'token' },
        });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    });

    it('redirects to login when isLoggedIn is true but the user is missing (null safety)', () => {
        renderGuarded({
            isLoading: false,
            error: null,
            userSession: { isLoggedIn: true, user: null, accessToken: 'token' },
        });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    });

    it('passes the origin route to the login page', () => {
        renderGuarded({ isLoading: false, error: null, userSession: { isLoggedIn: false, user: null, accessToken: null } });

        expect(screen.getByTestId('from')).toHaveTextContent('/privado');
    });

    it('redirects to login when the user session is null (null safety)', () => {
        renderGuarded({ isLoading: false, error: null, userSession: null });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    });

    it('redirects to login when there is an error (negative case)', () => {
        renderGuarded({ ...adminSession, error: 'Sesión expirada' });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
    });

    it('redirects to unauthorized when the role does not match (negative case)', () => {
        renderGuarded({ isLoading: false, error: null, userSession: { isLoggedIn: true, user: { rol: 'user' }, accessToken: 'token' } });

        expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    });

    it('renders the children when no role is required (edge case)', () => {
        renderGuarded(
            { isLoading: false, error: null, userSession: { isLoggedIn: true, user: { rol: 'user' }, accessToken: 'token' } },
            null
        );

        expect(screen.getByText('Zona protegida')).toBeInTheDocument();
    });

    it('redirects to unauthorized when the user has no role but one is required (edge case)', () => {
        renderGuarded({ isLoading: false, error: null, userSession: { isLoggedIn: true, user: {}, accessToken: 'token' } });

        expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    });
});
