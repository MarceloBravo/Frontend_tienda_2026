import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useHttp } from '../../../hooks/useHttp'
import { cargarImagen } from '../../../utils/images'
import { normalizeProductResponse } from '../../../utils/apiResponse'
import { getMantenedorProductoFormSchema } from './MantenedorProductoFormSchema'
import imgDefault from '../../../assets/imagen_foto.png'
import imageCompression from 'browser-image-compression'
import { useToastStore } from '../../../store/toastStore'
import { useModalStore } from '../../../store/modalStore'

export const useMantenedorProductoFormPage = () => {    
    const { error, sendRequest }= useHttp()
    const inputRef = useRef()
    const [ formData, setFormData ] = useState({
        asin: '',
        currency: '',
        climate_pledge_friendly: false,
        is_amazon_choice: false,
        is_best_seller: false,
        product_num_ratings: 0,
        product_original_price: 0,
        product_photo: null,
        product_photo_file: null,
        product_price: 0,
        product_star_rating: 0,
        product_title: '',
        sales_volume: ''
    })
    const showModal = useModalStore(store => store.showModal)
    const responseModal = useModalStore(store => store.responseModal)
    const setResponse = useModalStore(store => store.setResponse)
    const [ modalAction, setModalAction ] = useState(null);
    const [ validationErrors, setValidationErrors ] = useState({})
    const [ uploadProgress, setUploadProgress ] = useState(0)
    const [ isLoadingProduct, setIsLoadingProduct ] = useState(false)
    const addToast = useToastStore(store => store.addToast);
    const navigate = useNavigate()
    const params = useParams()
    const id = params.id

    const runValidation = (formDataToValidate, fieldName = null) => {
        const schema = getMantenedorProductoFormSchema(!!id);
        const result = schema.safeParse(formDataToValidate);

        if (result.success) {
            setValidationErrors({}); // Form is valid, clear all errors.
            return true;
        }

        const errors = result.error.format();
        if (fieldName) {
            // We are validating a single field on change.
            // Only update the error for that field.
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: errors[fieldName],
            }));
        } else {
            // We are validating the whole form on submit.
            setValidationErrors(errors);
        }
        return false;
    }

    useEffect(()=> {
        if(id){
            const cargarProducto = async () => {
                setIsLoadingProduct(true);
                try{
                    const response = await sendRequest('/api/productos/' + id)
                    const { product } = normalizeProductResponse(response)
                    if(!product){
                        throw new Error('No se encontró el producto solicitado')
                    }
                    const urlFoto = await cargarImagen(product.product_photo)
                    setFormData(prev => ({
                        ...prev,
                        ...product,
                        product_photo: urlFoto,
                        climate_pledge_friendly: Boolean(product.climate_pledge_friendly),
                        is_amazon_choice: Boolean(product.is_amazon_choice),
                        is_best_seller: Boolean(product.is_best_seller)
                    }))
                }catch(error){
                    addToast('Ocurrió un error al cargar el producto', 'error');
                }finally{
                    setIsLoadingProduct(false);
                }
            }
            cargarProducto()
        }
        // eslint-disable-next-line
    },[id])


    useEffect(() => {
        if(error){
            addToast('Ocurrió un error', 'error');
        }
        // eslint-disable-next-line
    },[error])

    useEffect(()=>{
        if(responseModal !== true) return;

        if(modalAction === "save"){
            setResponse(null);
            if(id){
                handleActualizar()
            }else{
                handleGrabarNuevo()
            }
            return;
        }

        if(modalAction === "delete"){
            setResponse(null);
            handleEliminarProducto()
        }
        // eslint-disable-next-line
    },[responseModal]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value
        };
        setFormData(newFormData);
        runValidation(newFormData, name);
    }

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        const newFormData = {
            ...formData,
            [name]: checked
        };
        setFormData(newFormData);
        runValidation(newFormData, name);
    }

    const handleInputNumberChange = (e) => {
        const { name, value } = e.target;
        const newFormData = {
            ...formData,
            [name]: value
        };
        setFormData(newFormData);
        runValidation(newFormData, name);
    }

    const handleCancelarClick = () => {
        navigate('/admin-producto')
    }

    const handleGrabarClick = async () => {
        if (!runValidation(formData)) {
            addToast('Los datos ingresados no son válidos o están incompletos', 'error');
            return;
        }
        setModalAction("save");
        showModal('Grabar','¿Está seguro de guardar los datos?', 'confirm'); //La respuesta se maneja en el useEffect que monitorea responseModal
    }

    const handleGrabarNuevo = async () => {
        try{
            setUploadProgress(0);
            const fd = new FormData()
            Object.keys(formData).forEach(key => {
                if (key === 'product_photo_file' && formData[key]) {
                    const file = formData[key];
                    const fileName = file.name || 'image.png';
                    fd.append('product_photo', file, fileName);
                } else if (key !== 'product_photo' && key !== 'product_photo_file') {
                    if (['climate_pledge_friendly', 'is_amazon_choice', 'is_best_seller'].includes(key)) {
                        fd.append(key, formData[key] ? "true" : "false");
                    } else {
                        fd.append(key, formData[key])
                    }
                }
            })
            
            const config = {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            await sendRequest('/api/productos', 'POST', fd, config)
            addToast('Producto guardado correctamente', 'success')
            navigate('/admin-producto')
        }catch(error){
            addToast('Ocurrió un error al guardar el producto', 'error')
        }
    }

    const handleActualizar = async () => {
        try{
            setUploadProgress(0);
            const fd = new FormData()
            Object.keys(formData).forEach(key => {
                if (key === 'product_photo_file' && formData[key]) {
                    const file = formData[key];
                    const fileName = file.name || 'image.png';
                    fd.append('product_photo', file, fileName);
                } else if (key !== 'product_photo' && key !== 'product_photo_file') {
                    if (['climate_pledge_friendly', 'is_amazon_choice', 'is_best_seller'].includes(key)) {
                        fd.append(key, formData[key] ? "true" : "false");
                    } else {
                        fd.append(key, formData[key])
                    }
                }
            })

            const config = {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            await sendRequest('/api/productos/' + id, 'PUT', fd, config)
            addToast('Producto actualizado correctamente', 'success')
            navigate('/admin-producto')
        }catch(error){
            addToast('Ocurrió un error al actualizar el producto', 'error')
        }
    }
    
    const handleEliminarProducto = async () => {
        try{
            await sendRequest('/api/productos/' + id, 'DELETE')
            addToast('Producto eliminado correctamente', 'success')
            navigate('/admin-producto')
        }catch(error){
            addToast('Ocurrió un error al eliminar el producto', 'error')
        }
    }

    const handlerEliminarClick = async () => {
        setModalAction("delete");
        showModal('Eliminar','¿Está seguro de eliminar el producto?', 'delete'); //La respuesta se maneja en el useEffect que monitorea responseModal
    }

    const handleCargarImagenClick = () => {
        inputRef.current.click()
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.type !== 'image/png') {
                addToast('Solo se permiten imágenes PNG', 'error')
                return
            }

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            }

            try {
                const compressedFile = await imageCompression(file, options);
                
                const reader = new FileReader()
                reader.onload = () => {
                    const newFormData = {
                        ...formData,
                        product_photo: reader.result,
                        product_photo_file: compressedFile
                    };
                    setFormData(newFormData)
                    runValidation(newFormData, 'product_photo_file');
                }
                reader.readAsDataURL(compressedFile)

            } catch (error) {
                addToast('Ocurrió un error al comprimir la imagen.', 'error')
                console.error(error);
            }
        }
    }



  return {
    id,
    formData,
    validationErrors,
    uploadProgress,
    isLoadingProduct,
    handleInputChange,
    handleCheckboxChange,
    handleInputNumberChange,
    handleCancelarClick,
    handleGrabarClick,
    handleCargarImagenClick,
    handleFileChange,
    handlerEliminarClick,
    imgDefault,
    inputRef
  }
}