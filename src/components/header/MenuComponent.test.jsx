import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MenuComponent } from './MenuComponent';
import AuthContext from '../../contexts/AuthContext';
import { useProductStore, createInitialProductState } from '../../store/productStore';

const mockLogout = jest.fn();
const mockGetAllProducts = jest.fn();

const resetProductStore = () => {
    useProductStore.setState({
        ...createInitialProductState(),
        getAllProducts: mockGetAllProducts,
    });
};

const loggedOut = { isLoggedIn: false, user: null, accessToken: null };
const loggedIn = { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' };

const renderMenu = (userSession, initialEntries = ['/']) => render(
    <AuthContext.Provider value={{ logout: mockLogout, userSession }}>
        <MemoryRouter initialEntries={initialEntries}>
            <MenuComponent />
        </MemoryRouter>
    </AuthContext.Provider>
);

describe('MenuComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLogout.mockReset().mockResolvedValue();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        resetProductStore();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('shows the login and register links when there is no session (happy path)', () => {
        renderMenu(loggedOut);

        expect(screen.getByText('Iniciar session')).toBeInTheDocument();
        expect(screen.getByText('Registrarse')).toBeInTheDocument();
        expect(screen.queryByText('Cerrar session')).not.toBeInTheDocument();
    });

    it('shows the username and the logout button when logged in', () => {
        renderMenu(loggedIn);

        expect(screen.getByText(/Hola ana/)).toBeInTheDocument();
        expect(screen.getByText('Cerrar session')).toBeInTheDocument();
    });

    it('calls logout when pressing the logout button', async () => {
        renderMenu(loggedIn);

        await act(async () => {
            fireEvent.click(screen.getByText('Cerrar session'));
        });

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('does not crash when logout fails (negative case)', async () => {
        mockLogout.mockRejectedValueOnce(new Error('logout failed'));
        renderMenu(loggedIn);

        await act(async () => {
            fireEvent.click(screen.getByText('Cerrar session'));
        });

        expect(console.error).toHaveBeenCalled();
    });

    it('handles an undefined session without crashing (edge case)', () => {
        renderMenu(undefined);

        expect(screen.getByText('Iniciar session')).toBeInTheDocument();
    });

    it('shows the favorites counter from the store', () => {
        localStorage.setItem('favoritos', JSON.stringify([{ asin: 'A1' }, { asin: 'A2' }]));
        resetProductStore();
        renderMenu(loggedIn);

        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('searches products when clicking the search button (happy path)', async () => {
        renderMenu(loggedIn);

        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'telefono' } });
        await act(async () => {
            fireEvent.click(screen.getByText('Buscar'));
        });

        await waitFor(() => {
            expect(mockGetAllProducts).toHaveBeenCalledWith('telefono');
        });
    });

    it('searches products when pressing Enter', async () => {
        renderMenu(loggedIn);

        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'tv' } });
        await act(async () => {
            fireEvent.keyDown(input, { key: 'Enter' });
        });

        await waitFor(() => {
            expect(mockGetAllProducts).toHaveBeenCalledWith('tv');
        });
    });

    it('searches with an empty string without crashing (edge case)', async () => {
        renderMenu(loggedIn);

        await act(async () => {
            fireEvent.click(screen.getByText('Buscar'));
        });

        await waitFor(() => {
            expect(mockGetAllProducts).toHaveBeenCalledWith('');
        });
    });

    it('hides the product manager link when there is no session', () => {
        renderMenu(loggedOut);

        expect(screen.queryByText('Mantenedor de Productos')).not.toBeInTheDocument();
    });

    it('shows the product manager link when logged in', () => {
        renderMenu(loggedIn);

        expect(screen.getByText('Mantenedor de Productos')).toBeInTheDocument();
    });

    it('marks Home as active and the product manager as inactive on "/" (happy path)', () => {
        renderMenu(loggedIn, ['/']);

        expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByText('Mantenedor de Productos')).not.toHaveAttribute('aria-current');
    });

    it('keeps the product manager active on its sub-routes', () => {
        renderMenu(loggedIn, ['/admin-producto/editar/1']);

        expect(screen.getByText('Mantenedor de Productos')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByText('Home')).not.toHaveAttribute('aria-current');
    });

    it('does not mark any nav link as active on an unrelated route (negative case)', () => {
        renderMenu(loggedIn, ['/register']);

        expect(screen.getByText('Home')).not.toHaveAttribute('aria-current');
        expect(screen.getByText('Mantenedor de Productos')).not.toHaveAttribute('aria-current');
    });

    it('keeps the nav links without active state for an undefined session (edge case)', () => {
        renderMenu(undefined, ['/']);

        expect(screen.getByText('Home')).toHaveAttribute('aria-current', 'page');
        expect(screen.queryByText('Mantenedor de Productos')).not.toBeInTheDocument();
    });
});
