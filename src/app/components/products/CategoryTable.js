import React from "react";
import { Boxes } from "lucide-react";

const CategoryTable = ({
  categories = [],
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* HORIZONTAL SCROLL */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px]">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                #
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Category Name
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-8 sm:py-12 text-center text-gray-500"
                >
                  <Boxes className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <p className="text-sm sm:text-lg">No categories available</p>
                </td>
              </tr>
            ) : (
              categories.map((category, index) => (
                <tr
                  key={category.productCategoryId}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50 transition-colors duration-200`}
                >
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm">
                    {index + 1}
                  </td>

                  {/* Category Name */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      {category.name}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                    <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-sm">
                      <button
                        onClick={() => onEdit(category)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          onDelete(category.productCategoryId)
                        }
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoryTable;
