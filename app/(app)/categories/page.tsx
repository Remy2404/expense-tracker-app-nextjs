'use client';

import { useState } from 'react';
import { Plus, Tags, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Category } from '@/types';
import { CategoryModal } from '@/components/CategoryModal';
import { useAddCategory, useCategories, useDeleteCategory, useEditCategory } from '@/hooks/useData';

export default function CategoriesPage() {
  const { categories, isLoading, isError } = useCategories();
  const { trigger: addCategory, isMutating: isAdding } = useAddCategory();
  const { trigger: editCategory, isMutating: isEditing } = useEditCategory();
  const { trigger: deleteCategory } = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSaving = isAdding || isEditing;

  const handleOpenCreate = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setDeletingId(id);
      await deleteCategory({ id });
    } catch (error) {
      console.error('Failed to delete category', error);
      alert('Failed to delete category.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: { name: string; icon: string; color: string }) => {
    try {
      if (categoryToEdit) {
        await editCategory({ id: categoryToEdit.id, ...data });
      } else {
        await addCategory({ ...data, is_default: false });
      }
      setIsModalOpen(false);
      setCategoryToEdit(null);
    } catch (error) {
      console.error('Failed to save category', error);
      alert(categoryToEdit ? 'Failed to update category.' : 'Failed to create category.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-foreground/60">Create and manage your expense categories.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium">Failed to load categories.</p>
            <p className="text-foreground/60 text-sm mt-1">Please refresh and try again.</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-foreground/5 rounded-full flex items-center justify-center mb-4 text-foreground/40">
              <Tags size={32} />
            </div>
            <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
            <p className="text-foreground/60 max-w-sm mb-6">
              Add your first category to better organize expenses.
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Add Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                  <div>
                    <h4 className="font-medium text-foreground">{category.name}</h4>
                    <p className="text-sm text-foreground/60">{category.icon}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={deletingId === category.id}
                    className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    {deletingId === category.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(null);
        }}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        categoryToEdit={categoryToEdit}
      />
    </div>
  );
}
