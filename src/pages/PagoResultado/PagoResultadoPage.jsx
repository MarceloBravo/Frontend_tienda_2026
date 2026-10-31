import { Link } from 'react-router';
import { usePagoResultadoPage } from './usePagoResultadoPage';
import styles from './PagoResultadoPage.module.css';

const PAYMENT_TYPE_LABELS = {
    VD: 'Débito / Redcompra',
    VN: 'Crédito',
    VC: 'Crédito en cuotas',
    SI: 'Cuotas sin interés',
    S2: 'Cuotas sin interés',
    NC: 'Cuotas sin interés',
};

const formatPrice = (value) => {
    const num = Number(value) || 0;
    return num.toLocaleString('es-CL');
};

const formatCard = (detalle) => {
    const pago = detalle?.pago;
    const digits = pago?.card_detail?.card_number;
    const tipo = PAYMENT_TYPE_LABELS[pago?.payment_type_code] || 'Tarjeta';

    if (!digits) return tipo;
    return `${tipo} ···· ${digits}`;
};

const STATUS_CONTENT = {
    success: {
        title: 'Pago autorizado',
        message: 'Tu pago fue procesado correctamente. Recibirás tu pedido en la dirección indicada.',
        tone: 'success',
    },
    fail: {
        title: 'Pago rechazado',
        message: 'No se pudo completar el pago. Tu carrito se mantiene disponible para reintentar.',
        tone: 'error',
    },
    timeout: {
        title: 'Tiempo de pago agotado',
        message: 'La sesión de pago expiró. Puedes reintentar la compra cuando quieras.',
        tone: 'warning',
    },
};

export const PagoResultadoPage = () => {
    const { estado, buyOrder, ordenId, detalle } = usePagoResultadoPage();
    const content = STATUS_CONTENT[estado];

    if (!content) {
        return (
            <main className={styles.container}>
                <section className={`${styles.card} ${styles.warning}`}>
                    <h1 className={styles.title}>No encontramos el resultado del pago</h1>
                    <p className={styles.message}>
                        El enlace no es válido o la transacción no se completó.
                    </p>
                    <Link to="/" className={styles.primaryButton}>
                        Volver al inicio
                    </Link>
                </section>
            </main>
        );
    }

    const orden = detalle?.orden;
    const pago = detalle?.pago;
    const numeroOrden = orden?.id ?? ordenId;
    const monto = orden?.monto_total ?? pago?.amount;

    return (
        <main className={styles.container}>
            <section className={`${styles.card} ${styles[content.tone]}`} role="status">
                <h1 className={styles.title}>{content.title}</h1>
                <p className={styles.message}>{content.message}</p>

                {estado === 'success' && (
                    <dl className={styles.details}>
                        {monto !== undefined && monto !== null && (
                            <div className={styles.detailRow}>
                                <dt>Monto</dt>
                                <dd>${formatPrice(monto)}</dd>
                            </div>
                        )}
                        {numeroOrden && (
                            <div className={styles.detailRow}>
                                <dt>N° de orden</dt>
                                <dd>{numeroOrden}</dd>
                            </div>
                        )}
                        {buyOrder && (
                            <div className={styles.detailRow}>
                                <dt>Orden de compra</dt>
                                <dd>{buyOrder}</dd>
                            </div>
                        )}
                        {pago?.authorization_code && (
                            <div className={styles.detailRow}>
                                <dt>Código de autorización</dt>
                                <dd>{pago.authorization_code}</dd>
                            </div>
                        )}
                        <div className={styles.detailRow}>
                            <dt>Tarjeta</dt>
                            <dd>{formatCard(detalle)}</dd>
                        </div>
                    </dl>
                )}

                {estado === 'success' ? (
                    <Link to="/" className={styles.primaryButton}>
                        Volver al inicio
                    </Link>
                ) : (
                    <Link to="/checkout" className={styles.primaryButton}>
                        Reintentar
                    </Link>
                )}
            </section>
        </main>
    );
};
