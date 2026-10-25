import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useHttp } from '../../../hooks/useHttp';
import { cargarImagen } from '../../../utils/images';
import { normalizeProductsResponse } from '../../../utils/apiResponse';
import { buildProductsQuery } from '../../../utils/productsQuery';
import { useToastStore } from '../../../store/toastStore';
import { useModalStore } from '../../../store/modalStore';

export const useMantenedorProductoListPage = () => {
    const { sendRequest } = useHttp();
    const [ productos, setProductos ] = useState([]);
    const [ imagenes, setImagenes ] = useState({})
    const [ total, setTotal ] = useState(0);
    const [ totalPages, setTotalPages ] = useState(0);
    const [ page, setPage ] = useState(1);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ searchText, setSearchText ] = useState('');
    const [ error, setError ] = useState(null);
    const addToast = useToastStore(store => store.addToast);
    const navigate = useNavigate();
    const [ id, setId ] = useState(null);
    const showModal = useModalStore(store => store.showModal)
    const responseModal = useModalStore(store => store.responseModal)
    const setResponse = useModalStore(store => store.setResponse)

    const cargarProductos = async (pageToLoad = 1, search = '') => {
        setIsLoading(true);
        try {
            const response = await sendRequest(`/api/productos${buildProductsQuery({ search, page: pageToLoad })}`);
            const {
                products: productosData,
                total: totalProductos,
                totalPages: totalPaginas,
                page: paginaActual,
            } = normalizeProductsResponse(response);
            console.log('response',response, 'totalPaginas',totalPaginas);

            setProductos(productosData);
            setTotal(totalProductos);
            setTotalPages(totalPaginas);
            setPage(paginaActual ?? pageToLoad);

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
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(()=> {
        const obtenerProductos = async () => {
            setError(null);
            try {
                await cargarProductos(1, '');
            } catch (error) {
                setError('Ocurrió un error al cargar los productos');
                console.error('Error loading products:', error);
            }
        }

        obtenerProductos();
        // eslint-disable-next-line
    },[])

    useEffect(()=>{
        if(responseModal !== true || !id) return;
        setResponse(null);
        const deleteProduct = async () => {
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

        deleteProduct();
        // eslint-disable-next-line
    },[responseModal, id, addToast]);

    const handleBtnNuevo = () => {
        navigate('/admin-producto/nuevo');
    }

    const handleBuscarClick = async (e) => {
        try{
            setError(null);
            await cargarProductos(1, searchText.trim());
        }catch(error){
            addToast('Ocurrió un error al filtrar los datos', 'error')
        }
    }

    const handlePageChange = async (pageToLoad) => {
        try{
            setError(null);
            await cargarProductos(pageToLoad, searchText.trim());
        }catch(error){
            addToast('Ocurrió un error al cargar los productos', 'error')
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
        setId(id);
        showModal('Eliminar','¿Está seguro de eliminar el producto?', 'delete'); //La respuesta se maneja en el useEffect que monitorea responseModal
    }


    return {
        productos,
        imagenes,
        total,
        totalPages,
        page,
        isLoading,
        handleBtnNuevo,
        handleBuscarClick,
        handlePageChange,
        handleInputChange,
        handleInputKeyDown,
        handleEditarClick,
        handleEliminarClick,
        searchText,
        error
    }
}
