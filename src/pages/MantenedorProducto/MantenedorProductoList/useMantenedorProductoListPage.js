import { useEffect, useState } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNavigate } from 'react-router';
import { useHttp } from '../../../hooks/useHttp';
import { cargarImagen } from '../../../utils/images';
import { useToastStore } from '../../../store/toastStore';

export const useMantenedorProductoListPage = () => {
    const { sendRequest } = useHttp();
    const { state, getAllProducts} = useProducts();
    const [ productos, setProductos ] = useState([]);
    const [ imagenes, setImagenes ] = useState({})
    const [ searchText, setSearchText ] = useState('');
    const [ error, setError ] = useState(null);
    const addToast = useToastStore(store => store.addToast);
    const navigate = useNavigate();


    useEffect(()=> {
        const obtenerProductos = async () => {
            setError(null);
            try {
                const response = await getAllProducts();
                const productosData = response?.data || [];
                setProductos(productosData);

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
            setProductos(response.data);
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