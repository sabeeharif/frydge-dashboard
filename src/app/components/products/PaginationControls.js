// PaginationControls.jsx
import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

const PaginationControls = ({
  paginatedItems = [],
  hasNextPage = false,
  hasPrevPage = false,
  currentPage,
  totalPages,
  onRefresh,
  onNextPage,
  pageName,
  showSave = false,
  onSave,
  saving = false,
  saveDisabled = false,
}) => {
  if (!hasNextPage && paginatedItems.length === 0) return null;

  return (
    <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing {paginatedItems.length} products{" "}
          {hasNextPage ? "(more available)" : ""}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        {showSave && (
          <button
            onClick={onSave}
            disabled={saveDisabled || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              saveDisabled || saving
                ? "bg-gradient-to-r from-blue-600 to-purple-600 opacity-50 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            }`}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save Order"}
          </button>
        )}

        {/* Prev Page */}
        <button
          onClick={onRefresh}
          disabled={!hasPrevPage}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!hasPrevPage
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Prev
        </button>

        {/* ✅ PAGE NUMBER DISPLAY */}
        {
          pageName === "InventoryCalculation" ? " " :
            < span className="px-3 py-2 text-sm font-semibold text-gray-800">
              Page {currentPage} of {totalPages}
            </span>
        }

        {/* Next Page */}
        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!hasNextPage
            ? "text-gray-300 cursor-not-allowed"
            : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            }`}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

    </div >
  );
};

export default PaginationControls;
