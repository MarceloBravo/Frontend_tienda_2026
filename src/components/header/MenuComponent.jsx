import { Link, NavLink } from 'react-router';
import { SpinnerComponent } from '../spinner/SpinnerComponent';
import { useMenuComponent } from './useMenuComponent';

import logo from '../../assets/logo.png';
import styles from './MenuComponent.module.css';

export const MenuComponent = () => {
  const {
    isScrolled,
    favoritos,
    loading,
    userSession,
    endSession,
    openCart,
    countProductsInCart
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
                <li className={styles.userActions}>
                  <NavLink to="/favorites">
                    <span className={styles.icon}>❤️</span>
                    <span className={styles.cartCount}>{favoritos}</span>
                  </NavLink>
                </li>
                <li className={styles.cartIcon + ' ' + styles.userActions}>
                  <button type="button" onClick={openCart}>
                    <span className={styles.icon}>🛒</span>
                    <span className={styles.cartItemsCount}>{countProductsInCart}</span>
                  </button>
                </li>
              </ul>
          </nav>
          {/*
          <div className={styles.userActions}>
            <Link to="/favorites" title="Favoritos">
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
                  <li>
                    <NavLink to="/favorites">
                      <span className={styles.icon}>❤️</span>
                      <span className={styles.cartCount}>{favoritos}</span>
                    </NavLink>
                  </li>
                  <li className={styles.cartIcon}>
                    <button type="button" onClick={openCart}>
                      <span className={styles.icon}>🛒</span>
                      <span className={styles.cartItemsCount}>{countProductsInCart}</span>
                    </button>
                  </li>
                </ul>
              </div>
              */}
          </div>
      </header>
    </>
  );
};
