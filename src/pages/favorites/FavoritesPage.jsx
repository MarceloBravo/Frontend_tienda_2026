
import { useFavoritesPage } from "./useFavoritesPage";

import styles from './FavoritesPage.module.css'

export const FavoritePage = () => {
    const  {
        arrFavoritos,
        addItemToCart,
        removeFromFavorites
    } =useFavoritesPage(); 
    

    return (
        <div className={styles.container}>
            <h1>Listado de Favoritos</h1>
            <div className={styles.tabla}>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Precio</th>
                            <th>Foto</th>
                            <th>Agregar al carrito</th>
                            <th>Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {arrFavoritos.length === 0 && <tr><td colSpan="6" className={`${styles.noFavorites}`}>Sin favoritos que mostrar</td></tr>}
                    {arrFavoritos && arrFavoritos.map((item, key) => 
                        <tr key={item.asin ?? key}>
                            <td>{item.asin}</td>
                            <td>{item.product_title}</td>
                            <td>$ {item.product_price}</td>
                            <td><img src={item.product_photo} style={{width: '60px', height: 'auto', borderRadius: '4px'}} ></img></td>
                            <td><button type="button" onClick={() => addItemToCart(item.asin)}>🛒</button></td>
                            <td><button type="button" onClick={() => removeFromFavorites(item.asin)}>✖️</button></td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}