// ProductTable.jsx
import React from "react";
import { useRouter } from "next/navigation";

const PlanogramTable = ({
  planogram = [],
  onEdit,
}) => {
  const router = useRouter()
  const navigate = (planogramVersionId) => {
    router.push(
      `/dashboard/planogram-version-details?planogramVersionId=${planogramVersionId}`
    );
  }
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
                Version
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Machines
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {planogram?.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {/* <Boxes className="h-12 w-12 mx-auto mb-4 text-gray-300" /> */}
                  <p className="text-lg">No planogram available</p>
                </td>
              </tr>
            ) : (
              planogram?.map((product, index) => {

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
                        {/* <Package className="h-4 w-4 text-blue-600" /> */}
                        {product.name}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 text-gray-700">
                      {product?.versionDetails?.length || "No Machines"}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-gray-700 flex items-center gap-1">
                      {product.costPrice ? product.costPrice : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          onClick={() => navigate(product.planogramVersionId)}
                          className="text-green-600 hover:underline"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
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

export default PlanogramTable;
