import { render } from '@testing-library/react';
import { SpinnerComponent } from './SpinnerComponent';

describe('SpinnerComponent', () => {
    it('renders without crashing (smoke test)', () => {
        const { container } = render(<SpinnerComponent />);
        expect(container.firstChild).toBeInTheDocument();
        expect(container.firstChild.children).toHaveLength(2);
    });
});
