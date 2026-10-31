import { redirectToWebpay } from './webpay';

describe('redirectToWebpay', () => {
    let capturedForm;

    beforeEach(() => {
        capturedForm = null;
        jest.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function submit() {
            capturedForm = this;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('builds a POST form with the token_ws input (happy path)', () => {
        redirectToWebpay({ url: 'https://webpay.test/transaction', token: 'abc123' });

        expect(capturedForm).not.toBeNull();
        expect(capturedForm.method).toBe('post');
        expect(capturedForm.action).toBe('https://webpay.test/transaction');

        const input = capturedForm.querySelector('input[name="token_ws"]');
        expect(input).not.toBeNull();
        expect(input.value).toBe('abc123');
        expect(input.type).toBe('hidden');
    });

    it('removes the form from the document after submitting', () => {
        redirectToWebpay({ url: 'https://webpay.test/transaction', token: 'abc123' });

        expect(document.body.querySelector('form[action="https://webpay.test/transaction"]')).toBeNull();
    });

    it('throws when the response is incomplete (error case)', () => {
        expect(() => redirectToWebpay({ url: '', token: 'abc' })).toThrow('Respuesta de Webpay incompleta.');
        expect(() => redirectToWebpay({ url: 'https://webpay.test', token: '' })).toThrow('Respuesta de Webpay incompleta.');
        expect(() => redirectToWebpay()).toThrow('Respuesta de Webpay incompleta.');
    });
});
