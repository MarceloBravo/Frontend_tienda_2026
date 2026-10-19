import { useState, useEffect } from 'react';
import { useToastStore } from '../../store/toastStore';

export const useToastComponent = (message, type, index) => {
  const [isVisible, setIsVisible] = useState(true);
  const removeToast = useToastStore(store => store.removeToast);
  const [timeLeft, setTimeLeft] = useState(5000); // 5 seconds in milliseconds  
  const getToastClass = () => {
    switch (type) {
    case 'success':
        return 'successToast';
    case 'error':
        return 'errorToast';
    case 'warning':
        return 'warningToast';
    default:
        return 'defaultToast';
    }
  };

  useEffect(()=> {
    if(!isVisible) return;
    if(timeLeft === 0){
        hideToast();
    };
    const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1000);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  },[timeLeft, isVisible]);


    const hideToast = () => {
      setIsVisible(false);
      removeToast(index);
    };

    return { isVisible, hideToast, getToastClass };
};