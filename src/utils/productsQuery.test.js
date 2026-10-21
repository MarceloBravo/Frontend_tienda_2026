import { buildProductsQuery } from './productsQuery';

describe('buildProductsQuery', () => {
    it('returns an empty query when there are no params (edge case)', () => {
        expect(buildProductsQuery()).toBe('');
        expect(buildProductsQuery({})).toBe('');
    });

    it('builds the query with the search and the page (happy path)', () => {
        expect(buildProductsQuery({ search: 'phone', page: 2 })).toBe('?search=phone&page=2');
    });

    it('omits the search when it is empty (edge case)', () => {
        expect(buildProductsQuery({ search: '   ', page: 1 })).toBe('?page=1');
    });

    it('omits the page when it is not a valid number (negative case)', () => {
        expect(buildProductsQuery({ search: 'phone', page: 'abc' })).toBe('?search=phone');
        expect(buildProductsQuery({ search: 'phone', page: 0 })).toBe('?search=phone');
        expect(buildProductsQuery({ search: 'phone', page: -3 })).toBe('?search=phone');
    });

    it('encodes the special characters of the search (edge case)', () => {
        expect(buildProductsQuery({ search: 'movil & tablet' })).toBe('?search=movil+%26+tablet');
    });
});
