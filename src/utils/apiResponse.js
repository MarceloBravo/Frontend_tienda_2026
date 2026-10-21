export const SUCCESS_STATUS = 'success';

export const API_ERROR_MESSAGE = 'Ocurrió un error al procesar la respuesta del servidor';

const isObject = (value) =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const toNonNegativeNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const readStatus = (response) =>
    typeof response?.status === 'string' ? response.status : null;

const extractProducts = (response) => {
    if (Array.isArray(response.products)) return response.products;
    if (Array.isArray(response.data)) return response.data;
    if (isObject(response.data) && Array.isArray(response.data.products)) {
        return response.data.products;
    }
    return [];
};

export const isSuccessfulStatus = (status) =>
    status === null || status === SUCCESS_STATUS;

export const normalizeProductsResponse = (response) => {
    if (Array.isArray(response)) {
        return {
            status: SUCCESS_STATUS,
            products: response,
            total: response.length,
            page: 1,
        };
    }

    if (!isObject(response)) {
        return { status: null, products: [], total: 0, page: 1 };
    }

    const products = extractProducts(response);

    return {
        status: readStatus(response),
        products,
        total: toNonNegativeNumber(response.totProd ?? response.total, products.length),
        page: Math.max(1, toNonNegativeNumber(response.page, 1)),
    };
};

export const normalizeProductResponse = (response) => {
    if (!isObject(response)) {
        return { status: null, product: null };
    }

    const source = isObject(response.data)
        ? response.data
        : isObject(response.product)
            ? response.product
            : null;

    return {
        status: readStatus(response),
        product: source,
    };
};
