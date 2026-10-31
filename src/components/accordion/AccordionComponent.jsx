import styles from './AccordionComponent.module.css';

export const AccordionComponent = ({ id, title, subtitle, isOpen, onToggle, children }) => {
    const headerId = `accordion-header-${id}`;
    const panelId = `accordion-panel-${id}`;

    return (
        <section className={styles.accordion}>
            <h2 className={styles.heading}>
                <button
                    type="button"
                    id={headerId}
                    className={styles.trigger}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={onToggle}
                >
                    <span className={styles.title}>{title}</span>
                    {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
                    <span
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                        aria-hidden="true"
                    >
                        ▾
                    </span>
                </button>
            </h2>
            <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                hidden={!isOpen}
                className={styles.panel}
            >
                {children}
            </div>
        </section>
    );
};
