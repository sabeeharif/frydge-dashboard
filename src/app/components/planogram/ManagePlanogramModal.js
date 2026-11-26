import React, { useState } from "react";
import { X } from "lucide-react";

export default function ManageProductsModal({
  product,
  suppliers,
  onAssign,
  onClose,
}) {
  const [selectedSupplier, setSelectedSupplier] = useState(
    product?.supplierId || ""
  );

  const assignedSupplier = suppliers?.find((s) => s?.supplierId === product?.supplierId);

  const handleSave = () => {
    onAssign(product?.productId, selectedSupplier); // Return product + supplier
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg max-h-[92dvh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="px-3 py-3 sm:p-6 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Title */}
          <h2 className="text-base sm:text-2xl font-bold text-center mb-3 sm:mb-4 pr-8">
            Manage Product Supplier
          </h2>

          {/* Product Info */}
          <div className="mb-4 sm:mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg border">
            <p className="text-sm sm:text-base text-gray-700 break-words">
              <span className="font-semibold">Product:</span> {product?.name}
            </p>
            <p className="text-sm sm:text-base text-gray-700 break-words">
              <span className="font-semibold">Current Supplier:</span>{" "}
              {assignedSupplier ? assignedSupplier?.name : "N/A"}
            </p>
          </div>

          {/* Supplier Selection */}
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            Assign Supplier
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select supplier...</option>
            {suppliers?.map((sup) => (
              <option key={sup.supplierId} value={sup.supplierId}>
                {sup.name}
              </option>
            ))}
          </select>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="mt-4 sm:mt-6 w-full py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
