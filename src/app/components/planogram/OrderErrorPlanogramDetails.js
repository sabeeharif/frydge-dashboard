"use client";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthService, api } from "@/app/lib/auth";

const OrderErrorPlanogramDetails = ({ closeModal, machine, machineErrors, loadingErrors }) => {
  // console.log("machine", machine)
  // console.log("machineErrors", machineErrors)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-800">
              View Order Error
            </h3>
            <button
              onClick={closeModal}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Planned Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                          Error Message
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
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
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formattedDate}
                            </td>

                            {/* Error Message */}
                            <td className="px-4 text-red-500 py-3 text-sm font-medium">
                              {row?.errorMessage || "N/A"}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3 text-center space-x-3">
                              <button
                                className="text-green-600 cursor-pointer hover:underline font-medium"
                              // onClick={() => handleAction(row)}
                              >
                                Resolved
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
        <div className="p-6  border-gray-200 flex justify-end gap-3">
          <button
            onClick={closeModal}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderErrorPlanogramDetails;
