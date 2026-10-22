import { Link, NavLink } from 'react-router';
import { SpinnerComponent } from '../spinner/SpinnerComponent';
import { useMenuComponent } from './useMenuComponent';

import logo from '../../assets/logo.png';
import styles from './MenuComponent.module.css';

export const MenuComponent = () => {
  const {
    isScrolled,
    searchText,
    handleSearchChange,
    handleKeyDown,
    handleBtnBuscarClick,
    favoritos,
    loading,
    location,
    userSession,
    endSession
  } = useMenuComponent();

  return (
    <>
      {loading && <SpinnerComponent />}
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Link to="/">
              <img src={logo} alt="eCommerce Logo" />
              <span>MyStore</span>
            </Link>
          </div>          
          <nav className={styles.navigation}>
            <ul>
              <li><NavLink to="/" end className={({ isActive }) => isActive ? styles.navLinkActive : ''}>Home</NavLink></li>
              {userSession && userSession.isLoggedIn && 
                <li><NavLink to="/admin-producto" className={({ isActive }) => isActive ? styles.navLinkActive : ''}>Mantenedor de Productos</NavLink></li>
              }
            </ul>
          </nav>
            <div className={styles.searchBar} style={{ visibility: (location.pathname === '/') ? "visible" : "hidden" }}>
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                value={searchText} 
                onChange={handleSearchChange} 
                onKeyDown={handleKeyDown}
                aria-label="Search"
              />
              <button type="button" onClick={e => handleBtnBuscarClick(e)}>Buscar</button>
          </div>
          <div className={styles.userActions}>
            <Link to="/cart">
              <span className={styles.icon}>❤️</span>
              <span className={styles.cartCount}>{favoritos}</span>
            </Link>
              <div className={styles.userMenu}>
                <ul>
                  {(!userSession || !userSession.isLoggedIn) &&
                    <>
                      <li><Link to='/login'>Iniciar session</Link></li>
                      <li><Link to='/register'>Registrarse</Link></li>
                    </>
                  }
                  {userSession && userSession.isLoggedIn && 
                    <>
                      {userSession?.user?.username && <li>Hola {userSession.user.username} - </li>}
                      <li><button type="button" onClick={endSession}>Cerrar session</button></li>
                    </>
                  }
                </ul>
              </div>
          </div>
        </div>
      </header>
    </>
  );
};
