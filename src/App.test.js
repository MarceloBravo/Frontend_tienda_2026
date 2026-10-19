import { render, screen } from '@testing-library/react';
import App from './App';
import { AppProviders } from './contexts/AppProviders';
import instance from './axios/axiosInstance';

jest.mock('./axios/axiosInstance', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve({ data: [] })),
    injectStore: jest.fn(),
}));

const renderApp = () => render(
    <AppProviders>
        <App />
    </AppProviders>
);

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        instance.mockReset();
        instance.mockImplementation(() => Promise.resolve({ data: [] }));
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the header and the home page (smoke test)', async () => {
        renderApp();

        expect(await screen.findByText('MyStore')).toBeInTheDocument();
        expect(await screen.findByText('Las mejores ofertas en smartphones')).toBeInTheDocument();
    });

    it('shows the empty state when the API returns no products', async () => {
        renderApp();

        expect(await screen.findByText('No hay productos disponibles')).toBeInTheDocument();
    });

    it('shows the error state when the products request fails (API failure)', async () => {
        instance.mockRejectedValueOnce(new Error('Network Error'));
        renderApp();

        expect(await screen.findByText('Error: Network Error')).toBeInTheDocument();
    });
});
