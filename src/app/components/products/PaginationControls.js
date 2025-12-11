// PaginationControls.jsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationControls = ({
  paginatedItems = [],
  hasNextPage = false,
  hasPrevPage = false,
  onRefresh,
  onNextPage,
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
    </div>
  );
};

export default PaginationControls;
