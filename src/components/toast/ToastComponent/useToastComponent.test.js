import { renderHook, act } from '@testing-library/react';
import { useToastComponent } from './useToastComponent';
import { useToastStore } from '../../../store/toastStore';

describe('useToastComponent', () => {
    beforeEach(() => {
        useToastStore.setState({ toastArray: [] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('starts visible and returns the handlers (happy path)', () => {
        const { result } = renderHook(() => useToastComponent('Mensaje', 'success', 0));

        expect(result.current.isVisible).toBe(true);
        expect(typeof result.current.hideToast).toBe('function');
        expect(typeof result.current.getToastClass).toBe('function');
    });

    it.each([
        ['success', 'successToast'],
        ['error', 'errorToast'],
        ['warning', 'warningToast'],
        ['unknown', 'defaultToast'],
        [undefined, 'defaultToast'],
    ])('returns the correct class for type %s', (type, expectedClass) => {
        const { result } = renderHook(() => useToastComponent('Mensaje', type, 0));

        expect(result.current.getToastClass()).toBe(expectedClass);
    });

    it('hides the toast and removes it from the store on hideToast', () => {
        useToastStore.setState({ toastArray: [{ message: 'Mensaje', type: 'success', index: 0 }] });
        const { result } = renderHook(() => useToastComponent('Mensaje', 'success', 0));

        act(() => {
            result.current.hideToast();
        });

        expect(result.current.isVisible).toBe(false);
        expect(useToastStore.getState().toastArray).toHaveLength(0);
    });

    it('does not remove other toasts when hiding one (multi toast edge case)', () => {
        useToastStore.setState({
            toastArray: [
                { message: 'Uno', type: 'success', index: 0 },
                { message: 'Dos', type: 'error', index: 1 },
            ],
        });
        const { result } = renderHook(() => useToastComponent('Dos', 'error', 1));

        act(() => {
            result.current.hideToast();
        });

        expect(useToastStore.getState().toastArray).toHaveLength(1);
    });

    it('auto-hides after 5 seconds (fake timers)', () => {
        jest.useFakeTimers();
        useToastStore.setState({ toastArray: [{ message: 'Mensaje', type: 'success', index: 0 }] });
        const { result } = renderHook(() => useToastComponent('Mensaje', 'success', 0));

        for (let second = 0; second < 5; second++) {
            act(() => {
                jest.advanceTimersByTime(1000);
            });
        }

        expect(result.current.isVisible).toBe(false);
        expect(useToastStore.getState().toastArray).toHaveLength(0);
    });
});
