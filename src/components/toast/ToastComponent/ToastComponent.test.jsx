import { render, screen, fireEvent, act } from '@testing-library/react';
import { ToastComponent } from './ToastComponent';
import { useToastStore } from '../../../store/toastStore';

describe('ToastComponent', () => {
    beforeEach(() => {
        useToastStore.setState({ toastArray: [] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('renders the message and the close button (happy path)', () => {
        render(<ToastComponent message="Producto guardado" type="success" index={0} />);
        expect(screen.getByText('Producto guardado')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveTextContent('×');
    });

    it.each([
        ['success', 'successToast'],
        ['error', 'errorToast'],
        ['warning', 'warningToast'],
        ['info', 'defaultToast'],
        [undefined, 'defaultToast'],
    ])('applies the correct class for type %s (edge case)', (type, expectedClass) => {
        render(<ToastComponent message="Mensaje" type={type} index={0} />);
        expect(screen.getByText('Mensaje').parentElement).toHaveClass(expectedClass);
    });

    it('removes the toast from the store after the exit animation when the close button is clicked', () => {
        jest.useFakeTimers();
        useToastStore.setState({ toastArray: [{ message: 'Mensaje', type: 'success', index: 0 }] });
        render(<ToastComponent message="Mensaje" type="success" index={0} />);

        fireEvent.click(screen.getByRole('button'));

        expect(useToastStore.getState().toastArray).toHaveLength(1);

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(useToastStore.getState().toastArray).toHaveLength(0);
    });

    it('renders a very long message without crashing (text overflow edge case)', () => {
        const longMessage = 'Error '.repeat(300);
        render(<ToastComponent message={longMessage} type="error" index={0} />);
        expect(screen.getByText(longMessage.trim())).toBeInTheDocument();
    });

    it('auto-hides after 5 seconds', () => {
        jest.useFakeTimers();
        useToastStore.setState({ toastArray: [{ message: 'Mensaje', type: 'success', index: 0 }] });
        render(<ToastComponent message="Mensaje" type="success" index={0} />);

        for (let second = 0; second < 5; second++) {
            act(() => {
                jest.advanceTimersByTime(1000);
            });
        }

        act(() => {
            jest.advanceTimersByTime(400);
        });

        expect(useToastStore.getState().toastArray).toHaveLength(0);
    });

    it('stays visible before the 5 second limit', () => {
        jest.useFakeTimers();
        useToastStore.setState({ toastArray: [{ message: 'Mensaje', type: 'success', index: 0 }] });
        render(<ToastComponent message="Mensaje" type="success" index={0} />);

        act(() => {
            jest.advanceTimersByTime(3000);
        });

        expect(useToastStore.getState().toastArray).toHaveLength(1);
    });
});
