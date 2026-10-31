import { render, screen, fireEvent } from '@testing-library/react';
import { ShippingForm } from './ShippingForm';

const values = {
    nombreDestinatario: '',
    telefono: '',
    calle: '',
    numero: '',
    departamento: '',
    comuna: '',
    ciudad: '',
    region: '',
    referencias: '',
};

const renderForm = (props = {}) => render(
    <ShippingForm values={values} errors={{}} onChange={jest.fn()} {...props} />
);

describe('ShippingForm', () => {
    it('renders all the shipping fields (happy path)', () => {
        renderForm();

        expect(screen.getByLabelText('Nombre del destinatario')).toBeInTheDocument();
        expect(screen.getByLabelText('Teléfono')).toBeInTheDocument();
        expect(screen.getByLabelText('Calle')).toBeInTheDocument();
        expect(screen.getByLabelText('Número')).toBeInTheDocument();
        expect(screen.getByLabelText('Departamento (opcional)')).toBeInTheDocument();
        expect(screen.getByLabelText('Comuna')).toBeInTheDocument();
        expect(screen.getByLabelText('Ciudad')).toBeInTheDocument();
        expect(screen.getByLabelText('Región')).toBeInTheDocument();
        expect(screen.getByLabelText('Referencias (opcional)')).toBeInTheDocument();
    });

    it('renders the 16 regions plus the placeholder option', () => {
        renderForm();

        expect(screen.getByRole('option', { name: 'Selecciona una región' })).toBeInTheDocument();
        expect(screen.getAllByRole('option')).toHaveLength(17);
    });

    it('calls onChange with the field name and value', () => {
        let captured;
        const onChange = jest.fn((event) => {
            captured = { name: event.target.name, value: event.target.value };
        });
        renderForm({ onChange });

        fireEvent.change(screen.getByLabelText('Comuna'), { target: { value: 'Providencia' } });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(captured).toEqual({ name: 'comuna', value: 'Providencia' });
    });

    it('shows the field error and marks the input as invalid (error case)', () => {
        renderForm({ errors: { telefono: 'Teléfono inválido' } });

        const input = screen.getByLabelText('Teléfono');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'shipping-error-telefono');
        expect(screen.getByText('Teléfono inválido')).toHaveAttribute('id', 'shipping-error-telefono');
    });

    it('does not mark fields as invalid when there are no errors', () => {
        renderForm();

        expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'false');
        expect(screen.getByLabelText('Teléfono')).not.toHaveAttribute('aria-describedby');
    });

    it('renders empty values without crashing (edge case)', () => {
        renderForm({ values: {} });

        expect(screen.getByLabelText('Nombre del destinatario')).toHaveValue('');
        expect(screen.getByLabelText('Región')).toHaveValue('');
    });
});
