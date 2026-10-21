import { renderHook, act, waitFor } from '@testing-library/react';
import { useMantenedorProductoFormPage } from './useMantenedorProductoFormPage';
import imageCompression from 'browser-image-compression';

const mockNavigate = jest.fn();
const mockSendRequest = jest.fn();
const mockCargarImagen = jest.fn();
const mockAddToast = jest.fn();
let mockParams = {};
const httpState = { error: null };

jest.mock('react-router', () => ({
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
}));

jest.mock('../../../hooks/useHttp', () => ({
    useHttp: () => ({ error: httpState.error, sendRequest: mockSendRequest }),
}));

jest.mock('../../../utils/images', () => ({
    cargarImagen: (...args) => mockCargarImagen(...args),
}));

jest.mock('browser-image-compression', () => jest.fn());

jest.mock('../../../store/toastStore', () => ({
    useToastStore: (selector) => selector({ addToast: mockAddToast }),
}));

const setTextFields = (result, fields) => {
    Object.entries(fields).forEach(([name, value]) => {
        act(() => {
            result.current.handleInputChange({ target: { name, value } });
        });
    });
};

const setNumberFields = (result, fields) => {
    Object.entries(fields).forEach(([name, value]) => {
        act(() => {
            result.current.handleInputNumberChange({ target: { name, value } });
        });
    });
};

const validTextFields = {
    asin: 'ABC12',
    currency: 'CLP',
    product_title: 'Producto de prueba',
    sales_volume: '100 vendidos',
};

const validNumberFields = {
    product_num_ratings: '10',
    product_original_price: '20',
    product_price: '15',
    product_star_rating: '4',
};

