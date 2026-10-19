import { createContext, useState, useEffect } from 'react';
import instance, { injectStore } from '../axios/axiosInstance';
import { getRefreshTokenFromCookie, saveRefreshToken } from '../utils/refreshToken';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userSession, setUserSession] = useState({
        isLoggedIn: false,
        user: null,
        accessToken: null,
    });



    const login = async (credentials) => {
        setIsLoading(true);
        setError(null);
        
        try{
            const response = await instance.post('/api/login', credentials);
            if(response?.data?.data?.access_token){
                const payload = jwtDecode(response.data.data.access_token);

                setUserSession({
                    isLoggedIn: true,
                    user: payload.user,
                    accessToken: response.data.data.access_token,
                });
                if(credentials.rememberMe){
                  saveRefreshToken(response.data.data.refresh_token); // Guarda el refresh-token en cookie
                }

            }else{
                const msg = 'Usuario y o contraseña no válidos.';
                setError(msg);
                throw new Error(msg);
            }
        }catch(error){
            const msg = error.response?.data?.message || error.message || 'Error al autenticar al usuario';
            setError(msg);
            throw new Error(msg);
        }finally{
            setIsLoading(false);
        }
        
    };

    const logout = async () => {
        setUserSession({
            isLoggedIn: false,
            user: null,
            accessToken: null,
        });
        const refreshToken = getRefreshTokenFromCookie();
        if(!refreshToken){
            return;
        }
        await instance.post('/api/logout', {refreshToken});
    };

  useEffect(() => {
    // Inyectamos las funciones que el interceptor de Axios necesita
    injectStore({
      setUserSession,
      logout, // Pasamos también el logout por si el refresh token falla
      userSession
    });
  }, [userSession]);

  useEffect(() => {
    // Auto-login si hay refresh_token
    const refreshToken = getRefreshTokenFromCookie();
    if (refreshToken && !userSession.isLoggedIn) {
      setIsLoading(true);
      instance.post('/api/refreshToken', { refreshToken })
        .then(response => {
          const payload = jwtDecode(response.data.data.access_token);
          setUserSession({
            isLoggedIn: true,
            user: payload.user,
            accessToken: response.data.data.access_token,
          });
          saveRefreshToken(response.data.data.refresh_token);
        })
        .catch(() => {
          // Si falla, no hacer nada, el usuario irá a login
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider value={{ userSession, setUserSession, login, logout, isLoading, error}}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;