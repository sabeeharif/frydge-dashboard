// PlanogramPaginationControls.jsx — matches Users page pagination style
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationControls = ({
  paginatedItems = [],
  hasNextPage = false,
  hasPrevPage = false,
  currentPage = 1,
  onRefresh,
  onNextPage,
}) => {
  if (!hasNextPage && paginatedItems.length === 0) return null;

  const safeCurrent = Math.max(1, Number(currentPage) || 1);

  return (
    <div className="mt-4 sm:mt-6 lg:mt-8 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 bg-white rounded-xl shadow-sm border border-slate-200/80 px-2.5 py-2.5 sm:px-5 sm:py-4 lg:px-6">
      <div className="flex items-center text-[11px] sm:text-sm text-slate-600">
        <span>
          Showing {paginatedItems.length} items
          {hasNextPage ? " (more available)" : ""}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={onRefresh}
          disabled={!hasPrevPage}
          className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${!hasPrevPage
            ? "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50"
            : "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white"
            }`}
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0.5" />
          Prev
        </button>

        <button
          type="button"
          className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent"
        >
          {safeCurrent}
        </button>

        {hasNextPage && (
          <button
            type="button"
            onClick={onNextPage}
            className="min-w-7 sm:min-w-8 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-sm font-semibold border bg-white text-slate-700 border-slate-200 hover:border-blue-300"
          >
            {safeCurrent + 1}
          </button>
        )}

        <button
          type="button"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className={`flex items-center justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-sm font-medium border transition-colors ${!hasNextPage
            ? "text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50"
            : "text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600 bg-white"
            }`}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
