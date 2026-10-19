import { jwtDecode } from "jwt-decode";

const saveRefreshToken = (refreshToken) => {
    try {
        // Decodificar el JWT para obtener el payload
        const decoded = jwtDecode(refreshToken);

        // Si el refresh-token no tiene tiempo de expiración, se asume un tiempo de vida de 7 días  
        const exp = (!decoded.exp) ? (7 * 24 * 60 * 60 * 1000) : decoded.exp;

        // Tiempo actual en segundos
        const now = Math.floor(Date.now() / 1000);

        // Tiempo restante hasta que expire el token
        const ttl = exp - now;

        if (ttl <= 0) {
            console.error("El refresh token ya está vencido");
            return;
        }

        // Guardar cookie con el mismo tiempo de vida
        document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${ttl}; secure; samesite=strict`;
    } catch (err) {
        console.error("Error al decodificar el refresh token:", err);
    }
}

const getRefreshTokenFromCookie = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; refresh_token=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
}

export { saveRefreshToken, getRefreshTokenFromCookie };