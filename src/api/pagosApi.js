import instance from '../axios/axiosInstance';

const unwrap = (response) => response?.data?.data;

export const crearOrden = async ({ items, direccionEnvio = null }) => {
    const response = await instance.post('/api/pagos/crear-orden', {
        items,
        ...(direccionEnvio ? { direccionEnvio } : {}),
    });
    return unwrap(response);
};

export const iniciarPago = async (ordenId) => {
    const response = await instance.post('/api/pagos/iniciar', { ordenId });
    return unwrap(response);
};

export const obtenerEstadoPago = async (ordenId) => {
    const response = await instance.get(`/api/pagos/estado/${ordenId}`);
    return unwrap(response);
};
