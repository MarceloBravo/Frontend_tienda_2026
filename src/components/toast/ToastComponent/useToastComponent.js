import { useState, useEffect, useRef } from 'react';
import { useToastStore } from '../../../store/toastStore';

const TOAST_ANIMATION_DURATION = 400;

export const useToastComponent = (message, type, index) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const removeToast = useToastStore(store => store.removeToast);
  const isClosingRef = useRef(false);
  const removeTimeoutRef = useRef(null);
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

  const hideToast = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);

    removeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      removeToast(index);
    }, TOAST_ANIMATION_DURATION);
  };

  useEffect(() => {
    return () => clearTimeout(removeTimeoutRef.current);
  }, []);

  useEffect(()=> {
    if(!isVisible || isClosing) return;
    if(timeLeft === 0){
        hideToast();
        return;
    };
    const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1000);
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  },[timeLeft, isVisible, isClosing]);

    return { isVisible, isClosing, hideToast, getToastClass };
};