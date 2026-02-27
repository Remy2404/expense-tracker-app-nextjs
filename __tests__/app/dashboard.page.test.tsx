import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '@/app/(app)/dashboard/page';
import { useExpenses, useBudgets, useCategories } from '@/hooks/useData';
import { useAiNudges } from '@/hooks/useAi';

jest.mock('@/hooks/useData', () => ({
  useExpenses: jest.fn(),
  useBudgets: jest.fn(),
  useCategories: jest.fn(),
}));

jest.mock('@/hooks/useAi', () => ({
  useAiNudges: jest.fn(),
}));

jest.mock('@/components/AddExpenseModal', () => ({
  AddExpenseModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid='add-expense-modal'>Add expense modal</div> : null,
}));

const mockUseExpenses = useExpenses as jest.Mock;
const mockUseBudgets = useBudgets as jest.Mock;
const mockUseCategories = useCategories as jest.Mock;
const mockUseAiNudges = useAiNudges as jest.Mock;

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseExpenses.mockReturnValue({ expenses: [], isLoading: false });
    mockUseBudgets.mockReturnValue({ budgets: [], isLoading: false });
    mockUseCategories.mockReturnValue({ categories: [], isLoading: false });
    mockUseAiNudges.mockReturnValue({ data: { nudges: [] }, isLoading: false });
  });

  it('renders loading state while dashboard data is loading', () => {
    mockUseExpenses.mockReturnValue({ expenses: [], isLoading: true });

    const { container } = render(<DashboardPage />);

    expect(screen.queryByText('Total Spent')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders current month summary metrics when data is available', () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonthDate = '2024-01-01T00:00:00.000Z';

    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: 'exp-1',
          amount: 50,
          date: `${currentMonth}-10T12:00:00.000Z`,
          notes: 'Groceries',
          category_id: 'cat-food',
          currency: 'USD',
        },
        {
          id: 'exp-2',
          amount: 25,
          date: `${currentMonth}-12T09:00:00.000Z`,
          notes: 'Lunch',
          category_id: 'cat-food',
          currency: 'USD',
        },
        {
          id: 'exp-3',
          amount: 300,
          date: previousMonthDate,
          notes: 'Old rent',
          category_id: 'cat-rent',
          currency: 'USD',
        },
      ],
      isLoading: false,
    });
    mockUseBudgets.mockReturnValue({
      budgets: [{ id: 'budget-1', month: currentMonth, total_amount: 500 }],
      isLoading: false,
    });
    mockUseCategories.mockReturnValue({
      categories: [
        { id: 'cat-food', name: 'Food', icon: 'utensils', color: '#fff' },
        { id: 'cat-rent', name: 'Rent', icon: 'home', color: '#fff' },
      ],
      isLoading: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getAllByText('$75.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$425.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('opens add expense modal when user clicks new expense', async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole('button', { name: /add a new expense/i }));

    expect(screen.getByTestId('add-expense-modal')).toBeInTheDocument();
  });
});
