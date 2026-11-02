import { composeDireccionEnvio, MAX_DIRECCION_ENVIO } from '../direccionEnvio';

const shipping = {
    nombreDestinatario: 'Ana Pérez',
    telefono: '+56 9 1234 5678',
    calle: 'Av. Siempre Viva',
    numero: '742',
    departamento: 'Depto 4B',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    region: 'Metropolitana',
    referencias: 'Portón azul',
};

describe('composeDireccionEnvio', () => {
    it('composes a readable address with all fields (happy path)', () => {
        expect(composeDireccionEnvio(shipping)).toBe(
            'Ana Pérez — +56 9 1234 5678 — Av. Siempre Viva 742 , Depto 4B — Santiago — Santiago — Metropolitana — Ref: Portón azul'
        );
    });

    it('omits optional fields when they are empty', () => {
        const result = composeDireccionEnvio({
            ...shipping,
            departamento: '',
            referencias: '',
        });

        expect(result).not.toContain('Depto');
        expect(result).not.toContain('Ref:');
    });

    it('handles a missing shipping object (edge case)', () => {
        expect(composeDireccionEnvio()).toBe('');
    });

    it('keeps a value of exactly 500 characters', () => {
        const result = composeDireccionEnvio({ nombreDestinatario: 'a'.repeat(MAX_DIRECCION_ENVIO) });

        expect(result).toHaveLength(MAX_DIRECCION_ENVIO);
    });

    it('truncates values over 500 characters', () => {
        const result = composeDireccionEnvio({ nombreDestinatario: 'a'.repeat(MAX_DIRECCION_ENVIO + 50) });

        expect(result).toHaveLength(MAX_DIRECCION_ENVIO);
    });
});
