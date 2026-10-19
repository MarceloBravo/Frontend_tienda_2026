import styles from './EmptyStateComponent.module.css';

export const EmptyStateComponent = ({ message = 'No hay elementos para mostrar' }) => {
    return (
        <div className={styles.emptyState} role="status">
            <p className={styles.message}>{message}</p>
        </div>
    );
}
