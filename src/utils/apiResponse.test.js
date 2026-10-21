import {
    normalizeProductsResponse,
    normalizeProductResponse,
    isSuccessfulStatus,
} from './apiResponse';

describe('normalizeProductsResponse', () => {
    it('unwraps the new envelope with status, data, totProd and page (happy path)', () => {
        const response = {
            status: 'success',
            data: [
                {
                    asin: 'A1',
                    currency: 'USD',
                    product_price: 10,
                    product_title: 'Producto',
                    product_photo: 'p.png',
                },
            ],
            totProd: 42,
            page: 1,
        };

        expect(normalizeProductsResponse(response)).toEqual({
            status: 'success',
            products: [
                {
                    asin: 'A1',
                    currency: 'USD',
                    product_price: 10,
                    product_title: 'Producto',
                    product_photo: 'p.png',
                },
            ],
            total: 42,
            page: 1,
        });
    });

    it('returns an empty list when the response is null (null safety)', () => {
        expect(normalizeProductsResponse(null)).toEqual({
            status: null,
            products: [],
            total: 0,
            page: 1,
        });
    });

    it('returns an empty list when the response is undefined (null safety)', () => {
        expect(normalizeProductsResponse(undefined)).toEqual({
            status: null,
            products: [],
            total: 0,
            page: 1,
        });
    });

    it('returns an empty list when data is null (edge case)', () => {
        expect(normalizeProductsResponse({ status: 'success', data: null, totProd: 0, page: 1 })).toEqual({
            status: 'success',
            products: [],
            total: 0,
            page: 1,
        });
    });

    it('returns an empty list when data is not an array (negative case)', () => {
        const result = normalizeProductsResponse({ status: 'success', data: 'texto' });

        expect(result.products).toEqual([]);
        expect(result.total).toBe(0);
    });

    it('accepts a plain array as the response (legacy shape)', () => {
        const products = [{ asin: 'A1' }];

        expect(normalizeProductsResponse(products)).toEqual({
            status: 'success',
            products,
            total: 1,
            page: 1,
        });
    });

    it('accepts an already normalized response', () => {
        const products = [{ asin: 'A1' }];

        expect(normalizeProductsResponse({ products, total: 7, page: 3 })).toEqual({
            status: null,
            products,
            total: 7,
            page: 3,
        });
    });

    it('falls back to the products length when totProd is missing (edge case)', () => {
        const result = normalizeProductsResponse({ status: 'success', data: [{ asin: 'A1' }, { asin: 'A2' }] });

        expect(result.total).toBe(2);
    });

    it('ignores a negative totProd (edge case)', () => {
        const result = normalizeProductsResponse({ status: 'success', data: [], totProd: -10, page: 1 });

        expect(result.total).toBe(0);
    });

    it('forces the page to be at least 1 (edge case)', () => {
        const result = normalizeProductsResponse({ status: 'success', data: [], totProd: 0, page: 0 });

        expect(result.page).toBe(1);
    });

    it('keeps the reported page (happy path)', () => {
        const result = normalizeProductsResponse({ status: 'success', data: [], totProd: 0, page: 5 });

        expect(result.page).toBe(5);
    });
});

describe('normalizeProductResponse', () => {
    it('unwraps the product from the data key (happy path)', () => {
        const product = { asin: 'A1', product_title: 'Producto' };

        expect(normalizeProductResponse({ status: 'success', data: product })).toEqual({
            status: 'success',
            product,
        });
    });

    it('returns a null product when the response is null (null safety)', () => {
        expect(normalizeProductResponse(null)).toEqual({ status: null, product: null });
    });

    it('returns a null product when data is missing (edge case)', () => {
        expect(normalizeProductResponse({ status: 'success' })).toEqual({ status: 'success', product: null });
    });

    it('returns a null product when data is not an object (negative case)', () => {
        expect(normalizeProductResponse({ status: 'success', data: 'texto' })).toEqual({
            status: 'success',
            product: null,
        });
    });
});

describe('isSuccessfulStatus', () => {
    it('accepts the success status (happy path)', () => {
        expect(isSuccessfulStatus('success')).toBe(true);
    });

    it('accepts a missing status (edge case)', () => {
        expect(isSuccessfulStatus(null)).toBe(true);
    });

    it('rejects any other status (negative case)', () => {
        expect(isSuccessfulStatus('error')).toBe(false);
    });
});
