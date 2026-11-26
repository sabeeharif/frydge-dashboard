// PaginationControls.jsx — matches Users page pagination style
import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const btnBase =
  "flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors";
const btnDisabled =
  "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50";
const btnEnabled =
  "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white";
const pageBtnBase =
  "min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border transition-colors";

const PaginationControls = ({
  paginatedItems = [],
  hasNextPage = false,
  hasPrevPage = false,
  currentPage = 1,
  totalPages,
  onRefresh,
  onNextPage,
  pageName,
  showSave = false,
  onSave,
  saving = false,
  saveDisabled = false,
  itemLabel = "items",
}) => {
  if (!hasNextPage && paginatedItems.length === 0) return null;

  const safeCurrent = Math.max(1, Number(currentPage) || 1);
  const knownTotal =
    totalPages && Number(totalPages) > 0 ? Number(totalPages) : null;

  // Build page number list (Users-style). Prefer known total; otherwise show current (+ next if available).
  const pageNumbers = (() => {
    if (pageName === "InventoryCalculation") return [];
    if (knownTotal) {
      const maxButtons = 5;
      let start = Math.max(1, safeCurrent - Math.floor(maxButtons / 2));
      let end = Math.min(knownTotal, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    const pages = [safeCurrent];
    if (hasNextPage) pages.push(safeCurrent + 1);
    return pages;
  })();

  return (
    <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200/80 px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6">
      <div className="flex items-center text-[11px] sm:text-sm text-slate-600">
        <span>
          Showing {paginatedItems.length} {itemLabel}
          {hasNextPage ? " (more available)" : ""}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        {showSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled || saving}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium text-white border border-transparent transition-colors ${
              saveDisabled || saving
                ? "bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            }`}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
            {saving ? (
              "Saving..."
            ) : (
              <>
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Save Order</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={!hasPrevPage}
          className={`${btnBase} ${!hasPrevPage ? btnDisabled : btnEnabled}`}
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5" />
          Prev
        </button>

        {pageNumbers.map((page) => {
          const isActive = page === safeCurrent;
          const canJump =
            page === safeCurrent ||
            (page === safeCurrent - 1 && hasPrevPage) ||
            (page === safeCurrent + 1 && hasNextPage) ||
            (knownTotal && page >= 1 && page <= knownTotal);

          return (
            <button
              key={page}
              type="button"
              disabled={!canJump}
              onClick={() => {
                if (page === safeCurrent) return;
                if (page < safeCurrent) {
                  // Step back via prev handler (same logic as before for cursor pages)
                  if (page === safeCurrent - 1) onRefresh?.();
                  return;
                }
                if (page === safeCurrent + 1) onNextPage?.();
              }}
              className={`${pageBtnBase} ${
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
              } ${!canJump ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className={`${btnBase} ${!hasNextPage ? btnDisabled : btnEnabled}`}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
