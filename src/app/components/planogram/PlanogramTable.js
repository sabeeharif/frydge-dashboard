// ProductTable.jsx
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
        <table className="w-full">
          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-3 py-4 text-left text-sm font-semibold uppercase tracking-wider w-10">
                
              </th>
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
                Order Status
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
                  <p className="text-lg">No planogram available</p>
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
                    <td className="px-3 py-4 text-gray-400">
                      {onReorder && (
                        <GripVertical className="h-4 w-4" aria-hidden="true" />
                      )}
                    </td>

                    {/* # */}
                    <td className="px-6 py-4">{rowNumber}</td>

                    {/* Version */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {item?.name}
                      </div>
                    </td>

                    {/* Machines */}
                    <td className="px-6 py-4 text-gray-700">
                      {item?.machineCount || "No Machines"}
                    </td>

                    {/* UpComming Order */}
                    <td className="px-6 py-4 text-gray-700 flex items-center gap-1">
                      {item?.orders ? item?.orders : "N/A"}
                    </td>

                    {/* Order Status */}
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
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
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <button
                          onClick={() => navigate(item.planogramVersionId)}
                          className="text-green-600 hover:underline cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:underline cursor-pointer"
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
