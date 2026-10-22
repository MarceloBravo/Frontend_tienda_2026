
import { useShoppingCartComponent } from './useShoppingCartComponent';
import { useShoppingCartStore } from '../../store/shoppingCartStore';

import styles from './shoppingCartComponent.module.css'

export const shoppingCartComponent = () => {
    const products = useShoppingCartStore(store => store.products);
    const reemoveProduct = useShoppingCartStore(store => store.reemoveProduct);

    

}