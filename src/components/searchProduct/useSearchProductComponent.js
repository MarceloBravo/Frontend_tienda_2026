import { useState } from "react";
import { useProductStore } from "../../store/productStore";

export const useSearchProductComponent = () => {
    const getAllProducts = useProductStore((state) => state.getAllProducts);
    const [ searchText, setSearchText ] = useState(localStorage.getItem('filter') || '');


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

    return {
        searchText, 
        handleSearchChange,
        handleKeyDown,
        handleBtnBuscarClick
    };
}