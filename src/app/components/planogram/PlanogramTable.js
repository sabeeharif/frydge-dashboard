// ProductTable.jsx
import React from "react";
import { useRouter } from "next/navigation";

const PlanogramTable = ({
  planogram = [],
  onEdit,
  onDelete,
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
                UpComming Order
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                Order Error
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
              planogram?.map((planogram, index) => {

                return (
                  <tr
                    key={planogram.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    {/* # */}
                    <td className="px-6 py-4">{index + 1}</td>

                    {/* Version */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {/* <Package className="h-4 w-4 text-blue-600" /> */}
                        {planogram?.name}
                      </div>
                    </td>

                    {/* Machines */}
                    <td className="px-6 py-4 text-gray-700">
                      {planogram?.machineCount || "No Machines"}
                    </td>

                    {/* UpComming Order */}
                    <td className="px-6 py-4 text-gray-700 flex items-center gap-1">
                      {planogram?.orders ? planogram?.orders : "N/A"}
                    </td>

                    {/* Order Error */}
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full relative px-3 py-1 text-xs font-semibold ${planogram?.pendingMachineCount
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 text-gray-500"
                          }`}
                      >
                        {planogram?.pendingMachineCount ? "Yes" : "No"}

                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          onClick={() => navigate(planogram.planogramVersionId)}
                          className="text-green-600 hover:underline"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onEdit(planogram)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(planogram)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
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
