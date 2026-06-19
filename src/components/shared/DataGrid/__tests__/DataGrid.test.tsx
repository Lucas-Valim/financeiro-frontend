import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGrid } from '../DataGrid';
import type { Column } from '../types';

interface Item {
  id: string;
  name: string;
  note: string;
}

const items: Item[] = [
  { id: '1', name: 'Alpha', note: 'first' },
  { id: '2', name: 'Beta', note: 'second' },
];

const columns: Column<Item>[] = [
  { id: 'name', header: 'Nome', width: 'minmax(0,1fr)', cardLabel: 'Nome:', cell: (item) => item.name },
  { id: 'note', header: 'Nota', width: '150px', cardLabel: 'Nota:', cell: (item) => item.note },
];

const baseProps = {
  items,
  columns,
  getRowId: (item: Item) => item.id,
  isLoading: false,
  emptyMessage: 'Nada aqui',
  testIdPrefix: 'things',
};

describe('DataGrid', () => {
  describe('rendering', () => {
    it('renders prefixed table and container testids', () => {
      render(<DataGrid {...baseProps} />);

      expect(screen.getByTestId('things-table')).toBeInTheDocument();
      expect(screen.getByTestId('things-table-container')).toBeInTheDocument();
      expect(screen.getByTestId('things-tablet-container')).toBeInTheDocument();
      expect(screen.getByTestId('things-mobile-container')).toBeInTheDocument();
    });

    it('renders headers from the column config', () => {
      render(<DataGrid {...baseProps} />);

      expect(screen.getAllByText('Nome').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Nota').length).toBeGreaterThanOrEqual(1);
    });

    it('renders a cell value per item', () => {
      render(<DataGrid {...baseProps} />);

      expect(screen.getAllByText('Alpha').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('second').length).toBeGreaterThanOrEqual(1);
    });

    it('renders one header row plus one row per item in the desktop table', () => {
      render(<DataGrid {...baseProps} />);

      const table = screen.getByTestId('things-table');
      expect(table.querySelectorAll('tr')).toHaveLength(items.length + 1);
    });
  });

  describe('actions column', () => {
    it('renders the actions column when renderActions is provided', () => {
      render(
        <DataGrid
          {...baseProps}
          actionsLabel="Ações"
          renderActions={(item) => <button>edit-{item.id}</button>}
        />
      );

      expect(screen.getAllByText('Ações').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('edit-1').length).toBeGreaterThanOrEqual(1);
    });

    it('omits the actions column when renderActions is not provided', () => {
      render(<DataGrid {...baseProps} />);

      expect(screen.queryByText('Ações')).not.toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('renders the empty state when there are no items and not loading', () => {
      render(<DataGrid {...baseProps} items={[]} />);

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nada aqui')).toBeInTheDocument();
    });

    it('renders the error state with a custom title and triggers onRefresh', () => {
      const onRefresh = vi.fn();
      render(
        <DataGrid
          {...baseProps}
          error={new Error('boom')}
          errorTitle="Falhou"
          onRefresh={onRefresh}
        />
      );

      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('Falhou')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Tente novamente'));
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('renders skeletons while loading', () => {
      render(<DataGrid {...baseProps} isLoading />);

      const skeletons = screen
        .getAllByRole('generic')
        .filter((el) => el.className?.includes('animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('footer counter', () => {
    it('renders the counter when total is provided', () => {
      render(<DataGrid {...baseProps} total={42} footerNoun="coisas" />);

      expect(screen.getByTestId('footer-counter')).toHaveTextContent('Mostrando 1-2 de 42 coisas');
    });

    it('omits the counter when total is undefined', () => {
      render(<DataGrid {...baseProps} />);

      expect(screen.queryByTestId('footer-counter')).not.toBeInTheDocument();
    });
  });

  describe('infinite scroll', () => {
    it('renders the observer target only when onLoadMore is provided', () => {
      const { rerender } = render(<DataGrid {...baseProps} />);
      expect(screen.queryByTestId('observer-target')).not.toBeInTheDocument();

      rerender(<DataGrid {...baseProps} hasNextPage onLoadMore={vi.fn()} />);
      expect(screen.getByTestId('observer-target')).toBeInTheDocument();
    });
  });

  describe('create button', () => {
    it('renders the create button only when onCreate is provided', () => {
      const onCreate = vi.fn();
      const { rerender } = render(<DataGrid {...baseProps} />);
      expect(screen.queryByText('Novo')).not.toBeInTheDocument();

      rerender(<DataGrid {...baseProps} onCreate={onCreate} createLabel="Novo" />);
      fireEvent.click(screen.getByText('Novo'));
      expect(onCreate).toHaveBeenCalledTimes(1);
    });
  });
});
