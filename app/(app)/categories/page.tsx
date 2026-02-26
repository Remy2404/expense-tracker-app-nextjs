'use client';

import { useState } from 'react';
import { Plus, Tags, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Category } from '@/types';
import { CategoryModal } from '@/components/CategoryModal';
import { useAddCategory, useCategories, useDeleteCategory, useEditCategory } from '@/hooks/useData';
import { MOBILE_DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIconComponent } from '@/lib/categoryAppearance';

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, isLoading, isError, mutate } = useCategories();
  const { trigger: addCategory, isMutating: isAdding } = useAddCategory();
  const { trigger: editCategory, isMutating: isEditing } = useEditCategory();
  const { trigger: deleteCategory } = useDeleteCategory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleResetToDefaults = async () => {
    if (!user?.uid) return;
    if (!window.confirm('This will add any missing default categories. Continue?')) return;

    setIsResetting(true);
    try {
      // First ensure profile exists (required for foreign key)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('firebase_uid')
        .eq('firebase_uid', user.uid)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase.from('profiles').insert({
          firebase_uid: user.uid,
        });
        if (profileError) {
          alert('Failed to create user profile. Please try again.');
          return;
        }
      }

      // Get existing category names
      const existingNames = new Set(categories.map((cat) => cat.name.trim().toLowerCase()));

      // Find missing defaults
      const missingDefaults = MOBILE_DEFAULT_CATEGORIES.filter(
        (defaultCat) => !existingNames.has(defaultCat.name.trim().toLowerCase())
      );

      if (missingDefaults.length === 0) {
        alert('All default categories already exist!');
        return;
      }

      // Insert missing defaults one by one
      for (const category of missingDefaults) {
        const { error } = await supabase.from('categories').insert({
          ...category,
          firebase_uid: user.uid,
        });
        if (error) {
          console.warn('Failed to add category:', category.name, error);
        }
      }

      // Refresh the data
      mutate();
    } catch (error) {
      console.error('Failed to reset categories:', error);
      alert('Failed to reset categories.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-foreground/60">Create and manage your expense categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaults}
            disabled={isResetting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
            title="Add missing default categories"
          >
            {isResetting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
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
            <div className="flex gap-3">
              <button
                onClick={handleResetToDefaults}
                disabled={isResetting}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isResetting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                Add Defaults
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium border border-border hover:bg-muted transition-colors"
              >
                <Plus size={18} />
                Custom
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => {
              const IconComponent = getCategoryIconComponent(category.icon);
              return (
                <div key={category.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-foreground/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <IconComponent size={18} style={{ color: category.color }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{category.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <span>{category.icon}</span>
                      </div>
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
                      className="p-2 text-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === category.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
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
