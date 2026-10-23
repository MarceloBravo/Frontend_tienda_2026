import { useToastComponent } from './useToastComponent';
import styles from './ToastComponent.module.css';

export const ToastComponent = ({ message, type, index }) => {
    const { isVisible, isClosing, getToastClass, hideToast } = useToastComponent(message, type, index);

  return (
    isVisible && (
      <div
        className={`${styles[getToastClass()]} ${styles.toastContainer} ${isClosing ? styles.closing : ''}`}
      >
        <p>{message}</p>
        <button onClick={hideToast} className={styles.btnCloseToast}>
          &times;
        </button>
      </div>
    )
  );
};
