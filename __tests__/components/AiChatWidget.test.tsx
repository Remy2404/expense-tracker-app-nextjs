import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiChatWidget } from '@/components/AiChatWidget';
import type React from 'react';

const streamChatMock = jest.fn();
const getChatHistoryMock = jest.fn();
const connectMock = jest.fn();
const disconnectMock = jest.fn();
const subscribeMock = jest.fn(() => jest.fn());
const addExpenseTrigger = jest.fn();
const addBudgetTrigger = jest.fn();
const addGoalTrigger = jest.fn();
const addCategoryTrigger = jest.fn();
const addRecurringExpenseTrigger = jest.fn();
const mutateMock = jest.fn();

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'uid-1' },
  }),
}));

jest.mock('@/hooks/useData', () => ({
  useAddExpense: () => ({ trigger: addExpenseTrigger }),
  useAddBudget: () => ({ trigger: addBudgetTrigger }),
  useAddGoal: () => ({ trigger: addGoalTrigger }),
  useAddCategory: () => ({ trigger: addCategoryTrigger }),
  useAddRecurringExpense: () => ({ trigger: addRecurringExpenseTrigger }),
  useCategories: () => ({
    categories: [
      { id: 'cat-food', name: 'Food', icon: 'food', color: '#22c55e' },
      { id: 'cat-subscriptions', name: 'Subscriptions', icon: 'tv', color: '#6366F1' },
    ],
  }),
}));

jest.mock('@/lib/api/ai.api', () => ({
  aiApi: {
    streamChat: streamChatMock,
    getChatHistory: getChatHistoryMock,
  },
}));

jest.mock('@/lib/realtime/client', () => ({
  webRealtimeClient: {
    connect: connectMock,
    disconnect: disconnectMock,
    subscribe: subscribeMock,
  },
}));

jest.mock('swr', () => ({
  useSWRConfig: () => ({
    mutate: mutateMock,
  }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('AiChatWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getChatHistoryMock.mockResolvedValue({ messages: [] });
    connectMock.mockResolvedValue(undefined);
    addBudgetTrigger.mockResolvedValue({ action: 'created', budget: { id: 'budget-1' } });
    addExpenseTrigger.mockResolvedValue(undefined);
    addGoalTrigger.mockResolvedValue(undefined);
    addCategoryTrigger.mockResolvedValue(undefined);
    addRecurringExpenseTrigger.mockResolvedValue(undefined);
  });

  it('creates a budget from chat intent', async () => {
    const user = userEvent.setup();
    streamChatMock.mockResolvedValue({
      answer: '',
      query_used: 'action_intent_router',
      data_points: 8,
      confidence: 0.92,
      intent: 'add_budget',
      silent_action: true,
      payload: {
        kind: 'budget',
        type: null,
        amount: null,
        currency: null,
        category: null,
        categoryType: null,
        categoryId: null,
        note: null,
        noteSummary: null,
        date: null,
        merchant: null,
        month: '2026-03',
        totalAmount: 500,
      },
      explainability: null,
      suggested_actions: [],
      needs_confirmation: false,
      safety_warnings: [],
    });

    render(<AiChatWidget />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    await user.type(screen.getByLabelText(/message ai assistant/i), 'Create a budget of 500 for this month');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(addBudgetTrigger).toHaveBeenCalledWith({ month: '2026-03', total_amount: 500 });
    });
  });

  it('creates a goal from chat intent', async () => {
    const user = userEvent.setup();
    streamChatMock.mockResolvedValue({
      answer: '',
      query_used: 'action_intent_router',
      data_points: 8,
      confidence: 0.92,
      intent: 'add_goal',
      silent_action: true,
      payload: {
        kind: 'goal',
        type: null,
        amount: null,
        currency: null,
        category: null,
        categoryType: null,
        categoryId: null,
        note: null,
        noteSummary: null,
        date: null,
        merchant: null,
        name: 'Vacation Fund',
        targetAmount: 3000,
        currentAmount: 250,
        deadline: '2026-12-31',
        color: '#10B981',
        icon: 'target',
      },
      explainability: null,
      suggested_actions: [],
      needs_confirmation: false,
      safety_warnings: [],
    });

    render(<AiChatWidget />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    await user.type(screen.getByLabelText(/message ai assistant/i), 'Create a savings goal called Vacation Fund');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(addGoalTrigger).toHaveBeenCalledWith({
        name: 'Vacation Fund',
        target_amount: 3000,
        current_amount: 250,
        deadline: new Date('2026-12-31').toISOString(),
        color: '#10B981',
        icon: 'target',
      });
    });
  });

  it('creates a category from chat intent', async () => {
    const user = userEvent.setup();
    streamChatMock.mockResolvedValue({
      answer: '',
      query_used: 'action_intent_router',
      data_points: 8,
      confidence: 0.92,
      intent: 'add_category',
      silent_action: true,
      payload: {
        kind: 'category',
        type: null,
        amount: null,
        currency: null,
        category: null,
        categoryType: 'income',
        categoryId: null,
        note: null,
        noteSummary: null,
        date: null,
        merchant: null,
        name: 'Side Hustle',
        color: '#6366F1',
        icon: 'tag',
      },
      explainability: null,
      suggested_actions: [],
      needs_confirmation: false,
      safety_warnings: [],
    });

    render(<AiChatWidget />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    await user.type(screen.getByLabelText(/message ai assistant/i), 'Create an income category called Side Hustle');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(addCategoryTrigger).toHaveBeenCalledWith({
        name: 'Side Hustle',
        icon: 'tag',
        color: '#6366F1',
        type: 'income',
        is_default: false,
      });
    });
  });

  it('creates a recurring expense from chat intent', async () => {
    const user = userEvent.setup();
    streamChatMock.mockResolvedValue({
      answer: '',
      query_used: 'action_intent_router',
      data_points: 8,
      confidence: 0.92,
      intent: 'add_recurring_expense',
      silent_action: true,
      payload: {
        kind: 'recurring_expense',
        type: 'expense',
        amount: 12,
        currency: 'USD',
        category: 'Subscriptions',
        categoryType: 'expense',
        categoryId: null,
        note: 'Netflix',
        noteSummary: 'Netflix subscription',
        date: null,
        merchant: null,
        frequency: 'monthly',
        startDate: '2026-03-15',
        endDate: null,
        notificationEnabled: true,
        notificationDaysBefore: 1,
      },
      explainability: null,
      suggested_actions: [],
      needs_confirmation: false,
      safety_warnings: [],
    });

    render(<AiChatWidget />);
    await user.click(screen.getByRole('button', { name: /open ai assistant/i }));
    await user.type(screen.getByLabelText(/message ai assistant/i), 'Add a recurring expense of 12 dollars for Netflix');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(addRecurringExpenseTrigger).toHaveBeenCalledWith({
        amount: 12,
        category_id: 'cat-subscriptions',
        frequency: 'monthly',
        start_date: new Date('2026-03-15').toISOString(),
        end_date: undefined,
        notes: 'Netflix',
        notification_enabled: true,
        notification_days_before: 1,
        next_due_date: new Date('2026-03-15').toISOString(),
        is_active: true,
        currency: 'USD',
      });
    });
  });
});
