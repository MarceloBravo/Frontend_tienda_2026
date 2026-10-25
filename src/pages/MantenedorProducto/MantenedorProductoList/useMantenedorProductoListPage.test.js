import { renderHook, act, waitFor } from '@testing-library/react';
import { useMantenedorProductoListPage } from './useMantenedorProductoListPage';

const mockNavigate = jest.fn();
const mockSendRequest = jest.fn();
const mockCargarImagen = jest.fn();
const mockAddToast = jest.fn();
const mockShowModal = jest.fn();
const modalState = { responseModal: null };

const mockSetResponse = jest.fn((response) => {
    modalState.responseModal = response;
});

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
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

jest.mock('../../../store/modalStore', () => ({
    useModalStore: (selector) => selector({
        showModal: mockShowModal,
        responseModal: modalState.responseModal,
        setResponse: mockSetResponse,
    }),
}));

const respondModal = (rerender, response = true) => {
    act(() => {
        modalState.responseModal = response;
        rerender();
    });
};

const productos = [
    { asin: 'A1', currency: 'USD', product_price: 10, product_title: 'Uno', product_photo: 'p1.png' },
    { asin: 'A2', currency: 'USD', product_price: 20, product_title: 'Dos', product_photo: 'p2.png' },
];

const apiResponse = (data, totProd = data.length, totPages = 1, page = 1) => ({
    status: 'success',
    data,
    totProd,
    totPages,
    page,
});

describe('useMantenedorProductoListPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockSendRequest.mockReset().mockResolvedValue(apiResponse(productos));
        mockCargarImagen.mockReset().mockImplementation(async (photo) => `url-${photo}`);
        mockAddToast.mockReset();
        mockShowModal.mockReset();
        mockSetResponse.mockClear();
        modalState.responseModal = null;
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
        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos?page=1');
    });

    it('keeps the total and the pages reported by the API (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(apiResponse(productos, 42, 7, 2));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.total).toBe(42);
        });
        expect(result.current.totalPages).toBe(7);
        expect(result.current.page).toBe(2);
    });

    it('reads the products from the new API envelope (happy path)', async () => {
        mockSendRequest.mockResolvedValueOnce(apiResponse(productos, 2, 1, 1));
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
        mockSendRequest.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(mockSendRequest).toHaveBeenCalled();
        });
        expect(result.current.productos).toEqual([]);
        expect(result.current.error).toBeNull();
    });

    it('sets a visible error when loading fails (API failure)', async () => {
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMantenedorProductoListPage());

        await waitFor(() => {
            expect(result.current.error).toBe('Ocurrió un error al cargar los productos');
        });
        expect(console.error).toHaveBeenCalled();
    });

    it('searches products with the typed text (happy path)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockResolvedValueOnce(apiResponse([productos[0]], 1, 1, 1));
        act(() => {
            result.current.handleInputChange({ target: { value: 'phone' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos?search=phone&page=1');
        expect(result.current.productos).toHaveLength(1);
    });

    it('searches without a query when the text is empty (edge case)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleInputChange({ target: { value: '   ' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos?page=1');
    });

    it('shows an empty list when the search returns an envelope without products (edge case)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockResolvedValueOnce({ status: 'success', data: null, totProd: 0, totPages: 0, page: 1 });
        act(() => {
            result.current.handleInputChange({ target: { value: 'sin resultados' } });
        });
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(result.current.productos).toEqual([]);
        expect(result.current.total).toBe(0);
    });

    it('loads the requested page keeping the search (happy path)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockResolvedValueOnce(apiResponse([productos[1]], 42, 7, 3));
        act(() => {
            result.current.handleInputChange({ target: { value: 'phone' } });
        });
        await act(async () => {
            await result.current.handlePageChange(3);
        });

        expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos?search=phone&page=3');
        expect(result.current.page).toBe(3);
        expect(result.current.totalPages).toBe(7);
        expect(result.current.productos).toHaveLength(1);
    });

    it('shows an error toast when the page change fails (API failure)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        await act(async () => {
            await result.current.handlePageChange(2);
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al cargar los productos', 'error');
    });

    it('shows an error toast when the search fails (negative case)', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        await act(async () => {
            await result.current.handleBuscarClick();
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al filtrar los datos', 'error');
    });

    it('triggers the search when pressing Enter', async () => {
        const { result } = renderHook(() => useMantenedorProductoListPage());

        act(() => {
            result.current.handleInputChange({ target: { value: 'tv' } });
        });
        await act(async () => {
            result.current.handleInputKeyDown({ key: 'Enter' });
        });

        await waitFor(() => {
            expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos?search=tv&page=1');
        });
    });

    it('deletes a product after confirming (happy path)', async () => {
        const { result, rerender } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockResolvedValueOnce({ status: 'success' });
        act(() => {
            result.current.handleEliminarClick('A1');
        });
        expect(mockShowModal).toHaveBeenCalledWith('Eliminar', '¿Está seguro de eliminar el producto?', 'delete');

        respondModal(rerender, true);

        await waitFor(() => {
            expect(mockSendRequest).toHaveBeenCalledWith('/api/productos/A1', 'DELETE');
            expect(result.current.productos).toHaveLength(1);
        });
        expect(result.current.imagenes).not.toHaveProperty('A1');
        expect(mockAddToast).toHaveBeenCalledWith('Producto eliminado exitosamente', 'success');
    });

    it('does not delete when the user cancels the confirmation (edge case)', async () => {
        const { result, rerender } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        act(() => {
            result.current.handleEliminarClick('A1');
        });
        respondModal(rerender, false);

        expect(mockSendRequest).not.toHaveBeenCalledWith('/api/productos/A1', 'DELETE');
        expect(result.current.productos).toHaveLength(2);
    });

    it('does not delete on mount with a response left over from another page (regression)', async () => {
        modalState.responseModal = true;
        const { result } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        expect(mockSendRequest).not.toHaveBeenCalledWith(expect.any(String), 'DELETE');
    });

    it('shows an error toast when the delete response is empty (negative case)', async () => {
        const { result, rerender } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockResolvedValueOnce(null);
        act(() => {
            result.current.handleEliminarClick('A1');
        });
        respondModal(rerender, true);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('No se pudo eliminar el producto', 'error');
        });
        expect(result.current.productos).toHaveLength(2);
    });

    it('shows an error toast when the delete request rejects (API failure)', async () => {
        const { result, rerender } = renderHook(() => useMantenedorProductoListPage());
        await waitFor(() => expect(result.current.productos).toHaveLength(2));

        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        act(() => {
            result.current.handleEliminarClick('A1');
        });
        respondModal(rerender, true);

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al eliminar el producto', 'error');
        });
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
