import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';

export const useLoginPage = () => {
  const [ formLogin, setFormLogin ] = useState({email: '', password: '', rememberMe: false});
  const [ errorsLogin, setErrorsLogin ] = useState({email: '', password: ''});
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const userSession = useAuthStore((state) => state.userSession);
  const addToast  = useToastStore(store => store.addToast);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (userSession?.isLoggedIn) {
      const from = location.state?.from;
      const destino = typeof from === 'string' ? from : from?.pathname || '/';
      navigate(destino, { replace: true });
    }
  }, [userSession?.isLoggedIn, navigate, location.state]);

  const handleInputChange = (e) => {
    if(e.target.value.trim().length === 0){
      setErrorsLogin({...errorsLogin, [e.target.name]: 'Este campo es requerido'});
    }else{
      setErrorsLogin({...errorsLogin, [e.target.name]: ''});
    }
    setFormLogin({...formLogin, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
        await login(formLogin)
    }catch(error){
      addToast(error.message, 'error');
    }
  };

  const handleRememberMeClick = () => {
    setFormLogin({...formLogin, rememberMe: !formLogin.rememberMe});
  }
  

  return {
      formLogin,
      errorsLogin,
      isLoading,
      error,
      userSession,
      handleInputChange,
      handleSubmit,
      handleRememberMeClick
  }
}