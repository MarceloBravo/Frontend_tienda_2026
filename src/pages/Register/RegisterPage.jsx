import { Link } from 'react-router-dom';
import { SpinnerComponent } from '../../components/spinner/SpinnerComponent';
import { useRegisterPage } from './useRegisterPage';
import { PasswordStrengthIndicator } from '../../components/PasswordStrengthIndicator/PasswordStrengthIndicator';
import styles from './RegisterPage.module.css';

export const RegisterPage = () => {
    const {
        loading,
        formData,
        formErrors,
        passwordStrength,
        handleChange,
        handleSubmit,
        setStyleField
    } = useRegisterPage();


    return (
        <>
            {loading && <div className={styles.loading}><SpinnerComponent/></div>}
            <div className={styles.container}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <h2 className={styles.title}>Registro</h2>
                    <div className={styles.inputGroup}>
                    <label htmlFor="username">Nombre de usuario</label>
                        <div className="input-container">
                            <input                                
                                className={setStyleField(formErrors.username, formData.username)}
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                maxLength="20"
                                required
                            />
                            {formErrors.username && <label className="label-error">{formErrors.username}</label>}
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                    <label htmlFor="nombre">Nombre</label>
                        <div className="input-container">
                            <input
                                className={setStyleField(formErrors.nombre, formData.nombre)}
                                type="text"
                                id="nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                maxLength="20"
                                required
                            />
                            {formErrors.nombre && <label htmlFor='nombre' className="label-error">{formErrors.nombre}</label>}
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                    <label htmlFor="apellido">Apellido</label>
                        <div className="input-container">
                            <input
                                className={setStyleField(formErrors.apellido, formData.apellido)}
                                type="text"
                                id="apellido"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                maxLength="20"
                                required
                            />
                            {formErrors.apellido && <label htmlFor="apellido" className="label-error">{formErrors.apellido}</label>}
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                    <label htmlFor="email">Email</label>
                    <div className="input-container">
                        <input
                            className={setStyleField(formErrors.email, formData.email)}
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            maxLength="255"
                            required
                        />
                        {formErrors.email && <label htmlFor="email" className="label-error">{formErrors.email}</label>}
                    </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-container">
                            <input
                                className={setStyleField(formErrors.pasword, formData.password)}
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                maxLength="255"
                                required
                            />
                            {formErrors.password && <label htmlFor="password" className="label-error">{formErrors.password}</label>}
                            <PasswordStrengthIndicator strength={passwordStrength} />
                        </div>
                    </div>

                     
                    
                    <div className={styles.inputGroup}>
                        <label htmlFor="confirmPassword">Confirmación de Contraseña</label>
                        <div className="input-container">
                            <input
                                className={setStyleField(formErrors.confirmPassword, formData.confirmPassword)}
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                maxLength="255"
                                required
                            />
                            {formErrors.confirmPassword && <label htmlFor="password" className="label-error">{formErrors.confirmPassword}</label>}
                        </div>
                    </div>
                    {formErrors._form && <label className="label-error">{formErrors._form}</label>}
                    <button type="submit" className={styles.button}>Registrarse</button>
                    <p className={styles.linkText}>
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión aquí</Link>
                    </p>
                </form>
            </div>
        </>
    );
};