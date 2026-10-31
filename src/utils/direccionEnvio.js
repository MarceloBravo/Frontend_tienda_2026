export const MAX_DIRECCION_ENVIO = 500;

export const composeDireccionEnvio = (shipping = {}) => {
    const linea = [
        shipping.nombreDestinatario,
        shipping.telefono,
        [
            shipping.calle,
            shipping.numero,
            shipping.departamento ? `, ${shipping.departamento}` : '',
        ]
            .filter(Boolean)
            .join(' '),
        shipping.comuna,
        shipping.ciudad,
        shipping.region,
    ]
        .filter(Boolean)
        .join(' — ');

    const referencias = shipping.referencias ? ` — Ref: ${shipping.referencias}` : '';
    return `${linea}${referencias}`.slice(0, MAX_DIRECCION_ENVIO);
};
