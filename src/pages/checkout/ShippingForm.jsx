import { REGIONES } from './CheckoutSchema';
import styles from './ShippingForm.module.css';

const FIELD_ERROR_ID = (name) => `shipping-error-${name}`;

const FieldError = ({ name, errors }) =>
    errors[name] ? (
        <span id={FIELD_ERROR_ID(name)} className={styles.error} role="alert">
            {errors[name]}
        </span>
    ) : null;

const inputProps = (name, errors) => ({
    id: `shipping-${name}`,
    name,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? FIELD_ERROR_ID(name) : undefined,
});

export const ShippingForm = ({ values, errors = {}, onChange }) => {
    return (
        <form className={styles.form} noValidate onSubmit={(event) => event.preventDefault()}>
            <div className={styles.grid}>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="shipping-nombreDestinatario">Nombre del destinatario</label>
                    <input
                        {...inputProps('nombreDestinatario', errors)}
                        type="text"
                        value={values.nombreDestinatario}
                        onChange={onChange}
                        maxLength={100}
                        required
                    />
                    <FieldError name="nombreDestinatario" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-telefono">Teléfono</label>
                    <input
                        {...inputProps('telefono', errors)}
                        type="tel"
                        value={values.telefono}
                        onChange={onChange}
                        placeholder="+56 9 1234 5678"
                        maxLength={20}
                        required
                    />
                    <FieldError name="telefono" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-region">Región</label>
                    <select
                        {...inputProps('region', errors)}
                        value={values.region}
                        onChange={onChange}
                        required
                    >
                        <option value="">Selecciona una región</option>
                        {REGIONES.map((region) => (
                            <option key={region} value={region}>
                                {region}
                            </option>
                        ))}
                    </select>
                    <FieldError name="region" errors={errors} />
                </div>

                <div className={`${styles.field} ${styles.streetField}`}>
                    <label htmlFor="shipping-calle">Calle</label>
                    <input
                        {...inputProps('calle', errors)}
                        type="text"
                        value={values.calle}
                        onChange={onChange}
                        maxLength={150}
                        required
                    />
                    <FieldError name="calle" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-numero">Número</label>
                    <input
                        {...inputProps('numero', errors)}
                        type="text"
                        value={values.numero}
                        onChange={onChange}
                        placeholder="123 o s/n"
                        maxLength={20}
                        required
                    />
                    <FieldError name="numero" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-departamento">Departamento (opcional)</label>
                    <input
                        {...inputProps('departamento', errors)}
                        type="text"
                        value={values.departamento}
                        onChange={onChange}
                        maxLength={50}
                    />
                    <FieldError name="departamento" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-comuna">Comuna</label>
                    <input
                        {...inputProps('comuna', errors)}
                        type="text"
                        value={values.comuna}
                        onChange={onChange}
                        maxLength={100}
                        required
                    />
                    <FieldError name="comuna" errors={errors} />
                </div>

                <div className={styles.field}>
                    <label htmlFor="shipping-ciudad">Ciudad</label>
                    <input
                        {...inputProps('ciudad', errors)}
                        type="text"
                        value={values.ciudad}
                        onChange={onChange}
                        maxLength={100}
                        required
                    />
                    <FieldError name="ciudad" errors={errors} />
                </div>

                <div className={`${styles.field} ${styles.fullWidth}`}>
                    <label htmlFor="shipping-referencias">Referencias (opcional)</label>
                    <textarea
                        {...inputProps('referencias', errors)}
                        value={values.referencias}
                        onChange={onChange}
                        maxLength={200}
                        rows={3}
                        placeholder="Ej: portón azul, entregar en conserjería"
                    />
                    <FieldError name="referencias" errors={errors} />
                </div>
            </div>
        </form>
    );
};
