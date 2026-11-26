// PlanogramTable.jsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";

const PlanogramTable = ({ planogram = [], onEdit, onDelete, onReorder }) => {
  const router = useRouter();
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const navigate = (planogramVersionId) => {
    router.push(
      `/dashboard/planogram-version-details?planogramVersionId=${planogramVersionId}`,
    );
  };

  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    const fromIndex =
      dragIndex !== null
        ? dragIndex
        : Number(e.dataTransfer.getData("text/plain"));

    setDragIndex(null);
    setDragOverIndex(null);

    if (
      Number.isNaN(fromIndex) ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      !onReorder
    ) {
      return;
    }

    onReorder(fromIndex, toIndex);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* HORIZONTAL SCROLL */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] lg:min-w-[900px]">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-2 py-2.5 sm:px-3 sm:py-3 lg:px-3 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide w-8 sm:w-10">
                
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                #
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Version
              </th>
              <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Machines
              </th>
              <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                UpComming Order
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Order Status
              </th>
              <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-left text-[10px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {planogram?.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 sm:py-12 text-center text-gray-500"
                >
                  <p className="text-sm sm:text-lg">No planogram available</p>
                </td>
              </tr>
            ) : (
              planogram?.map((item, index) => {
                const rowNumber = item?.rowNumber ?? index + 1;
                const isDragging = dragIndex === index;
                const isDragOver = dragOverIndex === index && dragIndex !== index;

                return (
                  <tr
                    key={item.planogramVersionId || item.id || index}
                    draggable={Boolean(onReorder)}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-200 ${
                      isDragging ? "opacity-50" : ""
                    } ${isDragOver ? "ring-2 ring-inset ring-blue-400" : ""} ${
                      onReorder ? "cursor-grab active:cursor-grabbing" : ""
                    }`}
                  >
                    {/* Drag handle */}
                    <td className="px-2 py-2.5 sm:px-3 sm:py-3 lg:px-3 lg:py-4 text-gray-400">
                      {onReorder && (
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      )}
                    </td>

                    {/* # */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm">{rowNumber}</td>

                    {/* Version */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2 truncate max-w-[10rem] sm:max-w-none">
                        {item?.name}
                      </div>
                    </td>

                    {/* Machines */}
                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">
                      {item?.machineCount || "No Machines"}
                    </td>

                    {/* UpComming Order */}
                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4 text-[11px] sm:text-xs lg:text-sm text-gray-700">
                      {item?.orders ? item?.orders : "N/A"}
                    </td>

                    {/* Order Status */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-4 lg:py-4">
                      <span
                        className={`rounded-full px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                          item?.orderStatus === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : item?.orderStatus === "ERROR"
                              ? "bg-red-100 text-red-700"
                              : item?.orderStatus === "IN_PROGRESS"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {item?.orderStatus || "N/A"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-[11px] sm:text-sm">
                        <button
                          onClick={() => navigate(item.planogramVersionId)}
                          className="text-green-600 hover:underline cursor-pointer text-left"
                        >
                          <span className="sm:hidden">Details</span>
                          <span className="hidden sm:inline">View Details</span>
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:underline cursor-pointer text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:underline cursor-pointer text-left"
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
