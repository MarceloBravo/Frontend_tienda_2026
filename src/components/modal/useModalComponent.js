import { useModalStore } from '../../store/modalStore';

export const useModalComponent = () => {
    const isVisible = useModalStore(store => store.isOpen);
    const title = useModalStore(store => store.title);
    const message = useModalStore(store => store.message);
    const setResponse = useModalStore(store => store.setResponse);

    const closeModalHandle = () => {
        setResponse(false);
    }

    const aceptModalHandle = () => {
        setResponse(true);
    }

    return {
        isVisible,
        title,
        message,
        closeModalHandle,
        aceptModalHandle,
    }
}
