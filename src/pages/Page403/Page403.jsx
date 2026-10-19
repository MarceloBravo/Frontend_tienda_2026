import { Link } from 'react-router';
import styles from './Page403.module.css';

export const Page403 = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>403</h1>
      <p className={styles.subtitle}>Acceso denegado</p>
      <p className={styles.text}>Lo sentimos, no tienes permiso para acceder a esta página.</p>
      <Link to="/" className={styles.link}>Ir a la página principal</Link>
    </div>
  );
};
