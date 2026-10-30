import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { useProductStore } from '../../store/productStore';

export const useHomePage = () => {
    const products = useProductStore((state) => state.products);
    const loading = useProductStore((state) => state.loading);
    const error = useProductStore((state) => state.error);
    const filter = useProductStore((state) => state.filter);
    const page = useProductStore((state) => state.page);
    const totalPages = useProductStore((state) => state.totalPages);
    const getAllProducts = useProductStore((state) => state.getAllProducts);
    const location = useLocation();
    const productsList = products ?? [];

    useEffect(() => {
        const getAll = async () => {
            try {
                await getAllProducts();
            } catch (error) {
                console.error('Error loading products:', error);
            }
        }
        
        getAll();
    }, [location.pathname, getAllProducts]);

    const handlePageChange = async (nextPage) => {
        try {
            await getAllProducts(filter, nextPage);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }


    return {
        loading,
        error,
        productsList,
        filter,
        page,
        totalPages,
        handlePageChange
    };

}