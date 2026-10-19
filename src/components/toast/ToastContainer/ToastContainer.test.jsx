import { render, screen, act } from '@testing-library/react';
import { ToastContainer } from './ToastContainer';
import { useToastStore } from '../../../store/toastStore';

describe('ToastContainer', () => {
    beforeEach(() => {
        useToastStore.setState({ toastArray: [] });
    });

    it('renders nothing when the toast list is empty (empty list edge case)', () => {
        const { container } = render(<ToastContainer />);
        expect(container.firstChild).toBeEmptyDOMElement();
    });

    it('renders all toasts in the store (happy path)', () => {
        useToastStore.setState({
            toastArray: [
                { message: 'Primero', type: 'success', index: 0 },
                { message: 'Segundo', type: 'error', index: 1 },
            ],
        });

        render(<ToastContainer />);

        expect(screen.getByText('Primero')).toBeInTheDocument();
        expect(screen.getByText('Segundo')).toBeInTheDocument();
    });

    it('renders a toast added after mount', () => {
        render(<ToastContainer />);

        act(() => {
            useToastStore.getState().addToast('Nuevo toast', 'warning');
        });

        expect(screen.getByText('Nuevo toast')).toBeInTheDocument();
    });
});
