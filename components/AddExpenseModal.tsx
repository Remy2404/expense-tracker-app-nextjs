'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { CheckCircle2, Loader2, Paperclip, Sparkles, TriangleAlert, Trash2, X } from 'lucide-react';
import { useAiParse } from '@/hooks/useAi';
import { useAddExpense, useEditExpense, useCategories } from '@/hooks/useData';
import {
  resolveReceiptPreviewUrl,
  toUploadErrorMessage,
  uploadReceiptFile,
  type UploadedReceipt,
} from '@/lib/media/imagekit-upload';
import { Expense, TransactionType } from '@/types';
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
import { getCategoryType, getTransactionType } from '@/lib/transactions';
import { cn } from '@/lib/utils';

type ExpenseFormData = {
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  note: string;
  category_id: string;
};

const expenseSchema: yup.ObjectSchema<ExpenseFormData> = yup
  .object({
    transaction_type: yup
      .mixed<TransactionType>()
      .oneOf(['expense', 'income'])
      .required('Transaction type is required'),
    amount: yup.number().typeError('Amount must be a number').positive('Amount must be positive').required('Amount is required'),
    currency: yup.string().default('USD').required(),
    date: yup.string().required('Date is required'),
    note: yup.string().defined().default(''),
    category_id: yup.string().required('Category is required'),
  })
  .required();
type AddExpenseStep = 'ai' | 'form';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

