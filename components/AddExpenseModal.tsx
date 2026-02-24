'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useAiParse } from '@/hooks/useAi';
import { useAddExpense, useCategories } from '@/hooks/useData';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  const { categories } = useCategories();
  const { trigger: parseAi, isMutating: isParsing } = useAiParse();
  const { trigger: saveExpense, isMutating: isSaving } = useAddExpense();

  if (!isOpen) return null;

  const handleAiParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguage.trim()) return;

    try {
      const result = await parseAi({ raw_text: naturalLanguage, source: 'text' });
      setParsedData(result);
      setAmount(result.amount?.toString() || '');
      setNote(result.note || result.merchant || '');
      setDate(result.date ? new Date(result.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setCategoryId(result.suggested_category_id || '');
    } catch (error) {
      console.error('AI Parse Error:', error);
      alert('Failed to parse with AI. You can enter details manually.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    try {
      await saveExpense({
        amount: Number(amount),
        notes: note || 'Expense',
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        categoryId: categoryId || (categories[0]?.id as string) || '', // Best effort
      });
      handleClose();
    } catch (error) {
      console.error('Save Error:', error);
      alert('Failed to save expense.');
    }
  };

  const handleClose = () => {
    setNaturalLanguage('');
    setParsedData(null);
    setAmount('');
    setNote('');
    setDate('');
    setCategoryId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold">Add Expense</h2>
          <button onClick={handleClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 font-sans">
          {!parsedData ? (
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
            <form onSubmit={handleSave} className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
              {parsedData.source === 'text' && (
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full h-10 pl-8 pr-3 bg-transparent border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium">Merchant / Note</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    required
                    className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full h-10 px-3 bg-background border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {parsedData.suggested_category_id && categoryId !== parsedData.suggested_category_id && (
                     <p className="text-xs text-primary/80 mt-1 flex items-center gap-1">
                       <Sparkles size={12} /> AI suggested: {categories.find(c => c.id === parsedData.suggested_category_id)?.name}
                     </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 mt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-5 py-2.5 font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !amount}
                  className="bg-primary text-primary-foreground w-32 py-2.5 rounded-lg flex items-center justify-center font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
