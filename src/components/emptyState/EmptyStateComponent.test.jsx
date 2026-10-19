import { render, screen } from '@testing-library/react';
import { EmptyStateComponent } from './EmptyStateComponent';

describe('EmptyStateComponent', () => {
    it('renders the default message when no message is provided', () => {
        render(<EmptyStateComponent />);
        expect(screen.getByText('No hay elementos para mostrar')).toBeInTheDocument();
    });

    it('renders a custom message', () => {
        render(<EmptyStateComponent message="No hay productos registrados" />);
        expect(screen.getByText('No hay productos registrados')).toBeInTheDocument();
    });

    it('renders an empty message without crashing (edge case)', () => {
        render(<EmptyStateComponent message="" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('');
    });

    it('renders a long message without truncation (text overflow edge case)', () => {
        const longMessage = 'Producto '.repeat(200);
        render(<EmptyStateComponent message={longMessage} />);
        expect(screen.getByText(longMessage.trim())).toBeInTheDocument();
    });
});
