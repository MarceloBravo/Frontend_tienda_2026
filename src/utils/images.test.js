import { cargarImagen, obtenerImagenValida, resolverUrlImagen } from './images';

const ORIGINAL_API_URL = process.env.REACT_APP_API_URL;

describe('resolverUrlImagen', () => {
    beforeEach(() => {
        process.env.REACT_APP_API_URL = 'https://api.tienda.cl/';
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = ORIGINAL_API_URL;
    });

    it('antepone la URL de la API a una ruta relativa', () => {
        expect(resolverUrlImagen('uploads/foto.png')).toBe('https://api.tienda.cl/uploads/foto.png');
    });

    it('elimina barras iniciales duplicadas de la ruta', () => {
        expect(resolverUrlImagen('/uploads/foto.png')).toBe('https://api.tienda.cl/uploads/foto.png');
    });

    it('mantiene intacta una URL absoluta', () => {
        const url = 'https://m.media-amazon.com/images/foto.jpg';
        expect(resolverUrlImagen(url)).toBe(url);
    });

    it('mantiene intacta una URL de datos', () => {
        const url = 'data:image/png;base64,abc';
        expect(resolverUrlImagen(url)).toBe(url);
    });

    it('devuelve null para valores vacíos o no string', () => {
        expect(resolverUrlImagen(null)).toBeNull();
        expect(resolverUrlImagen(undefined)).toBeNull();
        expect(resolverUrlImagen('')).toBeNull();
        expect(resolverUrlImagen('   ')).toBeNull();
        expect(resolverUrlImagen(123)).toBeNull();
    });

    it('devuelve una ruta relativa si no hay API configurada', () => {
        process.env.REACT_APP_API_URL = '';
        expect(resolverUrlImagen('uploads/foto.png')).toBe('/uploads/foto.png');
    });
});

describe('cargarImagen y obtenerImagenValida', () => {
    beforeEach(() => {
        process.env.REACT_APP_API_URL = 'https://api.tienda.cl';
    });

    afterAll(() => {
        process.env.REACT_APP_API_URL = ORIGINAL_API_URL;
    });

    it('cargarImagen resuelve la ruta sin validaciones de red', async () => {
        await expect(cargarImagen('uploads/foto.png')).resolves.toBe('https://api.tienda.cl/uploads/foto.png');
    });

    it('obtenerImagenValida prioriza la URL principal válida', async () => {
        await expect(obtenerImagenValida('uploads/foto.png', 'otra.png'))
            .resolves.toBe('https://api.tienda.cl/uploads/foto.png');
    });

    it('obtenerImagenValida usa la alternativa cuando la principal está vacía', async () => {
        await expect(obtenerImagenValida(null, 'otra.png'))
            .resolves.toBe('https://api.tienda.cl/otra.png');
    });

    it('obtenerImagenValida devuelve null si no recibe URLs válidas', async () => {
        await expect(obtenerImagenValida(null, '')).resolves.toBeNull();
    });
});
