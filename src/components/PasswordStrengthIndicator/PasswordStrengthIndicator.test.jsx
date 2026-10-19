import { render, screen } from '@testing-library/react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
    it('renders no label for strength 0', () => {
        const { container } = render(<PasswordStrengthIndicator strength={0} />);
        expect(container.querySelector('.strengthMeterFill')).toHaveStyle({ width: '0%' });
        expect(screen.queryByText('Débil')).not.toBeInTheDocument();
    });

    it.each([
        [1, 'Débil'],
        [2, 'Regular'],
        [3, 'Fuerte'],
        [4, 'Muy Fuerte'],
    ])('renders label "%s" for strength %i (happy path)', (strength, label) => {
        render(<PasswordStrengthIndicator strength={strength} />);
        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('uses strength 0 when strength is undefined (null safety)', () => {
        const { container } = render(<PasswordStrengthIndicator strength={undefined} />);
        expect(container.querySelector('.strengthMeterFill')).toHaveStyle({ width: '0%' });
    });

    it('clamps negative values to level 0 (edge case)', () => {
        const { container } = render(<PasswordStrengthIndicator strength={-3} />);
        expect(container.querySelector('.strengthMeterFill')).toHaveStyle({ width: '0%' });
        expect(screen.queryByText('Débil')).not.toBeInTheDocument();
    });

    it('clamps values above 4 to the maximum level (edge case)', () => {
        const { container } = render(<PasswordStrengthIndicator strength={99} />);
        expect(container.querySelector('.strengthMeterFill')).toHaveStyle({ width: '100%' });
        expect(screen.getByText('Muy Fuerte')).toBeInTheDocument();
    });
});
