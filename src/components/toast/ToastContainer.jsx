import { useToastStore } from "../../store/toastStore"
import { ToastComponent } from "./ToastComponent";

import style from './ToastContainer.module.css';

export const ToastContainer = () => {
  const toastArray = useToastStore(store=> store.toastArray);

  return (
      <div className={style.ToastsContainer}>
          {toastArray && toastArray.map((toast, index) => (
              <ToastComponent key={index} message={toast.message} type={toast.type} index={index} />
          ))}
      </div>
  );
}