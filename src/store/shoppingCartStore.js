import { create } from "zustand";

export const useShoppingCartStore = create((set) => ({
    products:[],

    addProduct:(productId, cant) => {
        set(state =>  {
            state.products.map(item => {
                if(item.productId === productId){
                    return {...item, cant: item.cant + cant};
                }
                return item;
            });
        })
    },

    reemoveProduct:(productId) => {
        set(state => {
            return state.products.filter(prod => prod.productId !== productId);
        });
    },

    findProduct:(productId) => {
        set(state => {
            return state.products.find(prod => prod.productId === productId);
        });
    },

}));