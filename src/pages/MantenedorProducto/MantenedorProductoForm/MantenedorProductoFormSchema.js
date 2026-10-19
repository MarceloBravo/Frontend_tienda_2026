import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/png']; // The existing code only allows png

const baseSchema = z.object({
    asin: z.string().min(5, { message: 'El campo asin no puede tener menos de 5 carácteres'}).max(20, { message: 'El asin no puede tener más de 20 caracteres' }),
    currency: z.string().min(3, { message: 'Selecciona un tipo de moneda válido'}).max(10, { message: 'El típo de moneda seleccionado no es válido' }),
    climate_pledge_friendly: z.boolean().default(false),
    is_amazon_choice: z.boolean().default(false),
    is_best_seller: z.boolean().default(false),
    product_num_ratings: z.preprocess(
        val => (val !== null && val !== '') ? Number(val) : null,
        z.number({required_error: 'El campo es requerido', invalid_type_error: 'El campo debe ser un número'})
    ),
    product_original_price: z.preprocess(
        val => (val !== null && val !== '') ? Number(val) : null,
        z.number({required_error: 'El campo es requerido', invalid_type_error: 'El campo debe ser un número'}).nullable()
    ),
    product_photo:  z.string().optional().nullable(),
    product_photo_file: z.any()
        .optional()
        .nullable()
        .refine(file => {
            if (!file) return true; // allow empty on update
            return file.size <= MAX_FILE_SIZE;
        }, 'El tamaño máximo de la imágen es 5MB.')
        .refine(file => {
            if (!file) return true; // allow empty on update
            return ACCEPTED_IMAGE_TYPES.includes(file.type);
        }, 'Solo formato .png es soportado.'),
    product_price: z.preprocess(
        val => (val !== null && val !== '') ? Number(val) : null,
        z.number({required_error: 'El campo es requerido', invalid_type_error: 'El campo debe ser un número'})
    ),
    product_star_rating: z.preprocess(
        val => (val !== null && val !== '') ? Number(val) : null,
        z.number({required_error: 'El campo es requerido', invalid_type_error: 'El campo debe ser un número'}).min(0, {message: 'El valor debe estar entre 0 y 5'}).max(5, {message: 'El valor debe estar entre 0 y 5'})
    ),
    product_title: z.string().min(1, {message: 'El campo es requerido'}),
    sales_volume: z.string().min(1, {message: 'El campo es requerido'}).max(255, {message: 'El valor es demasiado extenso'}),
});

export const getMantenedorProductoFormSchema = (isUpdate = false) => {
    return baseSchema.superRefine((data, ctx) => {
        if (!isUpdate && !data.product_photo_file) {
             ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "La imágen es requerida",
                path: ["product_photo_file"],
            });
        }
    });
};