describe('useMantenedorProductoFormPage', () => {
    beforeEach(() => {
        mockParams = {};
        httpState.error = null;
        mockNavigate.mockReset();
        mockSendRequest.mockReset();
        mockCargarImagen.mockReset().mockResolvedValue('foto-cargada');
        mockAddToast.mockReset();
        imageCompression.mockReset();
        jest.spyOn(window, 'confirm').mockReturnValue(true);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('starts with the default form data in create mode', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        expect(result.current.id).toBeUndefined();
        expect(result.current.formData.asin).toBe('');
        expect(result.current.formData.climate_pledge_friendly).toBe(false);
        expect(result.current.isLoadingProduct).toBe(false);
        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('loads the product in edit mode (happy path)', async () => {
        mockParams = { id: 'ABC12' };
        mockSendRequest.mockResolvedValueOnce({
            status: 'success',
            data: {
                asin: 'ABC12',
                product_title: 'Existente',
                product_photo: 'p.png',
                climate_pledge_friendly: 1,
                is_amazon_choice: 0,
                is_best_seller: 1,
            },
        });

        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await waitFor(() => {
            expect(result.current.formData.asin).toBe('ABC12');
        });
        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos/ABC12');
        expect(result.current.formData.climate_pledge_friendly).toBe(true);
        expect(result.current.formData.is_amazon_choice).toBe(false);
        expect(result.current.isLoadingProduct).toBe(false);
    });

    it('shows an error toast and stops loading when the product fetch fails (API failure)', async () => {
        mockParams = { id: 'ABC12' };
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));

        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await waitFor(() => {
            expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al cargar el producto', 'error');
        });
        expect(result.current.isLoadingProduct).toBe(false);
    });

    it('blocks the save and warns when the form is empty (edge case)', async () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await act(async () => {
            await result.current.handleGrabarClick();
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
        expect(mockAddToast).toHaveBeenCalledWith('Los datos ingresados no son válidos o están incompletos', 'error');
    });

    it('reports an error for a negative star rating (edge case)', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleInputNumberChange({ target: { name: 'product_star_rating', value: '-1' } });
        });

        expect(result.current.validationErrors.product_star_rating._errors[0])
            .toBe('El valor debe estar entre 0 y 5');
    });

    it('reports an error for a value above the maximum rating (edge case)', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleInputNumberChange({ target: { name: 'product_star_rating', value: '9' } });
        });

        expect(result.current.validationErrors.product_star_rating._errors[0])
            .toBe('El valor debe estar entre 0 y 5');
    });

    it('reports an error when sales_volume exceeds 255 characters (overflow edge case)', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleInputChange({ target: { name: 'sales_volume', value: 'a'.repeat(300) } });
        });

        expect(result.current.validationErrors.sales_volume._errors[0])
            .toBe('El valor es demasiado extenso');
    });

    it('reports an error when the title is empty (edge case)', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleInputChange({ target: { name: 'product_title', value: '' } });
        });

        expect(result.current.validationErrors.product_title._errors[0])
            .toBe('El campo es requerido');
    });

    it('creates a new product with a valid form (happy path)', async () => {
        const file = new File(['data'], 'foto.png', { type: 'image/png' });
        imageCompression.mockResolvedValue(file);
        mockSendRequest.mockResolvedValueOnce({ status: 'success' });
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        setTextFields(result, validTextFields);
        setNumberFields(result, validNumberFields);
        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });
        await waitFor(() => {
            expect(result.current.formData.product_photo_file).toBe(file);
        });

        await act(async () => {
            await result.current.handleGrabarClick();
        });

        expect(mockSendRequest).toHaveBeenCalledWith('/api/productos', 'POST', expect.any(FormData), expect.any(Object));
        expect(mockAddToast).toHaveBeenCalledWith('Producto guardado correctamente', 'success');
        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto');
    });

    it('does not save when the user cancels the confirmation (edge case)', async () => {
        const file = new File(['data'], 'foto.png', { type: 'image/png' });
        imageCompression.mockResolvedValue(file);
        window.confirm.mockReturnValue(false);
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        setTextFields(result, validTextFields);
        setNumberFields(result, validNumberFields);
        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });
        await waitFor(() => expect(result.current.formData.product_photo_file).toBe(file));

        await act(async () => {
            await result.current.handleGrabarClick();
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('updates an existing product in edit mode (happy path)', async () => {
        mockParams = { id: 'ABC12' };
        mockSendRequest.mockResolvedValueOnce({
            status: 'success',
            data: {
                asin: 'ABC12',
                currency: 'CLP',
                product_title: 'Existente',
                product_photo: 'p.png',
                product_num_ratings: 10,
                product_original_price: 20,
                product_price: 15,
                product_star_rating: 4,
                sales_volume: '100',
                climate_pledge_friendly: false,
                is_amazon_choice: false,
                is_best_seller: false,
            },
        });
        const { result } = renderHook(() => useMantenedorProductoFormPage());
        await waitFor(() => expect(result.current.formData.asin).toBe('ABC12'));

        mockSendRequest.mockResolvedValueOnce({ status: 'success' });
        await act(async () => {
            await result.current.handleGrabarClick();
        });

        expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos/ABC12', 'PUT', expect.any(FormData), expect.any(Object));
        expect(mockAddToast).toHaveBeenCalledWith('Producto actualizado correctamente', 'success');
        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto');
    });

    it('shows an error toast when saving fails (API failure)', async () => {
        const file = new File(['data'], 'foto.png', { type: 'image/png' });
        imageCompression.mockResolvedValue(file);
        mockSendRequest.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        setTextFields(result, validTextFields);
        setNumberFields(result, validNumberFields);
        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });
        await waitFor(() => expect(result.current.formData.product_photo_file).toBe(file));

        await act(async () => {
            await result.current.handleGrabarClick();
        });

        expect(mockAddToast).toHaveBeenCalledWith('Ocurrió un error al guardar el producto', 'error');
    });

    it('rejects a non-png image (negative case)', async () => {
        const file = new File(['data'], 'foto.jpg', { type: 'image/jpeg' });
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [file] } });
        });

        expect(mockAddToast).toHaveBeenCalledWith('Solo se permiten imágenes PNG', 'error');
        expect(imageCompression).not.toHaveBeenCalled();
    });

    it('does nothing when no file is selected (edge case)', async () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await act(async () => {
            await result.current.handleFileChange({ target: { files: [] } });
        });

        expect(mockAddToast).not.toHaveBeenCalledWith('Solo se permiten imágenes PNG', 'error');
        expect(result.current.formData.product_photo_file).toBeNull();
    });

    it('toggles a checkbox and validates its field', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleCheckboxChange({ target: { name: 'is_amazon_choice', checked: true } });
        });

        expect(result.current.formData.is_amazon_choice).toBe(true);
    });

    it('deletes the product after confirming (happy path)', async () => {
        mockParams = { id: 'ABC12' };
        mockSendRequest.mockResolvedValueOnce({
            status: 'success',
            data: {
                asin: 'ABC12',
                product_photo: 'p.png',
                climate_pledge_friendly: false,
                is_amazon_choice: false,
                is_best_seller: false,
            },
        });
        const { result } = renderHook(() => useMantenedorProductoFormPage());
        await waitFor(() => expect(result.current.formData.asin).toBe('ABC12'));

        mockSendRequest.mockResolvedValueOnce({ status: 'success' });
        await act(async () => {
            await result.current.handlerEliminarClick();
        });

        expect(mockSendRequest).toHaveBeenLastCalledWith('/api/productos/ABC12', 'DELETE');
        expect(mockAddToast).toHaveBeenCalledWith('Producto eliminado correctamente', 'success');
        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto');
    });

    it('does not delete when the user cancels the confirmation (edge case)', async () => {
        window.confirm.mockReturnValue(false);
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        await act(async () => {
            await result.current.handlerEliminarClick();
        });

        expect(mockSendRequest).not.toHaveBeenCalled();
    });

    it('navigates back when cancelling', () => {
        const { result } = renderHook(() => useMantenedorProductoFormPage());

        act(() => {
            result.current.handleCancelarClick();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/admin-producto');
    });
});
