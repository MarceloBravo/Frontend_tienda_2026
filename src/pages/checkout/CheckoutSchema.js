import { z } from 'zod';

const telefonoRegex = /^(\+?56)?\s?9\s?\d{4}\s?\d{4}$/;

export const CheckoutSchema = z.object({
    nombreDestinatario: z
        .string()
        .trim()
        .min(1, { message: 'El campo es requerido' })
        .max(100, { message: 'El nombre no puede tener más de 100 caracteres' }),
    telefono: z
        .string()
        .trim()
        .regex(telefonoRegex, { message: 'Teléfono inválido (ej: +56 9 1234 5678)' }),
    calle: z
        .string()
        .trim()
        .min(1, { message: 'El campo es requerido' })
        .max(150, { message: 'La calle no puede tener más de 150 caracteres' }),
    numero: z
        .string()
        .trim()
        .min(1, { message: 'El campo es requerido' })
        .max(20, { message: 'El número no puede tener más de 20 caracteres' }),
    departamento: z
        .string()
        .trim()
        .max(50, { message: 'El departamento no puede tener más de 50 caracteres' })
        .optional()
        .or(z.literal('')),
    comuna: z
        .string()
        .trim()
        .min(1, { message: 'El campo es requerido' })
        .max(100, { message: 'La comuna no puede tener más de 100 caracteres' }),
    ciudad: z
        .string()
        .trim()
        .min(1, { message: 'El campo es requerido' })
        .max(100, { message: 'La ciudad no puede tener más de 100 caracteres' }),
    region: z.string().trim().min(1, { message: 'Selecciona una región' }),
    referencias: z
        .string()
        .trim()
        .max(200, { message: 'Las referencias no pueden tener más de 200 caracteres' })
        .optional()
        .or(z.literal('')),
});

export const REGIONES = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    "O'Higgins",
    'Maule',
    'Ñuble',
    'Biobío',
    'Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes',
    'Metropolitana',
];

export const mapZodErrors = (error) => {
    if (!error?.issues) return {};
    return error.issues.reduce((acc, issue) => {
        const key = Array.isArray(issue.path) && issue.path.length > 0 ? issue.path[0] : '_form';
        acc[key] = issue.message;
        return acc;
    }, {});
};
