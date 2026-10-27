import { useCheckoutPage } from './useCheckoutPage';
import styles from './CheckoutPage.module.css';
import redcompraImg from '../../assets/redcompra.png';
import webpayImg from '../../assets/paypal.png';

export const CheckoutPage = () => {
    const {
        items,
        total,
        paymentMethod,
        selectPayment,
        incrementProduct,
        decrement,
        canPay,
        handlePay,
    } = useCheckoutPage();

    const formatPrice = (value) => {
        const num = Number(value) || 0;
        return num.toLocaleString('es-CL');
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <section className={styles.productsSection}>
                        <h2 className={styles.sectionTitle}>Resumen de productos</h2>
                        <div className={styles.tableWrapper}>
                            <table className={styles.productsTable}>
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio unitario</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.productId}>
                                            <td className={styles.productCell}>
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className={styles.productImage}
                                                    />
                                                ) : (
                                                    <div className={styles.productImagePlaceholder} />
                                                )}
                                                <span className={styles.productName} title={item.name}>
                                                    {item.name}
                                                </span>
                                            </td>
                                            <td className={styles.priceCell}>{formatPrice(item.unitPrice)}</td>
                                            <td className={styles.quantityCell}>
                                                <div className={styles.quantityControls}>
                                                    <button
                                                        type="button"
                                                        className={styles.qtyButton}
                                                        onClick={() => decrement(item.productId)}
                                                        aria-label={`Disminuir ${item.name}`}
                                                    >
                                                        -
                                                    </button>
                                                    <span className={styles.qtyValue}>{item.cant}</span>
                                                    <button
                                                        type="button"
                                                        className={styles.qtyButton}
                                                        onClick={() => incrementProduct(item.productId)}
                                                        aria-label={`Incrementar ${item.name}`}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td className={styles.subtotalCell}>{formatPrice(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className={styles.paymentSection}>
                        <h2 className={styles.sectionTitle}>Forma de pago</h2>
                        <div className={styles.paymentOptions}>
                            <label className={`${styles.paymentOption} ${paymentMethod === 'redcompra' ? styles.selected : ''}`}>
                                <input
                                    type="checkbox"
                                    className={styles.hiddenCheckbox}
                                    checked={paymentMethod === 'redcompra'}
                                    onChange={() => selectPayment(paymentMethod === 'redcompra' ? null : 'redcompra')}
                                    aria-label="Redcompra"
                                />
                                <img src={redcompraImg} alt="Redcompra" className={styles.paymentImage} />
                            </label>
                            <label className={`${styles.paymentOption} ${paymentMethod === 'webpay' ? styles.selected : ''}`}>
                                <input
                                    type="checkbox"
                                    className={styles.hiddenCheckbox}
                                    checked={paymentMethod === 'webpay'}
                                    onChange={() => selectPayment(paymentMethod === 'webpay' ? null : 'webpay')}
                                    aria-label="Webpay"
                                />
                                <img src={webpayImg} alt="Webpay" className={styles.paymentImage} />
                            </label>
                        </div>
                    </section>
                </div>

                <aside className={styles.rightColumn}>
                    <section className={styles.summarySection}>
                        <h2 className={styles.sectionTitle}>Resumen de compra</h2>
                        <div className={styles.summaryRow}>
                            <span>Total</span>
                            <span className={styles.totalAmount}>{formatPrice(total)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Forma de pago</span>
                            <span className={styles.paymentName}>
                                {paymentMethod === 'redcompra' ? 'Redcompra' : paymentMethod === 'webpay' ? 'Webpay' : '-'}
                            </span>
                        </div>
                        <button
                            type="button"
                            className={styles.payButton}
                            disabled={!canPay}
                            onClick={handlePay}
                        >
                            Pagar
                        </button>
                    </section>
                </aside>
            </div>
        </div>
    );
};