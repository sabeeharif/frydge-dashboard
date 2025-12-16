"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/app/lib/auth";

const PlanogramStructure = () => {
  const [editItem, setEditItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [maxOrder, setMaxOrder] = useState({})
  const [supplierOptions, setSupplierOptions] = useState()
  const [categoryOptions, setCategoriesOptions] = useState()
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [categoryPageSize, setCategoryPageSize] = useState(10);

  const searchParams = useSearchParams()
  const machineId = searchParams.get("machineId")

  const [structure, setStructure] = useState({})
  const [loading, setLoading] = useState(false)


  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  const openEditModal = (item, channelNumber, shelfIndex) => {
    setEditItem({ ...item, channelNumber, shelfIndex })
    setCategories(item.categoryIds || [])
    setSuppliers(item.supplierIds || [])
    setMaxOrder(item.maxOrderCapacity || {})
  }

  const handleSave = async () => {
    try {
      // Simulated API call
      console.log("Saving:", {
        channelNumber: editItem.channelNumber,
        shelfIndex: editItem.shelfIndex,
        categoryIds: categories,
        supplierIds: suppliers,
        maxOrderCapacity: maxOrder,
      })

      setStructure((prev) => {
        const updated = { ...prev }
        updated[editItem.channelNumber][editItem.shelfIndex] = {
          ...updated[editItem.channelNumber][editItem.shelfIndex],
          categoryIds: categories,
          supplierIds: suppliers,
          maxOrderCapacity: maxOrder,
          channelModified: true,
        }
        return updated
      })

      setEditItem(null)
    } catch (err) {
      console.error(err)
      alert("Update failed")
    }
  }

  // const handleInitStructure = async () => {
  //   try {
  //     const response = await api.initPlanogramStructure(planogramVersionId);

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({
  //         error: "Failed to init structure",
  //       }));
  //       throw new Error(errorData.error);
  //     }

  //     const result = await response.json();
  //     console.log("Structure initialized:", result);

  //     if (result.planogramVersionStructure?.length > 0) {
  //       const channels =
  //         result.planogramVersionStructure[0].channelDetails || [];

  //       // 🔹 Group by channel
  //       const grouped = channels.reduce((acc, item) => {
  //         if (!acc[item.channel]) acc[item.channel] = [];
  //         acc[item.channel].push(item);
  //         return acc;
  //       }, {});

  //       // 🔹 Sort internalChannel inside each channel
  //       Object.keys(grouped).forEach((channel) => {
  //         grouped[channel].sort(
  //           (a, b) => a.shelf - b.shelf
  //         );
  //       });
  //       console.log(grouped);
  //       setStructure(grouped);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     alert(error.message || "Something went wrong");
  //   }
  // };
  // Fetch
  const fetchSuppliers = async (useLastKey = null) => {
    try {
      const response = await api.getSuppliers({
        limit: supplierPageSize,   // dynamic limit
        lastKey: useLastKey        // pagination key
      });

      console.log("Supplier fetch response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Supplier data received:", data);

      const fetchedSuppliers = data.suppliers || data.results || [];
      const newLastKey = data.lastKey || null;

      setSupplierOptions(fetchedSuppliers);
      // setSupplierLastKey(newLastKey);
      // setHasMoreSuppliers(!!newLastKey);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };
  const fetchProductsCategories = async (useLastKey = null) => {
    try {
      const response = await api.getProductsCategories({
        limit: categoryPageSize,   // dynamic limit
        lastKey: useLastKey        // pagination key
      });

      console.log("Category fetch response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Category data received:", data);

      const fetchedCategory = data.productCategories || data.results || [];


      setCategoriesOptions(fetchedCategory);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };


  // useEffect(() => {
  //   if (planogramVersionId) {
  //     handleInitStructure()
  //   }
  // }, [planogramVersionId])

  useEffect(() => {
    fetchSuppliers();
    fetchProductsCategories()
  }, []);

  const handleCategorySelect = (e) => {
    const value = e.target.value
    if (value && !categories.includes(value)) {
      setCategories([...categories, value])
    }
  }

  const handleSupplierSelect = (e) => {
    const value = e.target.value
    if (value && !suppliers.includes(value)) {
      setSuppliers([...suppliers, value])
    }
  }

  const removeCategory = (catId) => {
    setCategories(categories.filter((c) => c !== catId))
  }

  const removeSupplier = (supId) => {
    setSuppliers(suppliers.filter((s) => s !== supId))
  }
  const fetchPlanogramStructure = async () => {
  try {
    const response = await api.getPlanogramStructure({
      machineId: machineId,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
      console.log("Structure initialized:", result);

      if (result.planogramStructure?.length > 0) {
        const channels =
          result.planogramStructure[0].channelDetails || [];

        // 🔹 Group by channel
        const grouped = channels.reduce((acc, item) => {
          if (!acc[item.shelf]) acc[item.shelf] = [];
          acc[item.shelf].push(item);
          return acc;
        }, {});

        // 🔹 Sort internalChannel inside each channel
        Object.keys(grouped).forEach((shelf) => {
          grouped[shelf].sort(
            (a, b) => a.channel - b.channel
          );
        });
        console.log(grouped);
        setStructure(grouped);
      }
  } catch (error) {
    console.error("Failed to fetch planogram structure", error);
  }
};
useEffect(()=>{
  fetchPlanogramStructure()
},[machineId])


  return (
    <div className="min-h-screen bg-gray-50 pt-4">
       {/* <button
                onClick={() => router.push(
                    `/dashboard/planogram-version-details?planogramVersionId=${planograms?.planogramVersionId}`
                )}
                className="mb-6 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Planogram Version
            </button> */}
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-4xl font-bold text-gray-900 mb-2">Planogram Structure</h3>
          <p className="text-gray-600">Manage channel configurations and shelf assignments</p>
        </div>

        <div className="space-y-6">
          {Object.entries(structure)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([shelfNumber, shelves]) => (
              <div key={shelfNumber} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold px-4 py-1.5 border-2 border-blue-600 rounded-md bg-white text-blue-600">
                    Channel {shelfNumber}
                  </div>
                  <div className="flex-1 h-px bg-gray-300" />
                </div>

                {/* Shelves Grid for this channel */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {shelves.map((item, shelfIndex) => {
                    const selectedCategories = categoryOptions?.filter((cat) => item.categoryIds?.includes(cat.productCategoryId))
                    const selectedSuppliers = supplierOptions?.filter((sup) => item.supplierIds?.includes(sup.supplierId))

                    return (
                      <div
                        key={`${item.channel}-${item.shelf}`}
                        className="relative border-2 border-gray-200 bg-white rounded-lg hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3"
                      >
                        {/* Top Badge with Channel - Shelf format */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 whitespace-nowrap text-blue-600">
                          {item.shelf} - {item.channel}
                          </div>
                          {item.channelModified && (
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Modified" />
                          )}
                        </div>

                        {selectedCategories.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Categories
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {selectedCategories.map((cat) => (
                                <span
                                  key={cat.productCategoryId}
                                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-300"
                                >
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedSuppliers?.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Suppliers</div>
                            <div className="flex flex-wrap gap-1">
                              {selectedSuppliers.map((sup) => (
                                <span
                                  key={sup.supplierId}
                                  className="bg-blue-100 text-blue-700 border border-blue-300 rounded pl-1 pr-1  text-xs inline-flex items-center"
                                >
                                  {sup?.name}
                                  <button
                                    onClick={() => removeSupplier(sup.supplierId)}
                                    className="ml-2 hover:text-red-600 font-bold text-lg"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => openEditModal(item, shelfNumber, shelfIndex)}
                          className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Configure
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                Configure Channel {editItem?.channel} - Shelf {editItem?.shelf}
              </h3>
              <p className="text-sm text-gray-600">Set categories, suppliers, and capacity limits</p>
            </div>

            <div className="mb-6">
              <label htmlFor="category-select" className="text-base font-semibold mb-3 block text-gray-900">
                Categories
              </label>
              <select
                id="category-select"
                onChange={handleCategorySelect}
                value=""
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a category...</option>
                {categoryOptions
                  .filter((cat) => !categories.includes(cat.productCategoryId))
                  .map((cat) => (
                    <option key={cat.productCategoryId} value={cat.productCategoryId}>
                      {cat.name}
                    </option>
                  ))}
              </select>

              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {categories.map((productCategoryId) => {
                    const cat = categoryOptions.find((c) => c.productCategoryId === productCategoryId)
                    return (
                      <span
                        key={productCategoryId}
                        className="bg-gray-100 text-gray-700 border border-gray-300 rounded pl-3 pr-2 py-1.5 text-sm inline-flex items-center"
                      >
                        {cat?.name}
                        <button
                          onClick={() => removeCategory(productCategoryId)}
                          className="ml-2 hover:text-red-600 font-bold text-lg"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="supplier-select" className="text-base font-semibold mb-3 block text-gray-900">
                Suppliers
              </label>
              <select
                id="supplier-select"
                onChange={handleSupplierSelect}
                value=""
                className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a supplier...</option>
                {supplierOptions
                  .filter((sup) => !suppliers.includes(sup.supplierId))
                  .map((sup) => (
                    <option key={sup.supplierId} value={sup.supplierId}>
                      {sup.name}
                    </option>
                  ))}
              </select>

              {suppliers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {suppliers.map((supplierId) => {
                    const sup = supplierOptions.find((s) => s.supplierId === supplierId)
                    return (
                      <span
                        key={supplierId}
                        className="bg-blue-100 text-blue-700 border border-blue-300 rounded pl-3 pr-2 py-1.5 text-sm inline-flex items-center"
                      >
                        {sup?.name}
                        <button
                          onClick={() => removeSupplier(supplierId)}
                          className="ml-2 hover:text-red-600 font-bold text-lg"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Max Order Capacity Section */}
            <div className="mb-6">
              <label className="text-base font-semibold mb-3 block text-gray-900">
                Max Order Capacity <span className="text-gray-600 font-normal">(per day)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center gap-3">
                    <label htmlFor={day} className="min-w-[100px] text-sm text-gray-700">
                      {day}
                    </label>
                    <input
                      id={day}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={maxOrder[day] || ""}
                      onChange={(e) =>
                        setMaxOrder({
                          ...maxOrder,
                          [day]: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditItem(null)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanogramStructurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-gray-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <PlanogramStructure />
    </Suspense>
  )
}
