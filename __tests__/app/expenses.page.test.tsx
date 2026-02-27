import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpensesPage from '@/app/(app)/expenses/page';
import { useCategories, useDeleteExpense, useExpenses } from '@/hooks/useData';

const replaceMock = jest.fn();
let currentSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  usePathname: () => '/expenses',
  useSearchParams: () => currentSearchParams,
}));

jest.mock('@/hooks/useData', () => ({
  useExpenses: jest.fn(),
  useCategories: jest.fn(),
  useDeleteExpense: jest.fn(),
}));

jest.mock('@/components/AddExpenseModal', () => ({
  AddExpenseModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='add-expense-modal'>Add expense modal</div> : null,
}));

jest.mock('@/components/expenses/DeleteExpenseDialog', () => ({
  DeleteExpenseDialog: () => null,
}));

jest.mock('@/lib/export', () => ({
  buildExpenseCsv: jest.fn(() => 'csv'),
  downloadFile: jest.fn(),
}));

jest.mock('@/lib/export-pdf', () => ({
  exportExpensesAsPdf: jest.fn(),
}));

const mockUseExpenses = useExpenses as jest.Mock;
const mockUseCategories = useCategories as jest.Mock;
const mockUseDeleteExpense = useDeleteExpense as jest.Mock;

describe('ExpensesPage', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    currentSearchParams = new URLSearchParams();

    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: 'exp-1',
          amount: 12,
          date: '2025-01-10T00:00:00.000Z',
          notes: 'Coffee beans',
          category_id: 'cat-food',
          currency: 'USD',
        },
        {
          id: 'exp-2',
          amount: 950,
          date: '2025-01-11T00:00:00.000Z',
          notes: 'Rent payment',
          category_id: 'cat-home',
          currency: 'USD',
        },
      ],
      isLoading: false,
      isError: undefined,
    });
    mockUseCategories.mockReturnValue({
      categories: [
        { id: 'cat-food', name: 'Food', icon: 'utensils', color: '#fff' },
        { id: 'cat-home', name: 'Home', icon: 'house', color: '#fff' },
      ],
    });
    mockUseDeleteExpense.mockReturnValue({ trigger: jest.fn() });
  });

  it('hydrates filters from URL params and reflects filtered count', async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams('q=coffee&minAmount=10');

    render(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: /Filter/ }));

    expect(screen.getByPlaceholderText('Search merchant or note')).toHaveValue('coffee');
    expect(screen.getByPlaceholderText('Min amount')).toHaveValue(10);
    expect(screen.getByText('1 matching expenses')).toBeInTheDocument();
  });

  it('persists query filter to URL with router.replace', async () => {
    const user = userEvent.setup();
    render(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    await user.type(screen.getByPlaceholderText('Search merchant or note'), 'rent');

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalled();
    });

    const [lastUrl, options] = replaceMock.mock.calls.at(-1) as [string, { scroll: boolean }];
    expect(lastUrl).toBe('/expenses?q=rent');
    expect(options).toEqual({ scroll: false });
  });

  it('clears filters and removes query params from URL', async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams('q=coffee&minAmount=10');

    render(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: /Filter/ }));
    replaceMock.mockClear();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/expenses', { scroll: false });
    });
  });

  it('opens add expense modal when user clicks add', async () => {
    const user = userEvent.setup();
    render(<ExpensesPage />);

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByTestId('add-expense-modal')).toBeInTheDocument();
  });
});
