'use client';

import { useMemo, useState } from 'react';
import { Plus, Target, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Goal } from '@/types/goals';
import { GoalModal } from '@/components/GoalModal';
import { useAddGoal, useDeleteGoal, useEditGoal, useGoals } from '@/hooks/useData';

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function GoalsPage() {
  const { goals, isLoading, isError } = useGoals();
  const { trigger: addGoal, isMutating: isAdding } = useAddGoal();
  const { trigger: editGoal, isMutating: isEditing } = useEditGoal();
  const { trigger: deleteGoal } = useDeleteGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSaving = isAdding || isEditing;

  const sortedGoals = useMemo(
    () => [...goals].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [goals]
  );

  const handleOpenCreate = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      setDeletingId(id);
      await deleteGoal({ id });
    } catch (error) {
      console.error('Failed to delete goal', error);
      alert('Failed to delete goal.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string;
    color: string;
    icon: string;
    is_archived?: boolean;
  }) => {
    try {
      const payload = {
        ...data,
        deadline: new Date(data.deadline).toISOString(),
      };

      if (goalToEdit) {
        await editGoal({ id: goalToEdit.id, ...payload });
      } else {
        await addGoal(payload);
      }

      setIsModalOpen(false);
      setGoalToEdit(null);
    } catch (error) {
      console.error('Failed to save goal', error);
      alert(goalToEdit ? 'Failed to update goal.' : 'Failed to create goal.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-foreground/60">Track your savings goals and progress.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={18} />
          Create Goal
        </button>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium">Failed to load goals.</p>
            <p className="text-foreground/60 text-sm mt-1">Please refresh and try again.</p>
          </div>
        ) : sortedGoals.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Target size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Create your first savings goal and start tracking your progress.
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Create Goal
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedGoals.map((goal) => {
              const progress = goal.target_amount > 0
                ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                : 0;

              return (
                <div key={goal.id} className="p-4 sm:p-6 hover:bg-foreground/5 transition-colors group">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: goal.color }} />
                        {goal.name}
                        {goal.is_archived && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/70">Archived</span>
                        )}
                      </h4>
                      <p className="text-sm text-foreground/60 mt-1">
                        Deadline: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}</p>
                      <p className="text-sm text-foreground/60">{progress.toFixed(0)}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-border rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex justify-end mt-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === goal.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setGoalToEdit(null);
        }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}
