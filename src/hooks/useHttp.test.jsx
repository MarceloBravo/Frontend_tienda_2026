import { renderHook, act } from '@testing-library/react';
import { useHttp } from './useHttp';
import instance from '../axios/axiosInstance';

jest.mock('../axios/axiosInstance', () => ({
    __esModule: true,
    default: jest.fn(),
    injectStore: jest.fn(),
}));

describe('useHttp', () => {
    beforeEach(() => {
        instance.mockReset();
    });

    it('returns data and clears isLoading on a successful request (happy path)', async () => {
        instance.mockResolvedValueOnce({ data: { id: 1, name: 'Producto' } });
        const { result } = renderHook(() => useHttp());

        let response;
        await act(async () => {
            response = await result.current.sendRequest('/api/productos', 'GET');
        });

        expect(response).toEqual({ id: 1, name: 'Producto' });
        expect(result.current.data).toEqual({ id: 1, name: 'Producto' });
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(instance).toHaveBeenCalledWith(expect.objectContaining({
            url: '/api/productos',
            method: 'GET',
        }));
    });

    it('sets the error state and rethrows when the request rejects (API failure)', async () => {
        instance.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'));
        const { result } = renderHook(() => useHttp());

        await act(async () => {
            await expect(result.current.sendRequest('/api/productos', 'GET'))
                .rejects.toThrow('timeout of 10000ms exceeded');
        });

        expect(result.current.error).toBe('timeout of 10000ms exceeded');
        expect(result.current.isLoading).toBe(false);
    });

    it('sets isLoading to false after a rejection (error state edge case)', async () => {
        instance.mockRejectedValueOnce(new Error('Network Error'));
        const { result } = renderHook(() => useHttp());

        await act(async () => {
            await expect(result.current.sendRequest('/api/x', 'POST')).rejects.toThrow();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.data).toBeNull();
    });

    it('starts with null data, null error and isLoading false (initial state)', () => {
        const { result } = renderHook(() => useHttp());

        expect(result.current.data).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(typeof result.current.sendRequest).toBe('function');
    });

    it('passes body and config through to the axios instance', async () => {
        instance.mockResolvedValueOnce({ data: { ok: true } });
        const { result } = renderHook(() => useHttp());

        await act(async () => {
            await result.current.sendRequest('/api/productos', 'POST', { a: 1 }, { timeout: 500 });
        });

        expect(instance).toHaveBeenCalledWith(expect.objectContaining({
            url: '/api/productos',
            method: 'POST',
            data: { a: 1 },
            timeout: 500,
        }));
    });
});
