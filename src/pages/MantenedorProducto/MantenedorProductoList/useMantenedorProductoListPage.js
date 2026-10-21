import { useEffect, useState } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNavigate } from 'react-router';
import { useHttp } from '../../../hooks/useHttp';
import { cargarImagen } from '../../../utils/images';
import { normalizeProductsResponse } from '../../../utils/apiResponse';
import { useToastStore } from '../../../store/toastStore';

export const useMantenedorProductoListPage = () => {
    const { sendRequest } = useHttp();
    const { state, getAllProducts} = useProducts();
    const [ productos, setProductos ] = useState([]);
    const [ imagenes, setImagenes ] = useState({})
    const [ total, setTotal ] = useState(0);
    const [ page, setPage ] = useState(1);
    const [ searchText, setSearchText ] = useState('');
    const [ error, setError ] = useState(null);
    const addToast = useToastStore(store => store.addToast);
    const navigate = useNavigate();


    useEffect(()=> {
        const obtenerProductos = async () => {
            setError(null);
            try {
                const response = await getAllProducts();
                const { products: productosData, total: totalProductos, page: pagina } = normalizeProductsResponse(response);
                setProductos(productosData);
                setTotal(totalProductos);
                setPage(pagina);

                // Cargar imágenes para cada producto
                const imagenesPromises = productosData.map(async (producto) => ({
                    asin: producto.asin,
                    url: await cargarImagen(producto.product_photo)
                }));
                const imagenesResultados = await Promise.all(imagenesPromises);
                const imagenesObj = {};
                imagenesResultados.forEach(({ asin, url }) => {
                    imagenesObj[asin] = url;
                });
                setImagenes(imagenesObj);
            } catch (error) {
                setError('Ocurrió un error al cargar los productos');
                console.error('Error loading products:', error);
            }
        }

        obtenerProductos();
        // eslint-disable-next-line
    },[])

    const handleBtnNuevo = () => {
        navigate('/admin-producto/nuevo');
    }

    const handleBuscarClick = async (e) => {
        try{
            const search = searchText.trim().length > 0 ? `?search=${searchText}` : '';
            setError(null);
            const response = await sendRequest(`/api/productos${search}`);
            const { products: productosData, total: totalProductos, page: pagina } = normalizeProductsResponse(response);
            setProductos(productosData);
            setTotal(totalProductos);
            setPage(pagina);
        }catch(error){
            addToast('Ocurrió un error al filtrar los datos', 'error')
        }
    }

    const handleInputChange = (e) => {
        setSearchText(e.target.value);
    }

    const handleInputKeyDown = (e) => {
        if(e.key === 'Enter'){
            handleBuscarClick();
        }
    }

    const handleEditarClick = (id) => {
        navigate(`/admin-producto/editar/${id}`);
    }

    const handleEliminarClick = async (id) => {
        if(window.confirm("¿Estás seguro de eliminar este producto?")){
            try{
                const response = await sendRequest(`/api/productos/${id}`, 'DELETE')
                if (!response) {
                    addToast('No se pudo eliminar el producto', 'error')
                    return
                }
                setProductos(prev => prev.filter(producto => producto.asin !== id))
                setTotal(prev => Math.max(0, prev - 1))
                setImagenes(prev => {
                    const restantes = { ...prev }
                    delete restantes[id]
                    return restantes
                })
                addToast('Producto eliminado exitosamente', 'success')
            }catch(err){
                addToast('Ocurrió un error al eliminar el producto', 'error')
            }
        }
    }


    return {
        productos,
        imagenes,
        total,
        page,
        handleBtnNuevo,
        handleBuscarClick,
        handleInputChange,
        handleInputKeyDown,
        handleEditarClick,
        handleEliminarClick,
        searchText,
        error,
        state
    }
}
