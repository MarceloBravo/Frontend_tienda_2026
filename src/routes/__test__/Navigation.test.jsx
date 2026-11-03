import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Navigation from '../Navigation';
import { useAuthStore, createInitialAuthState } from '../../store/authStore';

const renderAt = (path) => render(
    <MemoryRouter initialEntries={[path]}>
        <Navigation />
    </MemoryRouter>
);

describe('Navigation', () => {
    beforeEach(() => {
        localStorage.clear();
        useAuthStore.setState(createInitialAuthState());
    });

    it('redirects to login when an unauthenticated user opens the checkout route', async () => {
        renderAt('/checkout');

        expect(await screen.findByRole('heading', { name: 'Iniciar Sesión' })).toBeInTheDocument();
        expect(screen.queryByText('Pagar con Webpay Plus')).not.toBeInTheDocument();
    });
});
