import { X, Loader2 } from "lucide-react";

const EditProductModal = ({
  closeModal,
  updatingProduct,
  handleUpdateProduct,
  formData,
  handleInputChange,
  allSuppliers,
  allCategories
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-3 py-3 sm:p-6 border-b border-gray-200 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base sm:text-2xl font-bold text-gray-800">Edit Product</h3>
            <button
              type="button"
              onClick={closeModal}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Product Information
            </h3>


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* External ID */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Product Type
                </label>
                <input
                  type="text"
                  value={formData.productType || ""}
                  onChange={(e) =>
                    handleInputChange("productType", e.target.value)
                  }
                  disabled
                  placeholder="Enter Product Type"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {/* Category + Price */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Category
                </label>
                <select
                  value={formData.productCategoryId || ""}
                  onChange={(e) =>
                    handleInputChange("productCategoryId", e.target.value)
                  }
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {allCategories?.map((s) => (
                    <option key={s.supplierId} value={s.productCategoryId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Cost Price
                </label>
                <input
                  type="number"
                  value={formData.costPrice ?? ""}
                  onChange={(e) =>
                    handleInputChange("costPrice", Number(e.target.value))
                  }
                  placeholder="Enter cost price"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Selling Price
                </label>
                <input
                  type="number"
                  value={formData.sellingPrice ?? ""}
                  onChange={(e) =>
                    handleInputChange("sellingPrice", Number(e.target.value))
                  }
                  placeholder="Enter selling price"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* External ID */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  External ID
                </label>
                <input
                  type="text"
                  value={formData.externalId || ""}
                  onChange={(e) =>
                    handleInputChange("externalId", e.target.value)
                  }
                  disabled
                  placeholder="Enter external ID"
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>


              {/* Supplier */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Assign Supplier
                </label>
                <select
                  value={formData.supplierId || ""}
                  onChange={(e) =>
                    handleInputChange("supplierId", e.target.value)
                  }
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {allSuppliers.map((s) => (
                    <option key={s.supplierId} value={s.supplierId}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-3 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
          <button
            type="button"
            onClick={closeModal}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpdateProduct}
            disabled={updatingProduct}
            className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center justify-center gap-2"
          >
            {updatingProduct && <Loader2 className="h-4 w-4 animate-spin" />}
            {updatingProduct ? "Updating..." : "Update Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
