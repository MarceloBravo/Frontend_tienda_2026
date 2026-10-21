import { renderHook, act, waitFor } from '@testing-library/react';
import { useMantenedorProductoListPage } from './useMantenedorProductoListPage';

const mockNavigate = jest.fn();
const mockGetAllProducts = jest.fn();
const mockSendRequest = jest.fn();
const mockCargarImagen = jest.fn();
const mockAddToast = jest.fn();
const mockState = { isLoading: false };

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
}));

jest.mock('../../../contexts/ProductContext', () => ({
    useProducts: () => ({ state: mockState, getAllProducts: mockGetAllProducts }),
}));

jest.mock('../../../hooks/useHttp', () => ({
    useHttp: () => ({ sendRequest: mockSendRequest }),
}));

jest.mock('../../../utils/images', () => ({
    cargarImagen: (...args) => mockCargarImagen(...args),
}));

jest.mock('../../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: mockAddToast }),
}));

const productos = [
    { asin: 'A1', currency: 'USD', product_price: 10, product_title: 'Uno', product_photo: 'p1.png' },
    { asin: 'A2', currency: 'USD', product_price: 20, product_title: 'Dos', product_photo: 'p2.png' },
];

const apiResponse = (data, totProd = data.length, page = 1) => ({
    status: 'success',
    data,
    totProd,
    page,
});

describe('useMantenedorProductoListPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockGetAllProducts.mockReset().mockResolvedValue({ products: productos, total: productos.length, page: 1 });
        mockSendRequest.mockReset();
        mockCargarImagen.mockReset().mockImplementation(async (photo) => `url-${photo}`);
        mockAddToast.mockReset();
        jest.spyOn(window, 'confirm').mockReturnValue(true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('loads the products and their images on mount (happy path)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.productos).toHaveLength(2);
        });
        await waitFor(() => {
            expect(result.current.imagenes).toEqual({ A1: 'url-p1.png', A2: 'url-p2.png' });
        });
    });

    it('keeps the total and the page reported by the API (happy path)', async () => {
        mockGetAllProducts.mockResolvedValueOnce({ products: productos, total: 42, page: 3 });
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.total).toBe(42);
        });
        expect(result.current.page).toBe(3);
    });

    it('reads the products from the new API envelope (happy path)', async () => {
        mockGetAllProducts.mockResolvedValueOnce(apiResponse(productos, 2, 1));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.productos).toHaveLength(2);
        });
        expect(result.current.total).toBe(2);
    });

    it('starts with an empty list and no error', () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        expect(result.current.productos).toEqual([]);
        expect(result.current.error).toBeNull();
        expect(result.current.searchText).toBe('');
    });

    it('handles a null API response as an empty list (edge case)', async () => {
        mockGetAllProducts.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(mockGetAllProducts).toHaveBeenCalled();
        });
        expect(result.current.productos).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('sets a visible error when loading fails (API failure)', async () => {
        mockGetAllProducts.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.error).toBe('Ocurrió un error al cargar los productos');
        });
        expect(console.error).toHaveBeenCalled();
    });

    it('searches products with the typed text', async () => {
        mockSendRequest.mockResolvedValueOnce(apiResponse([productos[0]], 1, 1));
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        act(() => {
            result.current.handleInputChange({ target: { value: 'phone' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos?search=phone');
        expect(result.current.productos).toHaveLength(1);
    });

    it('searches without a query when the text is empty (edge case)', async () => {
        mockSendRequest.mockResolvedValueOnce(apiResponse(productos));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleInputChange({ target: { value: '   ' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos');
    });

    it('shows an empty list when the search returns an envelope without products (edge case)', async () => {
        mockSendRequest.mockResolvedValueOnce({ status: 'success', data: null, totProd: 0, page: 1 });
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        act(() => {
            result.current.handleInputChange({ target: { value: 'sin resultados' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(result.current.productos).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('shows an error toast when the search fails (negative case)', async () => {
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al filtrar los datos', 'error');
    });

    it('triggers the search when pressing Enter', async () => {
        mockSendRequest.mockResolvedValueOnce(apiResponse(productos));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleInputChange({ target: { value: 'tv' } });
        });
        await act(async () => {
            result.current.handleInputKeyDown({ key: 'Enter' });
        });

        await waitFor(() => {
            expect(mockSendRequest).toHaveBeenCalledWith('/api/productos?search=tv');
        });
    });

    it('deletes a product after confirming (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce({ status: 'success' });
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        await act(async () => {
            await result.current.handleEliminarClick('A1');
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos/A1', 'DELETE');
        expect(result.current.productos).toHaveLength(1);
        expect(result.current.imagenes).not.toHaveProperty('A1');
        expect(mockAddToast).toHaveBeenCalledWith('Producto eliminado exitosamente', 'success');
    });

    it('does not delete when the user cancels the confirmation (edge case)', async () => {
        window.confirm.mockReturnValue(false);
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        await act(async () => {
            await result.current.handleEliminarClick('A1');
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(result.current.productos).toHaveLength(2);
    });

    it('shows an error toast when the delete response is empty (negative case)', async () => {
        mockSendRequest.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        await act(async () => {
            await result.current.handleEliminarClick('A1');
        });

        expect(mockAddToast).toHaveBeenCalledWith('No se pudo eliminar el producto', 'error');
        expect(result.current.productos).toHaveLength(2);
    });

    it('shows an error toast when the delete request rejects (API failure)', async () => {
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        await act(async () => {
            await result.current.handleEliminarClick('A1');
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al eliminar el producto', 'error');
    });

    it('navigates to the edit page', () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleEditarClick('A1');
        });

        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto/editar/A1');
    });

    it('navigates to the new product page', () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleBtnNuevo();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto/nuevo');
    });
});
