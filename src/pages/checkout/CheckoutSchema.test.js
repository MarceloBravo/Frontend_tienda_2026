import { CheckoutSchema, REGIONES, mapZodErrors } from './CheckoutSchema';

const validShipping = {
    nombreDestinatario: 'Ana Pérez',
    telefono: '+56 9 1234 5678',
    calle: 'Av. Siempre Viva',
    numero: '742',
    departamento: '',
    comuna: 'Santiago',
    ciudad: 'Santiago',
    region: 'Metropolitana',
    referencias: '',
};

describe('CheckoutSchema', () => {
    it('accepts a complete valid address (happy path)', () => {
        const result = CheckoutSchema.safeParse(validShipping);

        expect(result.success).toBe(true);
    });

    it('accepts optional fields as empty strings', () => {
        const result = CheckoutSchema.safeParse({ ...validShipping, departamento: '', referencias: '' });

        expect(result.success).toBe(true);
    });

    it('accepts a phone number without country code and with spaces', () => {
        expect(CheckoutSchema.safeParse({ ...validShipping, telefono: '9 1234 5678' }).success).toBe(true);
        expect(CheckoutSchema.safeParse({ ...validShipping, telefono: '912345678' }).success).toBe(true);
    });

    it('rejects an invalid phone number', () => {
        const result = CheckoutSchema.safeParse({ ...validShipping, telefono: '12345' });

        expect(result.success).toBe(false);
        expect(mapZodErrors(result.error).telefono).toMatch(/Teléfono inválido/);
    });

    it('rejects empty required fields', () => {
        const result = CheckoutSchema.safeParse({
            nombreDestinatario: '',
            telefono: '',
            calle: '',
            numero: '',
            departamento: '',
            comuna: '',
            ciudad: '',
            region: '',
            referencias: '',
        });

        expect(result.success).toBe(false);
        const errors = mapZodErrors(result.error);
        expect(errors.nombreDestinatario).toBe('El campo es requerido');
        expect(errors.calle).toBe('El campo es requerido');
        expect(errors.numero).toBe('El campo es requerido');
        expect(errors.comuna).toBe('El campo es requerido');
        expect(errors.ciudad).toBe('El campo es requerido');
        expect(errors.region).toBe('Selecciona una región');
    });

    it('rejects values that exceed the maximum length', () => {
        const result = CheckoutSchema.safeParse({
            ...validShipping,
            nombreDestinatario: 'a'.repeat(101),
            calle: 'b'.repeat(151),
            numero: 'c'.repeat(21),
            comuna: 'd'.repeat(101),
            ciudad: 'e'.repeat(101),
            departamento: 'f'.repeat(51),
            referencias: 'g'.repeat(201),
        });

        expect(result.success).toBe(false);
        const errors = mapZodErrors(result.error);
        expect(errors.nombreDestinatario).toMatch(/100/);
        expect(errors.calle).toMatch(/150/);
        expect(errors.numero).toMatch(/20/);
        expect(errors.comuna).toMatch(/100/);
        expect(errors.ciudad).toMatch(/100/);
        expect(errors.departamento).toMatch(/50/);
        expect(errors.referencias).toMatch(/200/);
    });

    it('accepts values exactly at the maximum length', () => {
        const result = CheckoutSchema.safeParse({
            ...validShipping,
            nombreDestinatario: 'a'.repeat(100),
            calle: 'b'.repeat(150),
            numero: 'c'.repeat(20),
            comuna: 'd'.repeat(100),
            ciudad: 'e'.repeat(100),
            departamento: 'f'.repeat(50),
            referencias: 'g'.repeat(200),
        });

        expect(result.success).toBe(true);
    });

    it('exposes the 16 regions of Chile', () => {
        expect(REGIONES).toHaveLength(16);
        expect(REGIONES).toContain('Metropolitana');
    });

    it('mapZodErrors returns an empty object for a missing error', () => {
        expect(mapZodErrors(null)).toEqual({});
    });
});
