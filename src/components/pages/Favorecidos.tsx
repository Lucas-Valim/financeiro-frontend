import { useState, useCallback, useMemo } from 'react';
import { Filter, Loader2, Plus } from 'lucide-react';
import { useFavorecidos } from '@/hooks/use-favorecidos';
import { ORGANIZATION_ID } from '@/constants/expenses';
import { PageCard } from '@/components/shared/PageCard';
import { Button } from '@/components/ui/button';
import { FavorecidosList } from '@/components/favorecidos/FavorecidosList';
import { FavorecidoFormModal } from '@/components/favorecidos/FavorecidoFormModal';
import { FavorecidoDeleteDialog } from '@/components/favorecidos/FavorecidoDeleteDialog';
import {
  FavorecidoFilterModal,
  EMPTY_FAVORECIDO_FILTER,
  type FavorecidoFilter,
} from '@/components/favorecidos/FavorecidoFilterModal';
import type { FavorecidoDTO } from '@/types/favorecidos';

export function Favorecidos() {
  const [filter, setFilter] = useState<FavorecidoFilter>(EMPTY_FAVORECIDO_FILTER);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFavorecido, setSelectedFavorecido] = useState<FavorecidoDTO | null>(null);

  const { favorecidos, isLoading } = useFavorecidos(ORGANIZATION_ID);

  const filteredFavorecidos = useMemo(() => {
    const nameTerm = filter.name.trim().toLowerCase();
    const documentTerm = filter.document.replace(/\D/g, '');
    if (nameTerm === '' && documentTerm === '') return favorecidos;
    return favorecidos.filter((fav) => {
      const matchesName = nameTerm === '' || fav.name.toLowerCase().includes(nameTerm);
      const matchesDocument = documentTerm === '' || fav.document.includes(documentTerm);
      return matchesName && matchesDocument;
    });
  }, [favorecidos, filter.name, filter.document]);

  const hasActiveFilter = filter.name !== '' || filter.document !== '';
  const showNoResultsForFilter =
    hasActiveFilter && filteredFavorecidos.length === 0 && favorecidos.length > 0;

  const handleOpenFilterModal = useCallback(() => {
    setIsFilterModalOpen(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalOpen(false);
  }, []);

  const handleCreateFavorecido = useCallback(() => {
    setSelectedFavorecido(null);
    setIsFormModalOpen(true);
  }, []);

  const handleEditFavorecido = useCallback((favorecido: FavorecidoDTO) => {
    setSelectedFavorecido(favorecido);
    setIsFormModalOpen(true);
  }, []);

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedFavorecido(null);
  }, []);

  const handleDeleteFavorecido = useCallback((favorecido: FavorecidoDTO) => {
    setSelectedFavorecido(favorecido);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedFavorecido(null);
  }, []);

  return (
    <PageCard
      title="Gerenciamento de Favorecidos"
      description="Gerencie os favorecidos utilizados no lançamento de despesas"
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
            onClick={handleCreateFavorecido}
            className="flex items-center gap-2"
            data-testid="create-favorecido-button"
          >
            <Plus className="h-4 w-4" />
            Novo Favorecido
          </Button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:overflow-hidden">
          {isLoading && favorecidos.length === 0 ? (
            <div
              className="flex items-center justify-center p-8"
              data-testid="loading-state"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">
                Carregando favorecidos...
              </span>
            </div>
          ) : showNoResultsForFilter ? (
            <div
              data-testid="favorecidos-no-results"
              className="rounded-md border p-8 text-center"
            >
              <p className="text-muted-foreground">Nenhum favorecido encontrado</p>
            </div>
          ) : (
            <FavorecidosList
              favorecidos={filteredFavorecidos}
              isLoading={isLoading}
              onEdit={handleEditFavorecido}
              onDelete={handleDeleteFavorecido}
            />
          )}
        </div>

        <FavorecidoFilterModal
          isOpen={isFilterModalOpen}
          onClose={handleCloseFilterModal}
          filter={filter}
          onFilterChange={setFilter}
        />

        <FavorecidoFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          favorecido={selectedFavorecido}
        />

        {selectedFavorecido && (
          <FavorecidoDeleteDialog
            isOpen={isDeleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            favorecido={selectedFavorecido}
          />
        )}
      </div>
    </PageCard>
  );
}
