import { useSearchProductComponent } from './useSearchProductComponent';

import styles from './SearchProductComponent.module.css';

export const SearchProductComponent = () => {
    const {
        searchText, 
        handleSearchChange,
        handleKeyDown,
        handleBtnBuscarClick
    } = useSearchProductComponent();


    return (
        <div className={styles.searchBar}>
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
    );
}