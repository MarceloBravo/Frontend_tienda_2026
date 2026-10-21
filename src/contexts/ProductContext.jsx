import { createContext, useReducer, useEffect, useContext } from 'react';
import { useHttp } from '../hooks/useHttp';
import {
    normalizeProductResponse,
    normalizeProductsResponse,
    isSuccessfulStatus,
    API_ERROR_MESSAGE,
} from '../utils/apiResponse';

// Acción para el reducer
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en ms

// Estado inicial
const initialState = {
  productsCache: {}, // Cache para listados: { [asin]: { data: product, timestamp } }
  productDetailCache: {}, // Cache para detalles: { [asin]: { data: productDetail, timestamp } }
  products: [], // Lista actual de productos
  total: 0, // Total de productos reportados por la API (totProd)
  page: 1, // Página actual reportada por la API
  status: null, // Estado devuelto por la API ("success")
  loading: false,
  error: null,
  filter: null,
  favoritos: () => {
    const fav = localStorage.getItem('favoritos')
    if(fav){
      return JSON.parse(fav).length;
    }else{
      return 0
    }
  }
};



// Contexto
const ProductContext = createContext();

const isCacheEntryValid = (entry) =>
    !!entry && typeof entry.timestamp === 'number' && !!entry.data;

// Reducer para manejar acciones
function productReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CACHE_PRODUCT_LIST':
      // Cachea productos del listado (array de productos)
      const productsToCache = action.payload?.products;
      if (!Array.isArray(productsToCache)) {
        return { ...state, loading: false };
      }
      const updatedProductsCache = { ...state.productsCache };
      productsToCache.forEach(product => {
        if (!product?.asin) return;
        updatedProductsCache[product.asin] = {
          data: product,
          timestamp: Date.now(),
        };
      });
      localStorage.setItem('productListCache', JSON.stringify(updatedProductsCache));
      return { ...state, productsCache: updatedProductsCache, loading: false };
    case 'CACHE_PRODUCT_DETAIL':
      // Cachea detalle de un producto
      const productToCache = action.payload?.product;
      if (!productToCache?.asin) {
        return { ...state, loading: false };
      }
      const updatedDetailCache = {
        ...state.productDetailCache,
        [productToCache.asin]: {
          data: productToCache,
          timestamp: Date.now(),
        },
      };
      localStorage.setItem('productDetailCache', JSON.stringify(updatedDetailCache));
      return { ...state, productDetailCache: updatedDetailCache, loading: false };
    case 'CLEAR_EXPIRED_CACHE':
      // Limpia entradas expiradas en ambos caches
      const now = Date.now();
      const filteredProductsCache = Object.fromEntries(
        Object.entries(state.productsCache).filter(
          ([, entry]) => isCacheEntryValid(entry) && now - entry.timestamp < CACHE_TTL
        )
      );
      const filteredDetailCache = Object.fromEntries(
        Object.entries(state.productDetailCache).filter(
          ([, entry]) => isCacheEntryValid(entry) && now - entry.timestamp < CACHE_TTL
        )
      );
      localStorage.setItem('productListCache', JSON.stringify(filteredProductsCache));
      localStorage.setItem('productDetailCache', JSON.stringify(filteredDetailCache));
      return { ...state, productsCache: filteredProductsCache, productDetailCache: filteredDetailCache };
    case 'LOAD_CACHE_FROM_STORAGE':
      // Carga desde localStorage al inicializar
      const storedListCache = JSON.parse(localStorage.getItem('productListCache') || '{}');
      const storedDetailCache = JSON.parse(localStorage.getItem('productDetailCache') || '{}');
      return { ...state, productsCache: storedListCache, productDetailCache: storedDetailCache };
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: Array.isArray(action.payload?.products) ? action.payload.products : [],
        total: action.payload?.total ?? 0,
        page: action.payload?.page ?? 1,
        status: action.payload?.status ?? null,
        loading: false,
      };
    case 'CACHE_FILTER':
      const filter = action.payload.filter;
      localStorage.setItem(`filter`, filter || '');
      return { ...state, filter };
    case 'SET_FAVORITOS':
      return { ...state, favoritos: action.payload.favoritos };
    default:
      return state;
  }
}

// Provider
export function ProductProvider({ children }) {
  const [ state, dispatch ] = useReducer(productReducer, initialState);
  const { sendRequest } = useHttp();

  // Carga cache desde localStorage al montar
  useEffect(() => {
    dispatch({ type: 'LOAD_CACHE_FROM_STORAGE' });
  }, []);

  // Función para obtener un producto (detalle, con cache)
  const getProduct = async (productId) => {
    dispatch({ type: 'CLEAR_EXPIRED_CACHE' }); // Limpia expirados primero

    const cached = state.productDetailCache[productId];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data; // Usa cache si no expiró
    }

    // Si no está en cache o expiró, fetch desde API
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await sendRequest(`/api/productos/${productId}`, 'GET');
      const { status, product } = normalizeProductResponse(response);
      if (!isSuccessfulStatus(status)) {
        throw new Error(API_ERROR_MESSAGE);
      }
      dispatch({ type: 'CACHE_PRODUCT_DETAIL', payload: { product } });
      return product;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  // Función para obtener todos los productos (listado, con cache)
  const getAllProducts = async (searchParams) => {
    dispatch({ type: 'CLEAR_EXPIRED_CACHE' }); // Limpia expirados primero

    // Verifica si hay productos en cache (al menos algunos)
    const cachedProducts = Object.values(state.productsCache).filter(isCacheEntryValid);
    if (cachedProducts.length > 0 && cachedProducts.every(p => Date.now() - p.timestamp < CACHE_TTL)) {
      const productsList = cachedProducts.map(p => p.data); // Retorna lista desde cache
      const cachedPayload = {
        products: productsList,
        total: productsList.length,
        page: 1,
        status: 'success',
      };
      dispatch({ type: 'SET_PRODUCTS', payload: cachedPayload });
      return cachedPayload;
    }

    searchParams = searchParams ?? state.filter;
    const search = searchParams  ? `?search=${searchParams}` :'';

    // Si no hay cache válido, fetch desde API
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await sendRequest('/api/productos' + search, 'GET');
      const { status, products, total, page } = normalizeProductsResponse(response);
      if (!isSuccessfulStatus(status)) {
        throw new Error(API_ERROR_MESSAGE);
      }
      dispatch({ type: 'CACHE_FILTER', payload: { filter: searchParams || '' } });
      dispatch({ type: 'CACHE_PRODUCT_LIST', payload: { products } });
      dispatch({ type: 'SET_PRODUCTS', payload: { products, total, page, status } });
      return { products, total, page, status };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  };

  const setContadorFavoritos = (totFavoritos = 0) => {
    dispatch({ type: 'SET_FAVORITOS', payload: { favoritos: totFavoritos } });
  }

  const getFavoritosCount = () => {
    return state.favoritos;
  }

  // Función para limpiar cache manualmente (opcional)
  const clearCache = () => {
    localStorage.removeItem('productListCache');
    localStorage.removeItem('productDetailCache');
    dispatch({ type: 'CLEAR_EXPIRED_CACHE' });
  };

  return (
    <ProductContext.Provider value={{ state, getProduct, getAllProducts, clearCache, setContadorFavoritos, getFavoritosCount}}>
      {children}
    </ProductContext.Provider>
  );
}

// Hook para usar el contexto
export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts debe usarse dentro de un ProductProvider');
  }
  return context;
}
