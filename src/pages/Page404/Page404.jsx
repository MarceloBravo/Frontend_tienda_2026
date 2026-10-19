import { Link } from 'react-router';
import styles from './Pge404.module.css';

export const Page404 = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.subtitle}>Página no encontrada</p>
      <p className={styles.text}>Lo sentimos, la página que estás buscando no existe.</p>
      <Link to="/" className={styles.link}>Ir a la página principal</Link>
    </div>
  );
};