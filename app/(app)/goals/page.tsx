'use client';

import { useMemo, useState, type CSSProperties, type ComponentType, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  Loader2,
  Plane,
  Car,
  Home,
  GraduationCap,
  Heart,
  ShoppingBag,
  Laptop,
  Gamepad2,
  Gift,
  PiggyBank,
  Wallet,
  Briefcase,
  Dumbbell,
  Music,
  Camera,
  Book,
  Coffee,
  Utensils,
  Baby,
  PawPrint,
  Sparkles,
  Sun,
  Moon,
  Star,
  Zap,
  Trophy,
  Flag,
  Compass,
} from 'lucide-react';
import { Goal } from '@/types/goals';
import { GoalModal } from '@/components/GoalModal';
import { EmptyState } from '@/components/state/EmptyState';
import { ErrorState } from '@/components/state/ErrorState';
import { useAddGoal, useDeleteGoal, useEditGoal, useGoals } from '@/hooks/useData';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ICON_MAP: Record<
  string,
  ComponentType<{ size?: number; className?: string; style?: CSSProperties }>
> = {
  target: Target,
  plane: Plane,
  car: Car,
  home: Home,
  graduation: GraduationCap,
  heart: Heart,
  shopping: ShoppingBag,
  laptop: Laptop,
  game: Gamepad2,
  gift: Gift,
  piggybank: PiggyBank,
  wallet: Wallet,
  briefcase: Briefcase,
  dumbbell: Dumbbell,
  music: Music,
  camera: Camera,
  book: Book,
  coffee: Coffee,
  food: Utensils,
  baby: Baby,
  pet: PawPrint,
  sparkles: Sparkles,
  sun: Sun,
  moon: Moon,
  star: Star,
  zap: Zap,
  trophy: Trophy,
  flag: Flag,
  compass: Compass,
};

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function GoalsPage() {
  const { goals, isLoading, isError, mutate } = useGoals();
  const { trigger: addGoal, isMutating: isAdding } = useAddGoal();
  const { trigger: editGoal, isMutating: isEditing } = useEditGoal();
  const { trigger: deleteGoal } = useDeleteGoal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSaving = isAdding || isEditing;

  const sortedGoals = useMemo(
    () =>
      [...goals].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [goals]
  );

  const archivedCount = useMemo(() => sortedGoals.filter((goal) => goal.is_archived).length, [
    sortedGoals,
  ]);

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

  const stopRowNavigation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Track your savings goals and progress.</p>
        </div>
        <Button onClick={handleOpenCreate} className="whitespace-nowrap">
          <Plus size={18} />
          Create Goal
        </Button>
      </div>

      {!isLoading && !isError && archivedCount > 0 ? (
        <Alert>
          <div className="flex items-center justify-between gap-3">
            <div>
              <AlertTitle>Archived Goals</AlertTitle>
              <AlertDescription>
                You have archived goals in this list. Open a goal to review or reactivate it.
              </AlertDescription>
            </div>
            <Badge variant="secondary">{archivedCount}</Badge>
          </div>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Savings Goals</CardTitle>
          <CardDescription>{sortedGoals.length} goals</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`goal-skeleton-${index}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
            ))}
          </CardContent>
        ) : isError ? (
          <CardContent>
            <ErrorState
              title="Failed to load goals."
              description="Please refresh and try again."
              onRetry={() => {
                void mutate();
              }}
            />
          </CardContent>
        ) : sortedGoals.length === 0 ? (
          <CardContent>
            <EmptyState
              title="No goals yet"
              description="Create your first savings goal and start tracking your progress."
              actionLabel="Create Goal"
              onAction={handleOpenCreate}
            />
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {sortedGoals.map((goal) => {
              const progress =
                goal.target_amount > 0
                  ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  : 0;
              const IconComponent = ICON_MAP[goal.icon] || Target;

              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="block p-4 sm:p-6 hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${goal.color}1f` }}
                      >
                        <IconComponent size={20} style={{ color: goal.color }} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                          <span className="truncate">{goal.name}</span>
                          {goal.is_archived ? <Badge variant="secondary">Archived</Badge> : null}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Deadline: {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        {formatMoney(goal.current_amount)} / {formatMoney(goal.target_amount)}
                      </p>
                      <div className="flex justify-end mt-1">
                        <Badge variant={progress >= 100 ? 'secondary' : 'outline'}>
                          {progress.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%`, backgroundColor: goal.color }}
                    />
                  </div>

                  <div className="flex justify-end mt-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        stopRowNavigation(event);
                        handleEdit(goal);
                      }}
                      className="h-8 w-8"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        stopRowNavigation(event);
                        void handleDelete(goal.id);
                      }}
                      disabled={deletingId === goal.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete"
                    >
                      {deletingId === goal.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

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
