import { useState, useCallback, useMemo } from 'react';
import { Filter, Loader2, Plus } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { ORGANIZATION_ID } from '@/constants/expenses';
import { PageCard } from '@/components/shared/PageCard';
import { Button } from '@/components/ui/button';
import { CategoriesList } from '@/components/categories/CategoriesList';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { CategoryDeleteDialog } from '@/components/categories/CategoryDeleteDialog';
import {
  CategoryFilterModal,
  EMPTY_CATEGORY_FILTER,
  type CategoryFilter,
} from '@/components/categories/CategoryFilterModal';
import type { CategoryDTO } from '@/types/categories';

export function Categorias() {
  const [filter, setFilter] = useState<CategoryFilter>(EMPTY_CATEGORY_FILTER);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryDTO | null>(null);

  const { categories, isLoading } = useCategories(ORGANIZATION_ID);

  const filteredCategories = useMemo(() => {
    const term = filter.name.trim().toLowerCase();
    if (term === '') return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(term)
    );
  }, [categories, filter.name]);

  const hasActiveFilter = filter.name !== '';
  const showNoResultsForFilter =
    hasActiveFilter && filteredCategories.length === 0 && categories.length > 0;

  const handleOpenFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: CategoryDTO) => {
    setSelectedCategory(category);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedCategory(null);
  }, []);

  const handleDeleteCategory = useCallback((category: CategoryDTO) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  }, []);

  return (
    <PageCard
      title="Gerenciamento de Categorias"
      description="Organize as categorias utilizadas no lançamento de despesas"
    >
      <div className="space-y-3 flex-1 md:overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button
            onClick={handleOpenFilterModal}
            variant="outline"
            className="relative flex items-center gap-2"
            data-testid="filter-button"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilter && (
              <span
                data-testid="filter-badge"
                aria-label="Filtro ativo"
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary"
              />
            )}
          </Button>

          <div className="flex-1" />

          <Button
            onClick={handleCreateCategory}
            className="flex items-center gap-2"
            data-testid="create-category-button"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
          {isLoading && categories.length === 0 ? (
            <div
              className="flex items-center justify-center p-8"
              data-testid="loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Carregando categorias...
              </span>
            </div>
          ) : showNoResultsForFilter ? (
            <div
              data-testid="categories-no-results"
              className="rounded-md border p-8 text-center"
            >
              <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
            </div>
          ) : (
            <CategoriesList
              categories={filteredCategories}
              isLoading={isLoading}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          )}
        </div>

        <CategoryFilterModal
          isOpen={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          filter={filter}
          onFilterChange={setFilter}
        />

        <CategoryFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          category={selectedCategory}
        />

        {selectedCategory && (
          <CategoryDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            category={selectedCategory}
          />
        )}
      </div>
    </PageCard>
  );
}
