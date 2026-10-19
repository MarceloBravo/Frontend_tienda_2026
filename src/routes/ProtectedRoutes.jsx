import { Navigate, useLocation } from "react-router";
import { useContext } from "react";
import AuthContext from "../contexts/AuthContext";

export const ProtectedRoutes = ({ children, requiredRole }) => {
    const { isLoading, error, userSession } = useContext(AuthContext);
    const location = useLocation();

    if(isLoading){
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