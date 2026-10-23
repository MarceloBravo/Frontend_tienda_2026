import { useShoppingCartComponent } from './useShoppingCartComponent';

import styles from './ShoppingCartComponent.module.css';

export const ShoppingCartComponent = () => {
    const {
        products,
        isOpen,
        closeCart,
        addToCart,
        decrementProduct,
        continueShoppingHandleClic,
        CheckoutHandleClic,
    } = useShoppingCartComponent();

    return (
        <>
            <div 
                className={`${styles.modalBackground} ${isOpen ? styles.open : styles.closed} `}
                onClick={closeCart}>
            </div>
            <aside
                className={`${styles.cart} ${isOpen ? styles.open : styles.closed}`}
                role="dialog"
                aria-label="Carrito de compras"
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <div className={styles.header}>
                    <h2 className={styles.title}>Carrito de compras</h2>
                    <button
                        type="button"
                        className={styles.closeButton}
                        onClick={closeCart}
                        aria-label="Cerrar carrito"
                    >
                        &times;
                    </button>
                </div>

                <div className={styles.content}>
                    {products.length === 0 ? (
                        <p className={styles.empty}>El carrito está vacío</p>
                    ) : (
                        <ul className={styles.list}>
                            {products.map((product) => {
                                const productName = product.name || product.productId;

                                return (
                                    <li key={product.productId} className={styles.item}>
                                        <span className={styles.name} title={productName}>
                                            {productName}
                                        </span>
                                        <div className={styles.controls}>
                                            <button
                                                type="button"
                                                className={styles.controlButton}
                                                onClick={() => decrementProduct(product.productId)}
                                                aria-label={`Disminuir ${productName}`}
                                            >
                                                &minus;
                                            </button>
                                            <span
                                                className={styles.quantity}
                                                aria-label={`Cantidad de ${productName}`}
                                            >
                                                {product.cant}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.controlButton}
                                                onClick={() =>
                                                    addToCart(product.productId, 1, product.name)
                                                }
                                                aria-label={`Agregar ${productName}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className={`${styles.buttonsContainer}`}>
                    <button className={`btn ${styles.btnPrimary}`} onClick={CheckoutHandleClic}>Pagar</button>
                    <button className={`btn ${styles.buttonShopping}`}onClick={continueShoppingHandleClic}>Continuar comprando</button>
                </div>
            </aside>
        </>
    );
};
