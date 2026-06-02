import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "@/app/(app)/dashboard/page";
import { useDashboardCoreSummary } from "@/hooks/useData";
import { useAiNudges } from "@/hooks/useAi";

jest.mock("@/hooks/useData", () => ({
  useDashboardCoreSummary: jest.fn(),
}));

jest.mock("@/hooks/useAi", () => ({
  useAiNudges: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("@/components/AddExpenseModal", () => ({
  AddExpenseModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="add-expense-modal">Add expense modal</div> : null,
}));

const mockUseDashboardCoreSummary = useDashboardCoreSummary as jest.Mock;
const mockUseAiNudges = useAiNudges as jest.Mock;

const defaultSummary = {
  totalIncome: 1000,
  totalExpense: 375,
  balance: 625,
  transactionCount: 3,
  monthlyIncome: 250,
  monthlyExpense: 75,
  budgetSummary: {
    month: "2026-04",
    budgetLimit: 500,
    spent: 75,
    remaining: 425,
  },
  recentTransactions: [
    {
      id: "exp-1",
      amount: 50,
      transactionType: "EXPENSE",
      currency: "USD",
      merchant: "Market",
      date: "2026-04-10T12:00:00.000Z",
      note: "Groceries",
      noteSummary: "Groceries",
      categoryId: "cat-food",
      isDeleted: false,
      categoryName: "Food",
    },
  ],
  recentCategories: [{ id: "cat-food", name: "Food" }],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    mockUseDashboardCoreSummary.mockReturnValue({
      summary: defaultSummary,
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

  it("renders loading state while dashboard core summary is loading", () => {
    mockUseDashboardCoreSummary.mockReturnValue({
      summary: null,
      isLoading: true,
      isError: false,
      mutate: jest.fn(),
    });

    const { container } = render(<DashboardPage />);

    expect(screen.queryByText("Income")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders core metrics and recent transactions from summary endpoint", () => {
    render(<DashboardPage />);

    expect(screen.getByText("Income")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("+$1000.00")).toBeInTheDocument();
    expect(screen.getByText("-$375.00")).toBeInTheDocument();
    expect(screen.getByText("3 transactions")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("opens add expense modal when user clicks new transaction", async () => {
    const user = userEvent.setup();
    render(<DashboardPage />);

    await user.click(screen.getByRole("button", { name: /add a new transaction/i }));

    expect(screen.getByTestId("add-expense-modal")).toBeInTheDocument();
  });

  it("shows empty recent transaction state when summary has none", () => {
    mockUseDashboardCoreSummary.mockReturnValue({
      summary: {
        ...defaultSummary,
        transactionCount: 0,
        recentTransactions: [],
        recentCategories: [],
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("No recent transactions")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first transaction to start tracking monthly trends."),
    ).toBeInTheDocument();
  });

  it("renders dashboard error state when core summary request fails", () => {
    mockUseDashboardCoreSummary.mockReturnValue({
      summary: null,
      isLoading: false,
      isError: new Error("dashboard failed"),
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("Failed to load dashboard data")).toBeInTheDocument();
  });

  it("shows a neutral AI nudges unavailable state instead of a destructive error box", () => {
    mockUseAiNudges.mockReturnValue({
      data: { nudges: [], generated_at: "2026-03-16T00:00:00Z" },
      isLoading: false,
      error: new Error("nudges unavailable"),
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("AI insights temporarily unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Recommendations are not ready right now. Try refreshing in a moment.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Unable to load AI nudges")).not.toBeInTheDocument();
  });

  it("renders transaction date and amount list row from summary recent transactions", () => {
    render(<DashboardPage />);
    const recentTransactionsList = screen.getByLabelText("Recent transactions list");
    const items = within(recentTransactionsList).getAllByRole("listitem");
    expect(items.length).toBe(1);
    expect(within(items[0]).getByText("-$50.00")).toBeInTheDocument();
  });

  it("replaces a generic transaction note with a readable category fallback", () => {
    mockUseDashboardCoreSummary.mockReturnValue({
      summary: {
        ...defaultSummary,
        recentTransactions: [
          {
            ...defaultSummary.recentTransactions[0],
            note: "Transaction",
            noteSummary: "AI transaction",
            merchant: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
      mutate: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText("Food expense")).toBeInTheDocument();
    expect(screen.queryByText("Transaction")).not.toBeInTheDocument();
  });
});
