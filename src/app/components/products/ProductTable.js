// ProductTable.jsx
import React from "react";
import { Boxes, Package, DollarSign, Euro } from "lucide-react";

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
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Shelf Life (Days)
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Cost Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Selling Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
          {products.length === 0 ? (
            <tr>
              {/* Changed colSpan to 9 to match actual header count */}
              <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">No products available</p>
              </td>
            </tr>
          ) : (
            products.map((product, index) => {
              // Added optional chaining ?. to find calls
              const supplier = suppliers?.find((s) => s.supplierId === product?.supplierId);
              const category = categories?.find((c) => c.productCategoryId === product?.productCategoryId);
              const rowNumber = (currentPage - 1) * pageSize + index + 1;

              return (
                <tr key={product.id} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors duration-200`}>
                  <td className="px-6 py-4">{rowNumber}</td>
                  
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <img
                        src={product?.image?.file || "/placeholder.png"}
                        className="h-10 w-10 object-contain rounded"
                        alt={product.name}
                        onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                      />
                      {product.name}
                    </div>
                  </td>

                  {/* SWAPPED ORDER TO MATCH THEAD: Category First */}
                  <td className="px-6 py-4 text-gray-700">{category?.name || "N/A"}</td>

                  {/* Type Second */}
                  <td className="px-6 py-4 text-gray-700">{product?.productType || "N/A"}</td>

                  <td className="px-6 py-4 text-gray-700">{product?.shelfLife || "N/A"}</td>

                  <td className="px-6 py-4 text-gray-700">
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-green-600" />
                      {product.costPrice || "N/A"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700">
                    <div className="flex items-center gap-1">
                      <Euro className="h-4 w-4 text-green-600" />
                      {product.defaultPrice || "0.00"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700">{supplier?.name || "N/A"}</td>

                  <td className="px-6 py-4">
                    <button onClick={() => onManage(product)} className="text-green-600 hover:underline font-medium">
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
