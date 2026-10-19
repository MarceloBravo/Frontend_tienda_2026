import { useContext, useEffect, useState } from 'react';
import { useProducts } from '../../contexts/ProductContext';
import { useLocation } from 'react-router';
import AuthContext from '../../contexts/AuthContext';

export const useMenuComponent = () => {
  const { logout } = useContext(AuthContext);
  const { state, getAllProducts, getFavoritosCount } = useProducts();
  const { userSession } = useContext(AuthContext)
  const [ searchText, setSearchText ] = useState(localStorage.getItem('filter') || '');
  const [ favoritos, setFavoritos ] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  

  useEffect(()=> {
    const checkFavoritos = () => {
      const fav = localStorage.getItem('favoritos')
      if(fav){
        try {
          const parsed = JSON.parse(fav)
          setFavoritos(Array.isArray(parsed) ? parsed.length : 0)
        } catch {
          setFavoritos(0)
        }
      }
    }
    checkFavoritos()
    window.addEventListener('storage', checkFavoritos)
    return () => window.removeEventListener('storage', checkFavoritos)
  },[])
  
  useEffect(()=> {
    setFavoritos(getFavoritosCount() || 0)
  },[getFavoritosCount])

  
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBtnBuscarClick();
    }
  };

  
  const handleBtnBuscarClick = async () => {
    try{
      await getAllProducts(searchText);
    }catch(error){
      console.error('Error loading products:', error);
    }    
  }


  const endSession = async () => {
    try{
      await logout()
    }catch(error){
      console.error('Error loading products:', error);
    }    
  }


  return {
    isScrolled,
    searchText,
    handleSearchChange,
    handleKeyDown,
    handleBtnBuscarClick,
    favoritos,
    state,
    location,
    userSession,
    endSession
  }
}