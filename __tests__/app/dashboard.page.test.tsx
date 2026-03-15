import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/(app)/dashboard/page";
import {
  useBudgetSummary,
  useCategories,
  useDashboardSummary,
  useExpenses,
} from "@/hooks/useData";
import { useAiNudges } from "@/hooks/useAi";

jest.mock("@/hooks/useData", () => ({
  useExpenses: jest.fn(),
  useCategories: jest.fn(),
  useDashboardSummary: jest.fn(),
  useBudgetSummary: jest.fn(),
}));

jest.mock("@/hooks/useAi", () => ({
  useAiNudges: jest.fn(),
}));

jest.mock("@/components/AddExpenseModal", () => ({
  AddExpenseModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? (
      <div data-testid="add-expense-modal">Add expense modal</div>
    ) : null,
}));

const mockUseExpenses = useExpenses as jest.Mock;
const mockUseCategories = useCategories as jest.Mock;
const mockUseDashboardSummary = useDashboardSummary as jest.Mock;
const mockUseBudgetSummary = useBudgetSummary as jest.Mock;
const mockUseAiNudges = useAiNudges as jest.Mock;

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUseExpenses.mockReturnValue({
      expenses: [],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseCategories.mockReturnValue({
      categories: [],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseDashboardSummary.mockReturnValue({
      summary: null,
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseBudgetSummary.mockReturnValue({
      summary: null,
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseAiNudges.mockReturnValue({
      data: { nudges: [], generated_at: "2026-03-16T00:00:00Z" },
      isLoading: false,
      error: null,
      mutate: jest.fn(),
    });
  });

  it("renders loading state while dashboard data is loading", () => {
    mockUseExpenses.mockReturnValue({ expenses: [], isLoading: true });

    const { container } = render(<DashboardPage />);

    expect(screen.queryByText("Income")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("renders current month summary metrics when data is available", () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonthDate = "2024-01-01T00:00:00.000Z";

    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: "exp-1",
          amount: 50,
          date: `${currentMonth}-10T12:00:00.000Z`,
          notes: "Groceries",
          category_id: "cat-food",
          currency: "USD",
        },
        {
          id: "exp-2",
          amount: 25,
          date: `${currentMonth}-12T09:00:00.000Z`,
          notes: "Lunch",
          category_id: "cat-food",
          currency: "USD",
        },
        {
          id: "exp-3",
          amount: 300,
          date: previousMonthDate,
          notes: "Old rent",
          category_id: "cat-rent",
          currency: "USD",
        },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseCategories.mockReturnValue({
      categories: [
        { id: "cat-food", name: "Food", icon: "utensils", color: "#fff" },
        { id: "cat-rent", name: "Rent", icon: "home", color: "#fff" },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseDashboardSummary.mockReturnValue({
      summary: {
        transactionCount: 100,
        totalIncome: 0,
        totalExpense: 375,
        balance: -375,
        monthlyIncome: 0,
        monthlyExpense: 75,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseBudgetSummary.mockReturnValue({
      summary: {
        budgetLimit: 500,
        spent: 75,
        remaining: 425,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getAllByText("-$375.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+$0.00").length).toBeGreaterThan(0);
    expect(screen.getByText("100 transactions")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });

  it("opens add expense modal when user clicks new transaction", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(
      screen.getByRole("button", { name: /add a new transaction/i }),
    );

    expect(screen.getByTestId("add-expense-modal")).toBeInTheDocument();
  });

  it("uses category fallback for recent transaction titles when notes are empty", () => {
    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: "exp-1",
          amount: 12.5,
          date: "2026-03-09T12:00:00.000Z",
          notes: "",
          merchant: "",
          category_id: "cat-business",
          currency: "USD",
        },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseCategories.mockReturnValue({
      categories: [
        {
          id: "cat-business",
          name: "Business",
          icon: "briefcase",
          color: "#fff",
        },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseDashboardSummary.mockReturnValue({
      summary: {
        transactionCount: 1,
        totalIncome: 0,
        totalExpense: 12.5,
        balance: -12.5,
        monthlyIncome: 0,
        monthlyExpense: 12.5,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseBudgetSummary.mockReturnValue({
      summary: {
        budgetLimit: 0,
        spent: 12.5,
        remaining: -12.5,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    const recentTransactionsList = screen.getByLabelText(
      "Recent transactions list",
    );

    expect(
      within(recentTransactionsList).getAllByText("Business"),
    ).toHaveLength(2);
    expect(
      within(recentTransactionsList).queryByText(/^Transaction$/),
    ).not.toBeInTheDocument();
  });

  it("orders recent transactions by transaction datetime (not updated time)", () => {
    mockUseExpenses.mockReturnValue({
      expenses: [
        {
          id: "older-transaction",
          amount: 10,
          date: "2026-03-09T10:00:00.000Z",
          notes: "Older transaction date",
          updated_at: "2026-03-11T11:00:00.000Z",
          category_id: "cat-food",
          currency: "USD",
        },
        {
          id: "newer-transaction",
          amount: 12,
          date: "2026-03-10T10:00:00.000Z",
          notes: "Newer transaction date",
          updated_at: "2026-03-09T11:00:00.000Z",
          category_id: "cat-food",
          currency: "USD",
        },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseCategories.mockReturnValue({
      categories: [
        { id: "cat-food", name: "Food", icon: "utensils", color: "#fff" },
      ],
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseDashboardSummary.mockReturnValue({
      summary: {
        transactionCount: 2,
        totalIncome: 0,
        totalExpense: 22,
        balance: -22,
        monthlyIncome: 0,
        monthlyExpense: 22,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });
    mockUseBudgetSummary.mockReturnValue({
      summary: {
        budgetLimit: 0,
        spent: 22,
        remaining: -22,
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    const recentTransactionsList = screen.getByLabelText(
      "Recent transactions list",
    );
    const items = within(recentTransactionsList).getAllByRole("listitem");

    expect(
      within(items[0]).getByText("Newer transaction date"),
    ).toBeInTheDocument();
    expect(
      within(items[1]).getByText("Older transaction date"),
    ).toBeInTheDocument();
  });

  it("shows a neutral AI nudges unavailable state instead of a destructive error box", () => {
    mockUseAiNudges.mockReturnValue({
      data: { nudges: [], generated_at: "2026-03-16T00:00:00Z" },
      isLoading: false,
      error: new Error("nudges unavailable"),
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(
      screen.getByText("AI insights temporarily unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Recommendations are not ready right now. Try refreshing in a moment.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Unable to load AI nudges"),
    ).not.toBeInTheDocument();
  });
});
