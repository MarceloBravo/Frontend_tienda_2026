import { useModalComponent } from './useModalComponent';
import styles from './ModalComponent.module.css';

export const ModalComponent = () => {
    const { 
        isVisible, 
        title, 
        message, 
        closeModalHandle, 
        aceptModalHandle 
    } = useModalComponent();

    return (
        isVisible && <>
            <div className={styles.modalContainer}></div>
            <div className={`modal ${styles.modalForm}`} tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title ?? "Atención"}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={closeModalHandle}></button>
                        </div>
                        <div className="modal-body">
                            <p>{message}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={closeModalHandle}>Cancelar</button>
                            <button type="button" className="btn btn-primary" onClick={aceptModalHandle}>Aceptar</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};