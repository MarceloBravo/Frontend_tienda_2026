import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ProtectedRoutes } from './ProtectedRoutes';
import AuthContext from '../contexts/AuthContext';

const renderGuarded = (authValue, requiredRole = 'admin') => render(
    <AuthContext.Provider value={authValue}>
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
                <Route path="/login" element={<div>Pantalla login</div>} />
                <Route path="/unauthorized" element={<div>Acceso denegado</div>} />
            </Routes>
        </MemoryRouter>
    </AuthContext.Provider>
);

const adminSession = { isLoading: false, error: null, userSession: { user: { rol: 'admin' } } };

describe('ProtectedRoutes', () => {
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
        renderGuarded({ isLoading: false, error: null, userSession: { user: null } });

        expect(screen.getByText('Pantalla login')).toBeInTheDocument();
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
        renderGuarded({ isLoading: false, error: null, userSession: { user: { rol: 'user' } } });

        expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    });

    it('renders the children when no role is required (edge case)', () => {
        renderGuarded(
            { isLoading: false, error: null, userSession: { user: { rol: 'user' } } },
            null
        );

        expect(screen.getByText('Zona protegida')).toBeInTheDocument();
    });

    it('redirects to unauthorized when the user has no role but one is required (edge case)', () => {
        renderGuarded({ isLoading: false, error: null, userSession: { user: {} } });

        expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    });
});
