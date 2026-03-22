import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalDetailPage from '@/app/(app)/goals/[id]/page';
import {
  useAddGoalTransaction,
  useDeleteGoal,
  useEditGoal,
  useGoalTransactions,
  useGoals,
} from '@/hooks/useData';

jest.mock('next/navigation', () => ({
  useParams: () => ({
    id: 'goal-1',
  }),
}));

jest.mock('@/hooks/useData', () => ({
  useGoals: jest.fn(),
  useDeleteGoal: jest.fn(),
  useEditGoal: jest.fn(),
  useGoalTransactions: jest.fn(),
  useAddGoalTransaction: jest.fn(),
}));

jest.mock('@/components/GoalModal', () => ({
  GoalModal: () => null,
}));

const mockUseGoals = useGoals as jest.Mock;
const mockUseDeleteGoal = useDeleteGoal as jest.Mock;
const mockUseEditGoal = useEditGoal as jest.Mock;
const mockUseGoalTransactions = useGoalTransactions as jest.Mock;
const mockUseAddGoalTransaction = useAddGoalTransaction as jest.Mock;

describe('GoalDetailPage', () => {
  const alertMock = jest.fn();

  beforeEach(() => {
    alertMock.mockReset();
    window.alert = alertMock;

    mockUseGoals.mockReturnValue({
      goals: [
        {
          id: 'goal-1',
          name: 'New Car',
          target_amount: 1513,
          current_amount: 1512,
          deadline: '2026-08-07T00:00:00.000Z',
          color: '#10B981',
          icon: 'target',
          is_archived: false,
        },
      ],
      isLoading: false,
    });
    mockUseDeleteGoal.mockReturnValue({
      trigger: jest.fn(),
    });
    mockUseEditGoal.mockReturnValue({
      trigger: jest.fn(),
      isMutating: false,
    });
    mockUseGoalTransactions.mockReturnValue({
      transactions: [],
      isLoading: false,
    });
    mockUseAddGoalTransaction.mockReturnValue({
      trigger: jest.fn().mockResolvedValue({
        id: 'tx-1',
      }),
      isMutating: false,
    });
  });

  it('opens the transaction modal in withdraw mode from the withdraw button', async () => {
    const user = userEvent.setup();

    render(<GoalDetailPage />);

    await user.click(screen.getByRole('button', { name: /Withdraw/i }));

    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByRole('heading', { name: 'Withdraw from Goal' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Withdraw' })).toBeInTheDocument();
  });

  it('submits a deposit with the next balance and shows the goal completion alert', async () => {
    const user = userEvent.setup();
    const triggerMock = jest.fn().mockResolvedValue({ id: 'tx-2' });
    mockUseAddGoalTransaction.mockReturnValue({
      trigger: triggerMock,
      isMutating: false,
    });

    render(<GoalDetailPage />);

    await user.click(screen.getByRole('button', { name: 'Add Money' }));
    const dialog = screen.getByRole('dialog');

    await user.type(within(dialog).getByLabelText('Amount *'), '2');
    await user.click(within(dialog).getByRole('button', { name: 'Add Money' }));

    await waitFor(() => {
      expect(triggerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          goal_id: 'goal-1',
          amount: 2,
          type: 'deposit',
          new_balance: 1514,
        }),
      );
    });

    expect(alertMock).toHaveBeenCalledWith('Congratulations! You have reached your savings goal!');
  });
});
