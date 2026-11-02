import { render, screen, fireEvent } from '@testing-library/react';
import { CheckoutPage } from '../CheckoutPage';
import { useCheckoutPage } from '../useCheckoutPage';

jest.mock('../useCheckoutPage', () => ({
    useCheckoutPage: jest.fn(),
}));

const baseHook = {
    items: [
        {
            productId: 'A1',
            name: 'Producto uno',
            image: '',
            unitPrice: 1500,
            cant: 2,
            subtotal: 3000,
        },
    ],
    total: 3000,
    openSection: 'products',
    toggleSection: jest.fn(),
    shipping: {
        nombreDestinatario: '',
        telefono: '',
        calle: '',
        numero: '',
        departamento: '',
        comuna: '',
        ciudad: '',
        region: '',
        referencias: '',
    },
    shippingErrors: {},
    handleShippingChange: jest.fn(),
    shippingComplete: false,
    canPay: false,
    isProcessing: false,
    payError: null,
    incrementProduct: jest.fn(),
    decrement: jest.fn(),
    handlePay: jest.fn(),
};

const mockHook = (overrides = {}) => {
    useCheckoutPage.mockReturnValue({ ...baseHook, ...overrides });
};

describe('CheckoutPage', () => {
    beforeEach(() => {
        useCheckoutPage.mockReset();
        mockHook();
    });

    it('renders the products and shipping accordions and no payment section', () => {
        render(<CheckoutPage />);

        expect(screen.getByRole('button', { name: /Resumen de productos/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Datos de envío/ })).toBeInTheDocument();
        expect(screen.queryByText('Forma de pago')).not.toBeInTheDocument();
        expect(screen.getByText('Webpay Plus (débito o crédito)')).toBeInTheDocument();
    });

    it('shows the Webpay button disabled when the address is incomplete', () => {
        render(<CheckoutPage />);

        expect(screen.getByRole('button', { name: 'Pagar con Webpay Plus' })).toBeDisabled();
        expect(screen.getByText('Completa los datos de envío para continuar.')).toBeInTheDocument();
    });

    it('enables the button and calls handlePay when everything is valid (happy path)', () => {
        const handlePay = jest.fn();
        mockHook({ canPay: true, shippingComplete: true, handlePay });

        render(<CheckoutPage />);

        const button = screen.getByRole('button', { name: 'Pagar con Webpay Plus' });
        expect(button).not.toBeDisabled();

        fireEvent.click(button);

        expect(handlePay).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Completa los datos de envío para continuar.')).not.toBeInTheDocument();
    });

    it('shows the redirecting state and disables the button while processing', () => {
        mockHook({ canPay: false, shippingComplete: true, isProcessing: true });

        render(<CheckoutPage />);

        expect(screen.getByRole('button', { name: 'Redirigiendo a Webpay…' })).toBeDisabled();
    });

    it('shows the API error as an alert (error case)', () => {
        mockHook({ payError: 'Sin stock' });

        render(<CheckoutPage />);

        expect(screen.getByRole('alert')).toHaveTextContent('Sin stock');
    });

    it('shows the completed subtitle when shipping is valid', () => {
        mockHook({ shippingComplete: true });

        render(<CheckoutPage />);

        expect(screen.getByText('Completado')).toBeInTheDocument();
        expect(screen.getByText('1 producto(s)')).toBeInTheDocument();
    });

    it('renders an empty product list without crashing (edge case)', () => {
        mockHook({ items: [], total: 0 });

        render(<CheckoutPage />);

        expect(screen.getByText('0 producto(s)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Pagar con Webpay Plus' })).toBeDisabled();
    });

    it('shows a message when the total cannot be calculated (edge case)', () => {
        mockHook({ shippingComplete: true, total: 0, canPay: false });

        render(<CheckoutPage />);

        expect(screen.getByRole('alert')).toHaveTextContent('No pudimos calcular el total');
        expect(screen.getByRole('button', { name: 'Pagar con Webpay Plus' })).toBeDisabled();
    });

    it('opens the shipping section from the continue button', () => {
        const toggleSection = jest.fn();
        mockHook({ toggleSection });

        render(<CheckoutPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Continuar con datos de envío' }));

        expect(toggleSection).toHaveBeenCalledWith('shipping');
    });
});
