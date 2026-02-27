'use client';

import { FormEvent, useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Loader2, Sparkles, X, TriangleAlert, CheckCircle2 } from 'lucide-react';
import { useAiParse } from '@/hooks/useAi';
import { useAddExpense, useEditExpense, useCategories } from '@/hooks/useData';
import { Expense } from '@/types';
import { AiParseResponse } from '@/types/ai';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CURRENCIES, getCurrencySymbol } from '@/lib/currencies';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const expenseSchema = yup
  .object({
    amount: yup.number().typeError('Amount must be a number').positive('Amount must be positive').required('Amount is required'),
    currency: yup.string().default('USD'),
    date: yup.string().required('Date is required'),
    note: yup.string().required('Note/Merchant is required'),
    category_id: yup.string().required('Category is required'),
  })
  .required();

type ExpenseFormData = yup.InferType<typeof expenseSchema>;
type AddExpenseStep = 'ai' | 'form';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

const todayDate = () => new Date().toISOString().split('T')[0];

const toDateInputValue = (value: string | null) => {
  if (!value) return todayDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? todayDate() : parsed.toISOString().split('T')[0];
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
};

export function AddExpenseModal({ isOpen, onClose, expenseToEdit }: AddExpenseModalProps) {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [step, setStep] = useState<AddExpenseStep>(expenseToEdit ? 'form' : 'ai');
  const [parsedData, setParsedData] = useState<AiParseResponse | null>(null);
  const [aiParseError, setAiParseError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { categories, isLoading: isCategoriesLoading } = useCategories();
  const { trigger: parseAi, isMutating: isParsing } = useAiParse();
  const { trigger: saveExpense, isMutating: isSaving } = useAddExpense();
  const { trigger: editExpense, isMutating: isEditing } = useEditExpense();

  const isEditMode = Boolean(expenseToEdit);
  const isMutating = isSaving || isEditing;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      currency: 'USD',
      date: todayDate(),
      note: '',
      category_id: '',
    },
  });

  const selectedCurrency = useWatch({
    control,
    name: 'currency',
  }) || 'USD';

  useEffect(() => {
    if (!isOpen || !expenseToEdit) return;

    setValue('amount', expenseToEdit.amount);
    setValue('note', expenseToEdit.notes || expenseToEdit.note || '');
    setValue(
      'date',
      toDateInputValue(
        typeof expenseToEdit.date === 'string' ? expenseToEdit.date : expenseToEdit.date.toISOString()
      )
    );
    setValue('category_id', expenseToEdit.category_id || '');
    setValue('currency', expenseToEdit.currency || 'USD');
  }, [expenseToEdit, isOpen, setValue]);

  const handleDialogOpenChange = (open: boolean) => {
    if (open) return;
    handleClose();
  };

  const handleClose = () => {
    setNaturalLanguage('');
    setStep('ai');
    setParsedData(null);
    setAiParseError(null);
    setSubmitError(null);
    reset({
      amount: undefined,
      currency: 'USD',
      note: '',
      date: todayDate(),
      category_id: '',
    });
    onClose();
  };

  const handleBackToAi = () => {
    setStep('ai');
    setParsedData(null);
    setAiParseError(null);
    setSubmitError(null);
  };

  const handleAiParse = async (event: FormEvent) => {
    event.preventDefault();
    if (!naturalLanguage.trim()) return;

    setAiParseError(null);
    setSubmitError(null);
    try {
      const result = await parseAi({ raw_text: naturalLanguage.trim(), source: 'text' });
      setParsedData(result);
      setStep('form');

      if (typeof result.amount === 'number') setValue('amount', result.amount);
      if (result.currency && CURRENCIES.some((currency) => currency.code === result.currency)) {
        setValue('currency', result.currency);
      }
      const noteValue = result.note_summary || result.note || result.merchant || '';
      if (noteValue) setValue('note', noteValue);
      if (result.date) setValue('date', toDateInputValue(result.date));
      if (result.suggested_category_id) setValue('category_id', result.suggested_category_id);
    } catch (error) {
      setParsedData(null);
      setStep('form');
      setAiParseError(getErrorMessage(error, 'Failed to parse expense. Please enter details manually.'));
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitError(null);
    try {
      const selectedCategory = data.category_id || categories[0]?.id || '';
      const currency = data.currency || 'USD';
      const expenseData = {
        amount: Number(data.amount),
        currency,
        original_amount: currency !== 'USD' ? Number(data.amount) : undefined,
        exchange_rate: currency !== 'USD' ? 1 : undefined,
        notes: data.note || 'Expense',
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        category_id: selectedCategory,
      };

      if (isEditMode && expenseToEdit) {
        await editExpense({ id: expenseToEdit.id, ...expenseData });
      } else {
        await saveExpense(expenseData);
      }
      handleClose();
    } catch (error) {
      setSubmitError(getErrorMessage(error, isEditMode ? 'Failed to update expense.' : 'Failed to save expense.'));
    }
  };

  const showAiStep = !isEditMode && step === 'ai';

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border border-border bg-background shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'max-h-[90vh] overflow-hidden'
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold">
                {isEditMode ? 'Edit Expense' : 'Add Expense'}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {isEditMode ? 'Update a saved transaction.' : 'Capture your expense with AI or manual entry.'}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close expense modal">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <div className="max-h-[calc(90vh-5rem)] space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            {showAiStep ? (
              <form onSubmit={handleAiParse} className="space-y-4">
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">AI Assistant</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Describe your spend and we will prefill the form.
                    </p>
                    <textarea
                      value={naturalLanguage}
                      onChange={(event) => setNaturalLanguage(event.target.value)}
                      placeholder="Spent $45.50 on dinner at Mario's yesterday."
                      className="h-28 w-full rounded-lg border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="ghost" onClick={() => setStep('form')}>
                    Enter manually
                  </Button>
                  <Button type="submit" disabled={isParsing || !naturalLanguage.trim()}>
                    {isParsing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Auto-fill
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {parsedData ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle className="flex items-center gap-2">
                      Parsed with AI
                      <Badge variant="secondary">{Math.round(parsedData.confidence * 100)}% confidence</Badge>
                    </AlertTitle>
                    <AlertDescription>Review fields before saving.</AlertDescription>
                  </Alert>
                ) : null}

                {aiParseError ? (
                  <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>AI parse unavailable</AlertTitle>
                    <AlertDescription>{aiParseError}</AlertDescription>
                  </Alert>
                ) : null}

                {submitError ? (
                  <Alert variant="destructive">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>Unable to save expense</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <Card>
                  <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-sm font-medium" htmlFor="expense-amount">
                        Amount
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground">
                            {getCurrencySymbol(selectedCurrency)}
                          </span>
                          <input
                            id="expense-amount"
                            type="number"
                            step="0.01"
                            {...register('amount')}
                            className={cn(
                              'h-10 w-full rounded-md border bg-background pl-8 pr-3 text-sm',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                              errors.amount ? 'border-destructive' : 'border-border'
                            )}
                          />
                        </div>
                        <select
                          aria-label="Currency"
                          value={selectedCurrency}
                          onChange={(event) =>
                            setValue('currency', event.target.value, {
                              shouldDirty: true,
                            })
                          }
                          className="h-10 w-24 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
                    </div>

                    <div className="space-y-1.5 sm:col-span-1">
                      <label className="text-sm font-medium" htmlFor="expense-date">
                        Date
                      </label>
                      <input
                        id="expense-date"
                        type="date"
                        {...register('date')}
                        className={cn(
                          'h-10 w-full rounded-md border bg-background px-3 text-sm',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          errors.date ? 'border-destructive' : 'border-border'
                        )}
                      />
                      {errors.date ? <p className="text-xs text-destructive">{errors.date.message}</p> : null}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium" htmlFor="expense-note">
                        Merchant / Note
                      </label>
                      <input
                        id="expense-note"
                        type="text"
                        {...register('note')}
                        className={cn(
                          'h-10 w-full rounded-md border bg-background px-3 text-sm',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          errors.note ? 'border-destructive' : 'border-border'
                        )}
                      />
                      {errors.note ? <p className="text-xs text-destructive">{errors.note.message}</p> : null}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium" htmlFor="expense-category">
                        Category
                      </label>
                      {isCategoriesLoading ? (
                        <Skeleton className="h-10 w-full rounded-md" />
                      ) : (
                        <select
                          id="expense-category"
                          {...register('category_id')}
                          className={cn(
                            'h-10 w-full rounded-md border bg-background px-3 text-sm',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            errors.category_id ? 'border-destructive' : 'border-border'
                          )}
                        >
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.category_id ? (
                        <p className="text-xs text-destructive">{errors.category_id.message}</p>
                      ) : null}
                      {parsedData?.suggested_category_id ? (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Suggested:{' '}
                          {categories.find((category) => category.id === parsedData.suggested_category_id)?.name ||
                            'Category'}
                        </p>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap justify-end gap-2">
                  {!isEditMode ? (
                    <Button type="button" variant="outline" onClick={handleBackToAi}>
                      Back to AI
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving
                      </>
                    ) : isEditMode ? (
                      'Update'
                    ) : (
                      'Save'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
