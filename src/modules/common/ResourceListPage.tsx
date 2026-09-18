import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiErrorMessage, type ListMeta } from "@/shared/api/http";
import { toast } from "@/shared/lib/toast";
import { useIsMobile } from "@/shared/hooks/useMediaQuery";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { Fab } from "@/shared/components/Fab";
import { RecordCard } from "@/shared/components/RecordCard";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

/**
 * Anything inside a row that already acts on click. A row-level handler must
 * defer to these, or "Delete" also opens the record behind the confirm dialog.
 */
const INTERACTIVE_SELECTOR =
  "a, button, input, select, textarea, label, summary, [role='button'], [role='switch'], [role='menuitem'], [role='checkbox'], [contenteditable='true'], [data-row-ignore]";

/** True while the user is selecting text in this row — a drag must not open the record. */
function isSelectingText(row: HTMLElement): boolean {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false;
  if (sel.toString().trim() === "") return false;
  return sel.containsNode(row, true);
}

/** A modifier/middle click means "open in a new tab", the same as on a link. */
function wantsNewTab(e: React.MouseEvent): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1;
}

export interface Column<TItem> {
  header: string;
  getValue: (item: TItem) => React.ReactNode;
  className?: string | ((item: TItem) => string | undefined);
}

interface ResourceListPageProps<TItem extends { id: string }, TQuery extends object> {
  title: string;
  subtitle?: string;
  newButtonText?: string;
  searchPlaceholder?: string;
  minTableWidth?: string;
  emptyText?: string;
  deleteConfirmText?: string | ((item: TItem) => string);
  hideCreateButton?: boolean;
  headerActions?: React.ReactNode;
  columns: Column<TItem>[];
  useList: (query: TQuery) => {
    data?: { items: TItem[]; meta: ListMeta };
    isLoading: boolean;
    isFetching?: boolean;
    error: unknown;
    refetch: () => Promise<unknown>;
  };
  useDelete?: () => { mutateAsync: (id: string) => Promise<unknown>; isPending?: boolean };
  buildQuery: (args: { search: string; page: number; limit: number }) => TQuery;
  /** Controlled create dialog — lets a page open it from elsewhere (e.g. `?new=1`). */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  renderDialog?: (args: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (item?: TItem) => void;
  }) => React.ReactNode;
  renderActions?: (item: TItem, onRequestDelete: (id: string) => void) => React.ReactNode;
  /** Return a detail route and clicking anywhere in the row navigates there. */
  rowHref?: (item: TItem) => string;
  renderMobileCard?: (
    item: TItem,
    helpers: { onRequestDelete: (id: string) => void },
  ) => React.ReactNode;
}

/**
 * The house list screen: header, search, pinned-header table on desktop, cards
 * on a phone, pager, delete confirmation. Adapted from the reference CRM's
 * `ResourceListPage` for a `{ page, limit, total }` meta block.
 */
