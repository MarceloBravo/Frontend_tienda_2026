import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MenuComponent } from './MenuComponent';
import AuthContext from '../../contexts/AuthContext';

const mockLogout = jest.fn();
const mockGetAllProducts = jest.fn();
const mockGetFavoritosCount = jest.fn();
const mockState = { loading: false, products: [] };

jest.mock('../../contexts/ProductContext', () => ({
    useProducts: () => ({
        state: mockState,
        getAllProducts: mockGetAllProducts,
        getFavoritosCount: mockGetFavoritosCount,
    }),
}));

const loggedOut = { isLoggedIn: false, user: null, accessToken: null };
const loggedIn = { isLoggedIn: true, user: { username: 'ana' }, accessToken: 'token' };

const renderMenu = (userSession) => render(
    <AuthContext.Provider value={{ logout: mockLogout, userSession }}>
        <MemoryRouter>
            <MenuComponent />
        </MemoryRouter>
    </AuthContext.Provider>
);

describe('MenuComponent', () => {
    beforeEach(() => {
        localStorage.clear();
        mockLogout.mockReset().mockResolvedValue();
        mockGetAllProducts.mockReset().mockResolvedValue([]);
        mockGetFavoritosCount.mockReset().mockReturnValue(2);
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
});
