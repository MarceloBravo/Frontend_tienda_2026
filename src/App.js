import { BrowserRouter } from 'react-router';
import { useEffect } from 'react';
import { MenuComponent } from './components/header/MenuComponent';
import Navigation from './routes/Navigation';
import { ToastContainer } from './components/toast/ToastContainer/ToastContainer';
import { FooterComponent } from './components/footer/FooterComponent';
import { ShoppingCartComponent } from './components/shoppingCart/ShoppingCartComponent';
import { useAuthStore } from './store/authStore';

import './App.css';

const AuthBootstrap = () => {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession);
  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap />
      <ToastContainer />
      <div className="App">
        <ShoppingCartComponent/>
        <MenuComponent />
        <Navigation/>
        <FooterComponent />
      </div>
    </BrowserRouter>
  );
}

export default App;
