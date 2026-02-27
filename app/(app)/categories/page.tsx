'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { Category } from '@/types';
import { CategoryModal } from '@/components/CategoryModal';
import { useAddCategory, useCategories, useDeleteCategory, useEditCategory } from '@/hooks/useData';
import { MOBILE_DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getCategoryIconComponent } from '@/lib/categoryAppearance';
import { ErrorState } from '@/components/state/ErrorState';
import { EmptyState } from '@/components/state/EmptyState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
          <p className="text-muted-foreground">Create and manage your expense categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={isResetting}
            title="Add missing default categories"
          >
            {isResetting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span className="hidden sm:inline">Reset Defaults</span>
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="whitespace-nowrap"
          >
            <Plus size={18} />
            Add Category
          </Button>
        </div>
      </div>

      {!isLoading && !isError ? (
        <Alert>
          <div className="flex items-start gap-3">
            <RefreshCw className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <AlertTitle>Default Categories</AlertTitle>
              <AlertDescription>
                Use <span className="font-medium">Reset Defaults</span> to add any missing starter categories.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ) : null}

      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">All Categories</CardTitle>
          <CardDescription>{categories.length} configured</CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`category-skeleton-${index}`} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-md" />
              </div>
            ))}
          </CardContent>
        ) : isError ? (
          <CardContent>
            <ErrorState
              title="Failed to load categories."
              description="Please refresh and try again."
              onRetry={() => {
                void mutate();
              }}
            />
          </CardContent>
        ) : categories.length === 0 ? (
          <CardContent className="space-y-4">
            <EmptyState
              title="No categories yet"
              description="Add your first category to better organize expenses."
              actionLabel="Add Category"
              onAction={handleOpenCreate}
            />
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                disabled={isResetting}
              >
                {isResetting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RefreshCw size={18} />
                )}
                Add Defaults
              </Button>
            </div>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => {
              const IconComponent = getCategoryIconComponent(category.icon);
              return (
                <div
                  key={category.id}
                  className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}1f` }}
                    >
                      <IconComponent size={18} style={{ color: category.color }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{category.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <Badge variant="outline" className="font-normal">
                          {category.icon}
                        </Badge>
                        <Badge variant={category.is_default ? 'secondary' : 'outline'}>
                          {category.is_default ? 'Default' : 'Custom'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      className="h-8 w-8"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      disabled={deletingId === category.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete"
                    >
                      {deletingId === category.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

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
