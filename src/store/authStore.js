import { create } from 'zustand';
import instance, { injectStore } from '../axios/axiosInstance';
import { getRefreshTokenFromCookie, saveRefreshToken } from '../utils/refreshToken';
import { jwtDecode } from 'jwt-decode';

export const createInitialAuthState = () => ({
    userSession: {
        isLoggedIn: false,
        user: null,
        accessToken: null,
    },
    isLoading: false,
    error: null,
    isBootstrapped: false,
});

export const useAuthStore = create((set, get) => ({
    ...createInitialAuthState(),

    clearError: () => {
        set({ error: null });
    },

    setAccessToken: (token) => {
        set((state) => ({
            userSession: {
                ...state.userSession,
                accessToken: token,
            },
        }));
    },

    login: async (credentials) => {
        set({ isLoading: true, error: null });

        try {
            const response = await instance.post('/api/login', credentials);
            if (response?.data?.data?.access_token) {
                const payload = jwtDecode(response.data.data.access_token);

                set({
                    userSession: {
                        isLoggedIn: true,
                        user: payload.user,
                        accessToken: response.data.data.access_token,
                    },
                });
                if (credentials?.rememberMe) {
                    saveRefreshToken(response.data.data.refresh_token);
                }
                set({ isLoading: false });
                return;
            } else {
                const msg = 'Usuario y o contraseña no válidos.';
                set({ error: msg, isLoading: false });
                throw new Error(msg);
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || 'Error al autenticar al usuario';
            set({ error: msg, isLoading: false });
            throw new Error(msg);
        }
    },

    logout: async () => {
        set({
            userSession: {
                isLoggedIn: false,
                user: null,
                accessToken: null,
            },
        });
        const refreshToken = getRefreshTokenFromCookie();
        if (!refreshToken) {
            return;
        }
        try {
            await instance.post('/api/logout', { refreshToken });
        } catch (error) {
            // ignore errors on logout
        }
    },

    bootstrapSession: async () => {
        const state = get();
        if (state.isBootstrapped) {
            return;
        }
        set({ isBootstrapped: true });

        const refreshToken = getRefreshTokenFromCookie();
        if (refreshToken && !get().userSession.isLoggedIn) {
            set({ isLoading: true });
            try {
                const response = await instance.post('/api/refreshToken', { refreshToken });
                const payload = jwtDecode(response.data.data.access_token);
                set({
                    userSession: {
                        isLoggedIn: true,
                        user: payload.user,
                        accessToken: response.data.data.access_token,
                    },
                });
                if (response.data.data.refresh_token) {
                    saveRefreshToken(response.data.data.refresh_token);
                }
            } catch (error) {
                // Si falla, no hacer nada, el usuario irá a login
            } finally {
                set({ isLoading: false });
            }
        }
    },
}));

injectStore(useAuthStore);
