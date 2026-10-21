export const buildProductsQuery = ({ search, page } = {}) => {
    const params = new URLSearchParams();

    const searchText = typeof search === 'string' ? search.trim() : '';
    if (searchText) {
        params.append('search', searchText);
    }

    const pageNumber = Number(page);
    if (Number.isFinite(pageNumber) && pageNumber >= 1) {
        params.append('page', String(Math.floor(pageNumber)));
    }

    const query = params.toString();

    return query ? `?${query}` : '';
};
