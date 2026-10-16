import axios from "axios";
import { saveRefreshToken, getRefreshTokenFromCookie } from "../utils/refreshToken";

const API_URL = process.env.REACT_APP_API_URL;

const instance = axios.create({
  baseURL: API_URL,
});

// Variable para almacenar la función de actualización del store/context
let store;

export const injectStore = (_store) => {
  store = _store;
};


instance.interceptors.request.use(
  (config) => {
    const token = store.userSession.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url;

    // Un 401 del login son credenciales inválidas: no hay nada que refrescar.
    // Dejar propagar el error permite mostrar el mensaje del backend sin recargar.
    if (requestUrl === '/api/login') {
      return Promise.reject(error);
    }

    // El propio refresh falló: no reintentar para evitar un bucle infinito.
    if (requestUrl === '/api/refreshToken') {
      return Promise.reject(error);
    }

    // Si el access token expiró
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshTokenFromCookie();
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        // Pedir nuevo access token usando refresh token
        const { data } = await instance.post('/api/refreshToken', { refreshToken });
        const newAccessToken = data?.data?.access_token;
        const newRefreshToken = data?.data?.refresh_token;
        if (!newAccessToken) {
          throw new Error('No se pudo renovar la sesión.');
        }

        saveRefreshToken(newRefreshToken);
        if (store && store.setUserSession) {
          store.setUserSession(prev => ({
            ...prev,
            accessToken: newAccessToken,
          }));
        }

        // Reintentar la request original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (err) {
        await store.logout();
        // Si falla el refresh → redirigir a login
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;