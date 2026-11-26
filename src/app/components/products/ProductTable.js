// ProductTable.jsx
import React from "react";
import { Boxes, Euro } from "lucide-react";

const ProductTable = ({
  products = [],
  suppliers = [],
  categories = [],
  onManage,
  currentPage,
  pageSize,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* HORIZONTAL SCROLL */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] lg:min-w-[900px]">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                #
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Product Name
              </th>
              <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Category
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Type
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Shelf Life (Days)
              </th>
              <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Cost Price
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Selling Price
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Supplier
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-3 py-8 sm:py-12 text-center text-gray-500">
                <Boxes className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-lg">No products available</p>
              </td>
            </tr>
          ) : (
            products.map((product, index) => {
              const supplier = suppliers?.find((s) => s.supplierId === product?.supplierId);
              const category = categories?.find((c) => c.productCategoryId === product?.productCategoryId);
              const rowNumber = (currentPage - 1) * pageSize + index + 1;

              return (
                <tr key={product.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-200`}>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm">{rowNumber}</td>
                  
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={product?.image?.file || "/placeholder.png"}
                        className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded shrink-0"
                        alt={product.name}
                        onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                      />
                      <span className="truncate">{product.name}</span>
                    </div>
                  </td>

                  <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">{category?.name || "N/A"}</td>

                  <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">{product?.productType || "N/A"}</td>

                  <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">{product?.shelfLife || "N/A"}</td>

                  <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      {product.costPrice || "N/A"}
                    </div>
                  </td>

                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      {product.defaultPrice || "0.00"}
                    </div>
                  </td>

                  <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">{supplier?.name || "N/A"}</td>

                  <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                    <button onClick={() => onManage(product)} className="text-green-600 hover:underline font-medium text-[11px] sm:text-sm">
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
