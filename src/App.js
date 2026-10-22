import { BrowserRouter } from 'react-router';
import { MenuComponent } from './components/header/MenuComponent';
import Navigation from './routes/Navigation';
import { ToastContainer } from './components/toast/ToastContainer/ToastContainer';
import { FooterComponent } from './components/footer/FooterComponent';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <div className="App">
        <MenuComponent />
        <Navigation/>
        <FooterComponent />
      </div>
    </BrowserRouter>
  );
}

export default App;
