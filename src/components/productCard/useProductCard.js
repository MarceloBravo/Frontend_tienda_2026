import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useProducts } from '../../contexts/ProductContext';
import { cargarImagen } from '../../utils/images';


export const useProductCard = ({...data}) => {
    const { asin, product_photo, product_title, product_star_rating, product_num_ratings, product_price} = data
    const titles = product_title.split('|')
    const [isFavorite, setIsFavorite] = useState(false);
    const { setContadorFavoritos } = useProducts();
    const [ urlImagen, setUrlImagen ] = useState()
    const navigate = useNavigate();

    useEffect(() => {
        const cargarFoto = async () => {
            try{
                const url = await cargarImagen(product_photo);
                setUrlImagen(url);
            }catch(error){
                console.error(error)
            }
        }
        cargarFoto();
        // eslint-disable-next-line
    },[])


    useEffect(()=> {
        const syncFavorites = () => {
            const strFavoritos = localStorage.getItem('favoritos');
            if(strFavoritos){
                const favoritosArray = JSON.parse(strFavoritos);
                const exists = favoritosArray.findIndex(p => p.asin === asin) !== -1;
                setIsFavorite(exists);
            }
        }
        syncFavorites();
        window.addEventListener("storage", syncFavorites);
        return () => window.removeEventListener("storage", syncFavorites);
        // eslint-disable-next-line
    }, [])

    
    const toggleFavorite = (e) => {
        e.stopPropagation(); // Prevents the click from bubbling up to the card
        const newStateIsFavorite = !isFavorite;
        setIsFavorite(newStateIsFavorite);

        const favoritos = localStorage.getItem('favoritos');
        if (!favoritos) {
            const item = {asin, product_title, product_star_rating, product_num_ratings, product_price}
            localStorage.setItem('favoritos', JSON.stringify([item]));
        } else {
            actualizarFavoritos(favoritos, newStateIsFavorite);
        }

    }
    
    const actualizarFavoritos = (favoritos, isFavorite) => {
        const favoritosArray = JSON.parse(favoritos);
        if (isFavorite) {   //Agregar
            const item = {asin, product_title, product_star_rating, product_num_ratings, product_price}
            favoritosArray.push(item);
        } else {    //Eliminar
            const index = favoritosArray.findIndex(p => p.asin === asin);
            if (index !== -1) {
                favoritosArray.splice(index, 1);
            }
        }
        setContadorFavoritos(favoritosArray.length);
        localStorage.setItem('favoritos', JSON.stringify(favoritosArray));
    }
    
    const handleProdictoClick = () => {
        navigate(`/detalle-producto/${asin}`);
    }

    return {
        asin,
        titles,
        urlImagen, 
        product_star_rating, 
        product_num_ratings, 
        product_price,
        isFavorite,
        toggleFavorite,
        handleProdictoClick
    }
}