export function ResourceListPage<TItem extends { id: string }, TQuery extends object>({
  title,
  subtitle,
  newButtonText = "New",
  searchPlaceholder = "Search...",
  minTableWidth = "min-w-[800px]",
  emptyText = "No records found.",
  deleteConfirmText = "Delete this record? This cannot be undone.",
  hideCreateButton,
  headerActions,
  columns,
  useList,
  useDelete,
  buildQuery,
  createOpen,
  onCreateOpenChange,
  renderDialog,
  renderActions,
  rowHref,
  renderMobileCard,
}: ResourceListPageProps<TItem, TQuery>) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  const dialogOpen = createOpen ?? localDialogOpen;
  const setDialogOpen = onCreateOpenChange ?? setLocalDialogOpen;
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => setPage(1), [debouncedSearch]);

  const query = useMemo(
    () => buildQuery({ search: debouncedSearch, page, limit: pageSize }),
    [buildQuery, debouncedSearch, page, pageSize],
  );

  const { data, isLoading, isFetching, error, refetch } = useList(query);
  const deleteMutation = useDelete?.();
  const items = useMemo(() => data?.items ?? [], [data]);

  const pendingDelete = items.find((i) => i.id === confirmDelete);
  const confirmMessage =
    typeof deleteConfirmText === "function"
      ? pendingDelete
        ? deleteConfirmText(pendingDelete)
        : "Delete this record? This cannot be undone."
      : deleteConfirmText;

  const total = data?.meta?.total ?? items.length;
  const limit = data?.meta?.limit || pageSize;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min((page - 1) * limit + items.length, total);

  useEffect(() => {
    if (!isLoading && page > totalPages) setPage(totalPages);
  }, [page, totalPages, isLoading]);

  const onRowClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>, item: TItem) => {
      if (!rowHref) return;
      if ((e.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;
      if (isSelectingText(e.currentTarget)) return;
      const href = rowHref(item);
      if (wantsNewTab(e)) window.open(href, "_blank", "noopener,noreferrer");
      else navigate(href);
    },
    [rowHref, navigate],
  );

  async function onDelete(id: string) {
    if (!deleteMutation) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Deleted");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
    setConfirmDelete(null);
  }

  const showActions = Boolean(renderActions || deleteMutation);

  return (
    <div className="erp-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="hidden text-xl font-semibold tracking-tight text-foreground md:block">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {subtitle && <span className="hidden md:inline">{subtitle} · </span>}
            <span className="font-mono tabular-nums">{total}</span> records
          </p>
        </div>
        <div className="flex items-center gap-2">
          {headerActions}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
            className="pg-tap flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50 md:min-h-0 md:min-w-0 md:border md:border-border md:px-3 md:py-1.5"
          >
            <RefreshCw className={cn("h-4 w-4 md:h-3.5 md:w-3.5", isFetching && "animate-spin")} />
            <span className="hidden md:inline">Refresh</span>
          </button>
          {!hideCreateButton && renderDialog && (
            <button
              onClick={() => setDialogOpen(true)}
              className="hidden items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:flex"
            >
              <Plus className="h-4 w-4" />
              {newButtonText}
            </button>
          )}
        </div>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          type="search"
          className="h-11 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring md:h-9"
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {getApiErrorMessage(error)}
        </div>
      ) : null}

      {isMobile ? (
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <p className="pg-panel px-4 py-12 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : (
            items.map((item) => (
              <div key={item.id}>
                {renderMobileCard ? (
                  renderMobileCard(item, { onRequestDelete: setConfirmDelete })
                ) : (
                  <RecordCard
                    title={columns[0]?.getValue(item)}
                    meta={columns.slice(1, 4).map((c) => c.getValue(item))}
                    to={rowHref?.(item)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="pg-panel max-h-[calc(100vh-17rem)] min-h-[20rem] overflow-auto">
          <table className={cn("w-full text-sm", minTableWidth)}>
            <thead className="pg-thead">
              <tr className="border-b border-border">
                {columns.map((col) => (
                  <th
                    key={col.header}
                    scope="col"
                    className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    {col.header}
                  </th>
                ))}
                {showActions && (
                  <th
                    scope="col"
                    className="w-24 px-4 py-2.5 text-right text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground"
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {emptyText}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={(e) => onRowClick(e, item)}
                    onAuxClick={(e) => {
                      if (e.button === 1) onRowClick(e, item);
                    }}
                    onMouseDown={(e) => {
                      if (e.button === 1 && rowHref) e.preventDefault();
                    }}
                    className={cn(
                      "group transition-colors hover:bg-accent/40",
                      rowHref && "cursor-pointer",
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.header}
                        className={cn(
                          "px-4 py-2.5",
                          typeof col.className === "function" ? col.className(item) : col.className,
                        )}
                      >
                        {col.getValue(item)}
                      </td>
                    ))}
                    {showActions && (
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {renderActions?.(item, setConfirmDelete)}
                          {!renderActions && deleteMutation && (
                            <button
                              onClick={() => setConfirmDelete(item.id)}
                              aria-label="Delete"
                              title="Delete"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm md:px-4">
        <span className="text-muted-foreground">
          Showing{" "}
          <span className="font-mono tabular-nums text-foreground">
            {rangeStart}–{rangeEnd}
          </span>{" "}
          of <span className="font-mono tabular-nums text-foreground">{total}</span>
        </span>
        <label className="hidden items-center gap-2 md:flex">
          <span className="text-muted-foreground">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            aria-label="Previous page"
            className="pg-tap flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40 md:min-h-0 md:min-w-0 md:border-0 md:p-1"
          >
            <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
          </button>
          <span className="px-1.5 font-mono text-xs tabular-nums text-muted-foreground">
            {page}/{totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            aria-label="Next page"
            className="pg-tap flex items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40 md:min-h-0 md:min-w-0 md:border-0 md:p-1"
          >
            <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
          </button>
        </div>
      </div>

      {!hideCreateButton && renderDialog && (
        <Fab label={newButtonText} onClick={() => setDialogOpen(true)} />
      )}

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Confirm delete"
        message={confirmMessage}
        confirmLabel="Delete"
        isPending={deleteMutation?.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && onDelete(confirmDelete)}
      />

      {renderDialog?.({
        open: dialogOpen,
        onOpenChange: setDialogOpen,
        onSuccess: () => {
          setPage(1);
          void refetch();
        },
      })}
    </div>
  );
}
