import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "../store/authStore";

export const ProtectedRoutes = ({ children, requiredRole }) => {
    const isLoading = useAuthStore((state) => state.isLoading);
    const error = useAuthStore((state) => state.error);
    const userSession = useAuthStore((state) => state.userSession);
    const location = useLocation();

    if (isLoading) {
        return <div>Cargando...</div>
    }

    if (!userSession?.user || error) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (userSession.user.rol !== requiredRole && requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}