import { SpinnerComponent } from '../../../components/spinner/SpinnerComponent';
import { EmptyStateComponent } from '../../../components/emptyState/EmptyStateComponent';
import { useMantenedorProductoListPage } from './useMantenedorProductoListPage';

import styles from './MantenedorProductoListPage.module.css';

export const MantenedorProductoListPage = () => {
    const {
        productos,
        imagenes,
        total,
        page,
        handleBtnNuevo,
        handleBuscarClick,
        handleInputChange,
        handleInputKeyDown,
        handleEditarClick,
        handleEliminarClick,
        searchText, 
        error,
        state
    } = useMantenedorProductoListPage();

    if(state.isLoading) return <SpinnerComponent/>
    if(error) return <EmptyStateComponent message={error} />

    return (
        <div className={styles.container}>
            <h1>Mantenedor de Productos</h1>

            <div className={styles.searchContainer}>
                <button type="button" className={styles.btnSuccess} onClick={handleBtnNuevo}>Nuevo</button>
                <div className={styles.searchControls}>
                    <input 
                        type="text" 
                        className={styles.inputSearch} 
                        placeholder="Buscar producto..." 
                        value={searchText} 
                        onChange={handleInputChange}
                        onKeyDown={e => handleInputKeyDown(e)}
                    />
                    <button className={styles.btnBuscar} onClick={handleBuscarClick}>Buscar</button>
                </div>
            </div>

            <div className={styles.tabla}>
                <p>Total de productos: {total} — Página: {page}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Foto</th>
                            <th>Precio</th>
                            <th>Precio original</th>
                            <th>Es Amazón</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>

                        {(!productos || productos.length === 0) ? (
                            <tr>
                                <td colSpan={7}>
                                    <EmptyStateComponent message={searchText.trim().length > 0
                                        ? 'No se encontraron productos para tu búsqueda'
                                        : 'No hay productos registrados'} />
                                </td>
                            </tr>
                        ) : productos.map(producto => 
                            <tr key={producto.asin}>
                                <td>{producto.asin}</td>
                                <td className={styles.ellipsisn}>{producto.product_title}</td>
                                <td><img src={imagenes[producto.asin]} alt={producto.titles} style={{width: '60px', height: 'auto', borderRadius: '4px'}} /></td>
                                <td>{producto.currency ? `${producto.currency} ${producto.product_price}` : producto.product_price}</td>
                                <td>{producto.product_original_price ?? '—'}</td>
                                <td>{producto.is_amazon_choice == null ? '—' : (producto.is_amazon_choice ? 'Sí' : 'No')}</td>
                                <td>
                                    <button type="button" onClick={() => handleEditarClick(producto.asin)}>🖊️</button>
                                    <button type="button" onClick={() => handleEliminarClick(producto.asin)}>✖️</button>
                                </td>
                            </tr>
                        )}

                    </tbody>
                </table>
            </div>
        </div>
    )
}