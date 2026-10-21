import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationComponent } from './PaginationComponent';

const renderPagination = (props) => render(<PaginationComponent {...props} />);

describe('PaginationComponent', () => {
    it('renders the page buttons and the navigation buttons (happy path)', () => {
        renderPagination({ currentPage: 1, totalPages: 10, onPageChange: jest.fn() });

        expect(screen.getByRole('navigation')).toBeInTheDocument();
        expect(screen.getByLabelText('Primera página')).toBeInTheDocument();
        expect(screen.getByLabelText('Última página')).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /^Página/ })).toHaveLength(5);
    });

    it('shows the first 5 pages when it is on the first page (happy path)', () => {
        renderPagination({ currentPage: 1, totalPages: 10, onPageChange: jest.fn() });

        expect(screen.getByLabelText('Página 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Página 5')).toBeInTheDocument();
        expect(screen.queryByLabelText('Página 6')).not.toBeInTheDocument();
    });

    it('highlights the current page (happy path)', () => {
        renderPagination({ currentPage: 3, totalPages: 10, onPageChange: jest.fn() });

        expect(screen.getByLabelText('Página 3')).toHaveAttribute('aria-current', 'page');
        expect(screen.getByLabelText('Página 2')).not.toHaveAttribute('aria-current');
    });

    it('disables the first page button on the first page (edge case)', () => {
        renderPagination({ currentPage: 1, totalPages: 10, onPageChange: jest.fn() });

        expect(screen.getByLabelText('Primera página')).toBeDisabled();
        expect(screen.getByLabelText('Última página')).not.toBeDisabled();
    });

    it('disables the last page button on the last page (edge case)', () => {
        renderPagination({ currentPage: 10, totalPages: 10, onPageChange: jest.fn() });

        expect(screen.getByLabelText('Última página')).toBeDisabled();
        expect(screen.getByLabelText('Primera página')).not.toBeDisabled();
    });

    it('renders nothing when there is only one page (edge case)', () => {
        const { container } = renderPagination({ currentPage: 1, totalPages: 1, onPageChange: jest.fn() });

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when there are no pages (negative case)', () => {
        const { container } = renderPagination({ currentPage: 1, totalPages: 0, onPageChange: jest.fn() });

        expect(container).toBeEmptyDOMElement();
    });

    it('shows fewer buttons when there are less than 5 pages (edge case)', () => {
        renderPagination({ currentPage: 1, totalPages: 3, onPageChange: jest.fn() });

        expect(screen.getAllByRole('button', { name: /^Página/ })).toHaveLength(3);
    });

    it('calls onPageChange with the clicked page (happy path)', () => {
        const onPageChange = jest.fn();
        renderPagination({ currentPage: 1, totalPages: 10, onPageChange });

        fireEvent.click(screen.getByLabelText('Página 3'));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('calls onPageChange with the first page (happy path)', () => {
        const onPageChange = jest.fn();
        renderPagination({ currentPage: 4, totalPages: 10, onPageChange });

        fireEvent.click(screen.getByLabelText('Primera página'));

        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('calls onPageChange with the last page (happy path)', () => {
        const onPageChange = jest.fn();
        renderPagination({ currentPage: 4, totalPages: 10, onPageChange });

        fireEvent.click(screen.getByLabelText('Última página'));

        expect(onPageChange).toHaveBeenCalledWith(10);
    });

    it('does not call onPageChange when clicking the current page (negative case)', () => {
        const onPageChange = jest.fn();
        renderPagination({ currentPage: 3, totalPages: 10, onPageChange });

        fireEvent.click(screen.getByLabelText('Página 3'));

        expect(onPageChange).not.toHaveBeenCalled();
    });
});
