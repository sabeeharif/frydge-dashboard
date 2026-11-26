"use client";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthService, api } from "@/app/lib/auth";

const OrderErrorPlanogramDetails = ({
  closeModal,
  machine,
  machineErrors,
  setMachineErrors,
  loadingErrors,
  fetchPlanogramVersions
}) => {
  const [loadingRow, setLoadingRow] = useState(null);

  const handleMarkAsRead = async (row) => {
    const key = `${row?.orderSnapshotId}-${row?.machineId}`;
    setLoadingRow(key);

    try {
      // console.log("Mark As Read", row)
      await api.markOrderSnapshotErrorRead({
        planogramVersionId: row?.planogramVersionId,
        orderSnapshotId: row?.orderSnapshotId,
        machineId: row?.machineId,
      });

      // optional: update UI after success
      // setMachineErrors((prev) =>
      //   prev.filter(
      //     (item) =>
      //       !(
      //         item.orderSnapshotId === row.orderSnapshotId &&
      //         item.machineId === row.machineId
      //       )
      //   )
      // );

      // ✅ call parent function
      fetchPlanogramVersions?.();

      // Close Modal
      closeModal()
    } catch (error) {
      console.error("Failed to mark as read:", error);
    } finally {
      setLoadingRow(null);
    }
  };

  // console.log("machine", machine)
  // console.log("machineErrors", machineErrors)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        {/* Header */}
        <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-2xl font-bold text-gray-800">
              View Order Error
            </h3>
            <button
              onClick={closeModal}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4 sm:space-y-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Order Details
            </h3>

            {/* Machine Info Header */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Machine ID</p>
                <p className="text-sm font-semibold text-gray-800">
                  {machine?.machineId || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Machine Name</p>
                <p className="text-sm font-semibold text-gray-800">
                  {machine?.friendlyName || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Venue Name</p>
                <p className="text-sm font-semibold text-gray-800">
                  {machine?.venueName || "N/A"}
                </p>
              </div>
            </div>

            {/* Content */}
            {loadingErrors ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              </div>
            ) : machineErrors?.length === 0 ? (
              /* Empty State */
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-600 mb-4">No data available</p>
              </div>
            ) : (
              /* Table */
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                  <table className="w-full min-w-[520px]">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[10px] sm:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                          Planned Date
                        </th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[10px] sm:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                          Error Message
                        </th>
                        <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-left text-[10px] sm:text-sm font-semibold uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {machineErrors?.map((row, index) => {
                        // Parse dd-mm-yyyyThh:mm:ss
                        let formattedDate = "N/A";
                        if (row.plannedPlanogramDate) {
                          const [datePart] =
                            row.plannedPlanogramDate.split("T"); // "24-02-2026"
                          const [dd, mm, yyyy] = datePart.split("-");
                          formattedDate = `${dd}-${mm}-${yyyy}`;
                        }

                        return (
                          <tr key={index} className="border-t border-gray-300">
                            {/* Planned Date */}
                            <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">
                              {formattedDate}
                            </td>

                            {/* Error Message */}
                            <td className="px-3 sm:px-4 text-red-500 py-2.5 sm:py-3 text-xs sm:text-sm font-medium">
                              {row?.errorMessage || "N/A"}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-center whitespace-nowrap">
                              <button
                                disabled={
                                  loadingRow === `${row?.orderSnapshotId}-${row?.machineId}`
                                }
                                className="text-green-600 cursor-pointer hover:underline font-medium text-xs sm:text-sm"
                                onClick={() => handleMarkAsRead(row)}
                              >
                                {loadingRow === `${row?.orderSnapshotId}-${row?.machineId}`
                                  ? "Marking..."
                                  : "Mark as Read"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-6 border-t border-gray-200 flex justify-end gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
          <button
            onClick={closeModal}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderErrorPlanogramDetails;
