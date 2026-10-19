import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { SpinnerComponent } from '../components/spinner/SpinnerComponent';
import { ProtectedRoutes } from './ProtectedRoutes';

const HomePage = lazy(() => import('../pages/home/HomePage').then(module => ({ default: module.HomePage })));
const DetalleProductoPage = lazy(() => import('../pages/DetalleProducto/DetalleProductoPage').then(module => ({ default: module.DetalleProductoPage })));
const MantenedorProductoListPage = lazy(() => import('../pages/MantenedorProducto/MantenedorProductoList/MantenedorProductoListPage').then(module => ({ default: module.MantenedorProductoListPage })));
const MantenedorProductoFormPage = lazy(() => import('../pages/MantenedorProducto/MantenedorProductoForm/MantenedorProductoFormPage').then(module => ({ default: module.MantenedorProductoFormPage })));
const RegisterPage = lazy(() => import('../pages/Register/RegisterPage').then(module => ({ default: module.RegisterPage })));
const Page403 = lazy(() => import('../pages/Page403/Page403').then(module => ({ default: module.Page403 })));
const Page404 = lazy(() => import('../pages/Page404/Page404').then(module => ({ default: module.Page404 })));
const LoginPage = lazy(() => import('../pages/Login/LoginPage').then(module => ({ default: module.LoginPage })));

const Navigation = () => {
  return (
        <Suspense fallback={<SpinnerComponent />}>
            <Routes>
                {/* Rutas de la página principal */}
                <Route path="/" element={<HomePage/>}/>
                <Route path="/detalle-producto/:id" element={<DetalleProductoPage/>}/>

                {/* Rutas del Mantenedor de productos */}
                <Route path='/admin-producto' element={<ProtectedRoutes requiredRole="admin"> <MantenedorProductoListPage/> </ProtectedRoutes>}/>
                <Route path='/admin-producto/editar/:id' element={<ProtectedRoutes requiredRole="admin"><MantenedorProductoFormPage/></ProtectedRoutes>}/>
                <Route path='/admin-producto/nuevo' element={<ProtectedRoutes requiredRole="admin"><MantenedorProductoFormPage/></ProtectedRoutes>}/>

                {/* Rutas de autenticación */}
                <Route path="/login" element={<LoginPage/>} />
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/unauthorized" element={<Page403/>} />
                <Route path="*" element={<Page404/>} />
            </Routes>
        </Suspense>
    )
}

export default Navigation
