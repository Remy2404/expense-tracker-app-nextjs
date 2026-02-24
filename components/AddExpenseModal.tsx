'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useAiParse } from '@/hooks/useAi';
import { useAddExpense, useEditExpense, useCategories } from '@/hooks/useData';
import { Expense } from '@/types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const expenseSchema = yup.object({
  amount: yup.number().typeError('Amount must be a number').positive('Amount must be positive').required('Amount is required'),
  date: yup.string().required('Date is required'),
  note: yup.string().required('Note/Merchant is required'),
  category_id: yup.string().required('Category is required'),
}).required();

type ExpenseFormData = yup.InferType<typeof expenseSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export function AddExpenseModal({ isOpen, onClose, expenseToEdit }: AddExpenseModalProps) {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedData, setParsedData] = useState<any>(null);
  
  const { categories } = useCategories();
  const { trigger: parseAi, isMutating: isParsing } = useAiParse();
  const { trigger: saveExpense, isMutating: isSaving } = useAddExpense();
  const { trigger: editExpense, isMutating: isEditing } = useEditExpense();

  const isEditMode = !!expenseToEdit;
  const isMutating = isSaving || isEditing;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: yupResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      note: '',
      category_id: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setValue('amount', expenseToEdit.amount);
        setValue('note', expenseToEdit.notes || '');
        const d = new Date(expenseToEdit.date);
        setValue('date', !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
        setValue('category_id', expenseToEdit.category_id || '');
      } else {
        // Form is cleared below in handleClose
      }
    }
  }, [isOpen, expenseToEdit, setValue]);

  if (!isOpen) return null;

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguage.trim()) return;

    try {
      const result = await parseAi({ raw_text: naturalLanguage, source: 'text' });
      setParsedData(result);
      if (result.amount) setValue('amount', result.amount);
      if (result.note || result.merchant) setValue('note', result.note || result.merchant || '');
      if (result.date) setValue('date', new Date(result.date).toISOString().split('T')[0]);
      if (result.suggested_category_id) setValue('category_id', result.suggested_category_id);
    } catch (error) {
      console.error('AI Parse Error:', error);
      alert('Failed to parse with AI. You can enter details manually.');
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const expenseData = {
        amount: Number(data.amount),
        notes: data.note || 'Expense',
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        category_id: data.category_id || (categories[0]?.id as string) || '',
      };

      if (isEditMode && expenseToEdit) {
        await editExpense({ id: expenseToEdit.id, ...expenseData });
      } else {
        await saveExpense(expenseData);
      }
      handleClose();
    } catch (error) {
      console.error('Save Error:', error);
      alert(isEditMode ? 'Failed to update expense.' : 'Failed to save expense.');
    }
  };

  const handleClose = () => {
    setNaturalLanguage('');
    setParsedData(null);
    reset({
      amount: undefined,
      note: '',
      date: new Date().toISOString().split('T')[0],
      category_id: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {!parsedData && !isEditMode ? (
            <form onSubmit={handleAiParse} className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                  <Sparkles size={18} />
                  <span>AI Assistant</span>
                </div>
                <p className="text-sm text-foreground/70 mb-2">
                  Just type or paste what you spent, and the AI will do the rest.
                </p>
                <textarea
                  value={naturalLanguage}
                  onChange={(e) => setNaturalLanguage(e.target.value)}
                  placeholder="e.g. Spent $45.50 on dinner and drinks at Mario's with friends yesterday."
                  className="w-full h-24 p-3 bg-background border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setParsedData({})} // Skip to manual
                  className="text-sm font-medium text-foreground/60 hover:text-foreground underline underline-offset-4"
                >
                  Enter Manually Instead
                </button>
                <button
                  type="submit"
                  disabled={isParsing || !naturalLanguage.trim()}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Auto-Fill
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              {parsedData?.source === 'text' && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-600 rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
                  <Sparkles size={16} />
                  Successfully parsed expense details!
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-foreground/50">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount')}
                      className={`w-full h-10 pl-8 pr-3 bg-transparent border ${errors.amount ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                    />
                  </div>
                  {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    {...register('date')}
                    className={`w-full h-10 px-3 bg-transparent border ${errors.date ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                  {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium">Merchant / Note</label>
                  <input
                    type="text"
                    {...register('note')}
                    className={`w-full h-10 px-3 bg-transparent border ${errors.note ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  />
                  {errors.note && <p className="text-xs text-red-500">{errors.note.message}</p>}
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    {...register('category_id')}
                    className={`w-full h-10 px-3 bg-background border ${errors.category_id ? 'border-red-500' : 'border-foreground/20'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
                  {parsedData?.suggested_category_id && (
                     <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                       <Sparkles size={12} /> AI suggested: {categories.find(c => c.id === parsedData.suggested_category_id)?.name}
                     </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-border">
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="px-5 py-2.5 font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    Back
                  </button>
                )}
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-5 py-2.5 font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isMutating}
                  className="bg-primary text-primary-foreground w-32 py-2.5 rounded-lg flex items-center justify-center font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isMutating ? <Loader2 size={18} className="animate-spin" /> : (isEditMode ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
