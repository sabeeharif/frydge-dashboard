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

  const assignedSupplier = suppliers.find((s) => s.id === product?.supplierId);

  const handleSave = () => {
    onAssign(product.id, selectedSupplier); // Return product + supplier
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4">
          Manage Product Supplier
        </h2>

        {/* Product Info */}
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
          <p className="text-gray-700">
            <span className="font-semibold">Product:</span> {product?.name}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Current Supplier:</span>{" "}
            {assignedSupplier ? assignedSupplier?.name : "None Assigned"}
          </p>
        </div>

        {/* Supplier Selection */}
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assign Supplier
        </label>
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select supplier...</option>
          {suppliers?.map((sup) => (
            <option key={sup.id} value={sup.id}>
              {sup.name}
            </option>
          ))}
        </select>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="mt-6 w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}
