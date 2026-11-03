import { useCheckoutPage } from './useCheckoutPage';
import { AccordionComponent } from '../../components/accordion/AccordionComponent';
import { ShippingForm } from './ShippingForm';
import styles from './CheckoutPage.module.css';

export const CheckoutPage = () => {
    const {
        items,
        total,
        openSection,
        toggleSection,
        shipping,
        shippingErrors,
        handleShippingChange,
        shippingComplete,
        incrementProduct,
        decrement,
        canPay,
        isProcessing,
        payError,
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
                    <AccordionComponent
                        id="products"
                        title="Resumen de productos"
                        subtitle={`${items.length} producto(s)`}
                        isOpen={openSection === 'products'}
                        onToggle={() => toggleSection('products')}
                    >
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

                        <button
                            type="button"
                            className={styles.continueButton}
                            onClick={() => toggleSection('shipping')}
                        >
                            Continuar con datos de envío
                        </button>
                    </AccordionComponent>

                    <AccordionComponent
                        id="shipping"
                        title="Datos de envío"
                        subtitle={shippingComplete ? 'Completado' : 'Pendiente'}
                        isOpen={openSection === 'shipping'}
                        onToggle={() => toggleSection('shipping')}
                    >
                        <ShippingForm
                            values={shipping}
                            errors={shippingErrors}
                            onChange={handleShippingChange}
                        />
                    </AccordionComponent>
                </div>

                <aside className={styles.rightColumn}>
                    <section className={styles.summarySection}>
                        <h2 className={styles.sectionTitle}>Resumen de compra</h2>
                        <div className={styles.summaryRow}>
                            <span>Total</span>
                            <span className={styles.totalAmount}>{`$ `+ formatPrice(total)}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span>Medio de pago</span>
                            <span className={styles.paymentName}>Webpay Plus (débito o crédito)</span>
                        </div>
                        {payError && (
                            <p className={styles.payError} role="alert">
                                {payError}
                            </p>
                        )}
                        <button
                            type="button"
                            className={styles.payButton}
                            disabled={!canPay}
                            onClick={handlePay}
                        >
                            {isProcessing ? 'Redirigiendo a Webpay…' : 'Pagar con Webpay Plus'}
                        </button>
                        {!shippingComplete && (
                            <p className={styles.helperText}>
                                Completa los datos de envío para continuar.
                            </p>
                        )}
                        {shippingComplete && total <= 0 && (
                            <p className={styles.helperText} role="alert">
                                No pudimos calcular el total. Revisa tu carrito e intenta nuevamente.
                            </p>
                        )}
                    </section>
                    <section className={styles.cardInfoSection}>
                        <h2 className={styles.sectionTitle}>Información acerca de la tarjeta</h2>
                        <p className={styles.cardInfoText}>
                            Para realizar el pago, debes ingresar los datos de una tarjeta de crédito o débito. Para probar el flujo de pago, puedes obtener datos de tarjetas de prueba proporcionados por Webpay en el siguiente enlace: <a rel="noreferrer" href="https://www.transbankdevelopers.cl/documentacion/como_empezar#tarjetas-de-prueba" target="_blank">Documentación de Webpay</a>. 
                        </p>
                        <p>
                            Luego de ingresar los datos de la tarjeta, WebPay solicitará un Rut y una contraseña de seguridad. Para completar el flujo de pago, puedes usar los siguientes datos de prueba: <br />
                            <strong>Rut:</strong> 11.111.111-1 <br />
                            <strong>Contraseña:</strong> 123
                        </p>
                        <p><b>Importante:</b> NO ingreses datos de una tarjeta real ya que la operación será rechazada.</p>
                    </section>
                </aside>
            </div>
        </div>
    );
};
