import styles from './FooterComponent.module.css';

export const FooterComponent = () => {

    return (
        <footer className={`${styles.footer}`}>
            <div>
                Desarrollado por Marcelo Bravo C.
            </div>
            <div>
                Talca, Chile 2026
            </div>
        </footer>
    );
};