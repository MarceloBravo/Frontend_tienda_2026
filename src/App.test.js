import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { AppProviders } from './contexts/AppProviders';
import instance from './axios/axiosInstance';
import { useProductStore, createInitialProductState } from './store/productStore';

jest.mock('./axios/axiosInstance', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve({
        data: { status: 'success', data: [], totProd: 0, totPages: 0, page: 1 },
    })),
    injectStore: jest.fn(),
}));

const emptyResponse = {
    data: { status: 'success', data: [], totProd: 0, totPages: 0, page: 1 },
};

const renderApp = () => render(
    <AppProviders>
        <App />
    </AppProviders>
);

describe('App', () => {
    beforeEach(() => {
        localStorage.clear();
        useProductStore.setState(createInitialProductState());
        instance.mockReset();
        instance.mockImplementation(() => Promise.resolve(emptyResponse));
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('renders the header and the home page (smoke test)', async () => {
        renderApp();

        expect(await screen.findByText('MyStore')).toBeInTheDocument();
        await waitFor(() => expect(instance).toHaveBeenCalled());
        expect(await screen.findByText('No hay productos disponibles')).toBeInTheDocument();
        expect(screen.getByText('Las mejores ofertas en smartphones')).toBeInTheDocument();
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
