import { useEffect, useState } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { SpinnerComponent } from '../../../components/spinner/SpinnerComponent';
import { useNavigate } from 'react-router';
import { useHttp } from '../../../hooks/useHttp';
import { cargarImagen } from '../../../utils/images';

export const useMantenedorProductoListPage = () => {
    const { sendRequest } = useHttp();
    const { state, getAllProducts} = useProducts();
    const [ productos, setProductos ] = useState([]);
    const [ imagenes, setImagenes ] = useState({})
    const [ searchText, setSearchText ] = useState('');
    const navigate = useNavigate();


    useEffect(()=> {
        const obtenerProductos = async () => {
            try {
                const response = await getAllProducts();
                console.log(response.data);
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
            const response = await sendRequest(`/api/productos${search}`);
            setProductos(response.data);
        }catch(error){
            alert('Ocurrió un error al filtrar los datos')
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
                    alert('No se pudo eliminar el producto')
                    return
                }
                setProductos(prev => prev.filter(producto => producto.asin !== id))
                setImagenes(prev => {
                    const restantes = { ...prev }
                    delete restantes[id]
                    return restantes
                })
                alert('Producto eliminado exitosamente')
            }catch(err){
                alert(err.message)
            }
        }
    }


    if(state.isLoading) return <SpinnerComponent/>

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
        state
    }
}