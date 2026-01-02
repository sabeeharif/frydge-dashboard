// ProductTable.jsx
import React from "react";
import { Boxes, Package, DollarSign } from "lucide-react";

const ProductTable = ({
  products = [],
  suppliers = [],
  categories = [],
  onManage,
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
                Price
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
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No products available</p>
                </td>
              </tr>
            ) : (
              products?.map((product, index) => {
                const supplier = suppliers.find(
                  (s) => s.supplierId === product?.supplierId
                );
                const category = categories.find(
                  (s) => s.productCategoryId === product?.productCategoryId
                );

                return (
                  <tr
                    key={product.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="px-6 py-4">{index + 1}</td>

                    {/* Product name */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <img
                          // src={`/products/${item.image}`}
                          src={product?.image?.file}
                          className="h-10 w-10  object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                        {product.name}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-gray-700">
                      {category ? category.name : "N/A"}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-gray-700 flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      {product.costPrice ? product.costPrice : "N/A"}
                    </td>

                    {/* Supplier */}
                    <td className="px-6 py-4 text-gray-700">
                      {supplier ? supplier.name : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          onClick={() => onManage(product)}
                          className="text-green-600 hover:underline"
                        >
                          Manage
                        </button>
                        {/* <button
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button> */}
                        {/* <button
                          onClick={() => onDelete(product)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button> */}
                      </div>
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
