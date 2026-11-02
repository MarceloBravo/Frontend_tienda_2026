import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccordionComponent } from '../AccordionComponent';

const renderAccordion = (props = {}) => render(
    <AccordionComponent
        id="shipping"
        title="Datos de envío"
        subtitle="Pendiente"
        isOpen={false}
        onToggle={jest.fn()}
        {...props}
    >
        <p>Contenido del panel</p>
    </AccordionComponent>
);

describe('AccordionComponent', () => {
    it('renders the title, subtitle and children (happy path)', () => {
        renderAccordion({ isOpen: true });

        expect(screen.getByText('Datos de envío')).toBeInTheDocument();
        expect(screen.getByText('Pendiente')).toBeInTheDocument();
        expect(screen.getByText('Contenido del panel')).toBeInTheDocument();
    });

    it('marks the trigger as expanded and links it to the panel', () => {
        renderAccordion({ isOpen: true });

        const trigger = screen.getByRole('button', { name: /Datos de envío/ });
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(trigger).toHaveAttribute('aria-controls', 'accordion-panel-shipping');
        expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'accordion-header-shipping');
    });

    it('hides the panel when it is closed (edge case)', () => {
        renderAccordion({ isOpen: false });

        expect(screen.getByRole('button', { name: /Datos de envío/ })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('region', { hidden: true })).not.toBeVisible();
    });

    it('calls onToggle once per click', () => {
        const onToggle = jest.fn();
        renderAccordion({ onToggle });

        fireEvent.click(screen.getByRole('button', { name: /Datos de envío/ }));

        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('can be activated with the keyboard (Enter/Space)', () => {
        const onToggle = jest.fn();
        renderAccordion({ onToggle });

        const trigger = screen.getByRole('button', { name: /Datos de envío/ });
        trigger.focus();
        expect(trigger).toHaveFocus();

        userEvent.type(trigger, '{enter}');

        expect(onToggle).toHaveBeenCalled();
    });

    it('does not render the subtitle when it is empty (edge case)', () => {
        renderAccordion({ subtitle: '' });

        expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
    });
});