const todayDate = () => new Date().toISOString().split('T')[0];
const MAX_RECEIPTS = 5;
const transactionTypeOptions: Array<{ value: TransactionType; label: string }> = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

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
  const [receiptItems, setReceiptItems] = useState<UploadedReceipt[]>([]);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null);

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
      transaction_type: 'expense',
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
  const selectedTransactionType = useWatch({
    control,
    name: 'transaction_type',
  }) || 'expense';
  const selectedCategoryId = useWatch({
    control,
    name: 'category_id',
  }) || '';

  const categoriesForType = useMemo(() => {
    return categories.filter((category) => getCategoryType(category) === selectedTransactionType);
  }, [categories, selectedTransactionType]);

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
    setValue('transaction_type', getTransactionType(expenseToEdit));
  }, [expenseToEdit, isOpen, setValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;
    const initialReceiptPaths = expenseToEdit?.receipt_paths ?? [];

    const resolveExistingReceipts = async () => {
      if (initialReceiptPaths.length === 0) {
        if (!cancelled) {
          setReceiptItems([]);
        }
        return;
      }

      const resolvedItems = await Promise.all(
        initialReceiptPaths.map(async (path) => {
          try {
            const previewUrl = await resolveReceiptPreviewUrl(path);
            return { path, previewUrl };
          } catch {
            return { path, previewUrl: path };
          }
        })
      );

      if (!cancelled) {
        setReceiptItems(resolvedItems);
      }
    };

    void resolveExistingReceipts();

    return () => {
      cancelled = true;
    };
  }, [expenseToEdit, isOpen]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
    if (!selectedCategory) return;
    if (getCategoryType(selectedCategory) !== selectedTransactionType) {
      setValue('category_id', '', { shouldValidate: true, shouldDirty: true });
    }
  }, [categories, selectedCategoryId, selectedTransactionType, setValue]);

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
    setReceiptItems([]);
    setReceiptUploadError(null);
    setIsUploadingReceipt(false);
    reset({
      transaction_type: 'expense',
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

  const handleRemoveReceipt = (path: string) => {
    setReceiptUploadError(null);
    setReceiptItems((prev) => prev.filter((receipt) => receipt.path !== path));
  };

  const handleReceiptInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.currentTarget.value = '';

    if (selectedFiles.length === 0) {
      return;
    }

    setReceiptUploadError(null);
    const availableSlots = Math.max(0, MAX_RECEIPTS - receiptItems.length);
    if (availableSlots === 0) {
      setReceiptUploadError(`You can upload up to ${MAX_RECEIPTS} receipts.`);
      return;
    }

    const filesToUpload = selectedFiles.slice(0, availableSlots);
    if (selectedFiles.length > availableSlots) {
      setReceiptUploadError(`Only ${availableSlots} file(s) were uploaded due to the ${MAX_RECEIPTS} receipt limit.`);
    }

    setIsUploadingReceipt(true);
    const uploadedItems: UploadedReceipt[] = [];

    for (const file of filesToUpload) {
      try {
        const uploaded = await uploadReceiptFile(file);
        uploadedItems.push(uploaded);
      } catch (error) {
        setReceiptUploadError(toUploadErrorMessage(error, `Failed to upload ${file.name}.`));
      }
    }

    setIsUploadingReceipt(false);
    if (uploadedItems.length === 0) {
      return;
    }

    setReceiptItems((prev) => {
      const merged = [...prev];
      for (const item of uploadedItems) {
        if (!merged.some((existing) => existing.path === item.path)) {
          merged.push(item);
        }
      }
      return merged;
    });
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
      setAiParseError(getErrorMessage(error, 'Failed to parse transaction. Please enter details manually.'));
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitError(null);
    try {
      const fallbackCategory = categoriesForType[0]?.id || '';
      const selectedCategory = data.category_id || fallbackCategory;
      const currency = data.currency || 'USD';
      const expenseData = {
        amount: Number(data.amount),
        transaction_type: data.transaction_type,
        currency,
        original_amount: currency !== 'USD' ? Number(data.amount) : undefined,
        exchange_rate: currency !== 'USD' ? 1 : undefined,
        notes: data.note?.trim() ? data.note.trim() : undefined,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        category_id: selectedCategory,
        receipt_paths: receiptItems.map((item) => item.path),
      };

      if (isEditMode && expenseToEdit) {
        await editExpense({ id: expenseToEdit.id, ...expenseData });
      } else {
        await saveExpense(expenseData);
      }
      handleClose();
    } catch (error) {
      setSubmitError(
        getErrorMessage(error, isEditMode ? 'Failed to update transaction.' : 'Failed to save transaction.')
      );
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
                {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground">
                {isEditMode ? 'Update a saved transaction.' : 'Capture your income or expense with AI or manual entry.'}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Close transaction modal">
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
                      Describe your transaction and we will prefill the form.
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
                      {transactionTypeOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={selectedTransactionType === option.value ? 'default' : 'ghost'}
                          onClick={() =>
                            setValue('transaction_type', option.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    <textarea
                      value={naturalLanguage}
                      onChange={(event) => setNaturalLanguage(event.target.value)}
                      placeholder={
                        selectedTransactionType === 'income'
                          ? 'Received $1,250 freelance payment yesterday.'
                          : "Spent $45.50 on dinner at Mario's yesterday."
                      }
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
                    <AlertTitle>Unable to save transaction</AlertTitle>
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                ) : null}

                <Card>
                  <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-sm font-medium">Type</label>
                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
                        {transactionTypeOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={selectedTransactionType === option.value ? 'default' : 'ghost'}
                            onClick={() =>
                              setValue('transaction_type', option.value, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <input type="hidden" {...register('transaction_type')} />
                      {errors.transaction_type ? (
                        <p className="text-xs text-destructive">{errors.transaction_type.message}</p>
                      ) : null}
                    </div>

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
                          <option value="">Select {selectedTransactionType} category</option>
                          {categoriesForType.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.category_id ? (
                        <p className="text-xs text-destructive">{errors.category_id.message}</p>
                      ) : null}
                      {!isCategoriesLoading && categoriesForType.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No {selectedTransactionType} categories yet. Create one in Categories.
                        </p>
                      ) : null}
                      {parsedData?.suggested_category_id ? (
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Suggested:{' '}
                          {categoriesForType.find((category) => category.id === parsedData.suggested_category_id)?.name ||
                            'Category'}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="expense-receipt-upload">
                          Receipts
                        </label>
                        <span className="text-xs text-muted-foreground">
                          {receiptItems.length}/{MAX_RECEIPTS}
                        </span>
                      </div>

                      <label
                        htmlFor="expense-receipt-upload"
                        className={cn(
                          'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm',
                          'hover:bg-muted/60',
                          (isUploadingReceipt || receiptItems.length >= MAX_RECEIPTS) &&
                            'cursor-not-allowed opacity-50'
                        )}
                      >
                        {isUploadingReceipt ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                        {isUploadingReceipt ? 'Uploading...' : 'Upload receipt images'}
                        <input
                          id="expense-receipt-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic"
                          multiple
                          disabled={isUploadingReceipt || receiptItems.length >= MAX_RECEIPTS}
                          className="hidden"
                          onChange={handleReceiptInputChange}
                        />
                      </label>

                      {receiptItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {receiptItems.map((receipt) => (
                            <div key={receipt.path} className="relative overflow-hidden rounded-md border border-border">
                              <img
                                src={receipt.previewUrl}
                                alt="Receipt preview"
                                className="h-20 w-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveReceipt(receipt.path)}
                                aria-label="Remove receipt"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Optional. Attach receipts to keep proof with this transaction.
                        </p>
                      )}

                      {receiptUploadError ? (
                        <p className="text-xs text-destructive">{receiptUploadError}</p>
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
                  <Button type="submit" disabled={isMutating || isUploadingReceipt}>
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
