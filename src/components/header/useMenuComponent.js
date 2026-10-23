import { useContext, useEffect, useState } from 'react';
import { useProductStore } from '../../store/productStore';
import { useLocation } from 'react-router';
import AuthContext from '../../contexts/AuthContext';
import { useShoppingCartStore } from '../../store/shoppingCartStore';

export const useMenuComponent = () => {
  const { logout } = useContext(AuthContext);
  const favoritos = useProductStore((state) => state.favoritos);
  const loading = useProductStore((state) => state.loading);
  const getAllProducts = useProductStore((state) => state.getAllProducts);
  const setContadorFavoritos = useProductStore((state) => state.setContadorFavoritos);
  const { userSession } = useContext(AuthContext)
  const [ searchText, setSearchText ] = useState(localStorage.getItem('filter') || '');
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const openCart = useShoppingCartStore(state => state.openCart);  
  const countProductsInCart = useShoppingCartStore(state => state.productsInCart);

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
          setContadorFavoritos(Array.isArray(parsed) ? parsed.length : 0)
        } catch {
          setContadorFavoritos(0)
        }
      } else {
        setContadorFavoritos(0)
      }
    }
    checkFavoritos()
    window.addEventListener('storage', checkFavoritos)
    return () => window.removeEventListener('storage', checkFavoritos)
  },[setContadorFavoritos])

  
  
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
    loading,
    location,
    userSession,
    endSession,
    openCart,
    countProductsInCart
  }
}