"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/app/lib/auth";
import Loader from "@/app/components/Loader";
import { AlertTriangle, Loader2 } from "lucide-react";

const PlanogramStructure = () => {
  const [editItem, setEditItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [maxOrder, setMaxOrder] = useState({})
  const [supplierOptions, setSupplierOptions] = useState()
  const [categoryOptions, setCategoriesOptions] = useState()
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [categoryPageSize, setCategoryPageSize] = useState(10);
  const [updatingPlanogram, setUpdatingPlanogram] = useState()
  const [planogramMeta, setPlanogramMeta] = useState(null)
  const searchParams = useSearchParams()
  const machineId = searchParams.get("machineId")
  const action = searchParams.get("action")
  const [productOptions, setProductOptions] = useState([])
  const [productSearchLoading, setProductSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 50 })
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [supplierFetchProgress, setSupplierFetchProgress] = useState()
  const [allProducts, setAllProducts] = useState([])
  const [allSuppliers, setAllSuppliers] = useState([])
  const [allCategories, setAllCategories] = useState([])

  const [categoryFetchProgress, setCategoryFetchProgress] = useState()
  const [supplierLoading, setSupplierLoading] = useState()
  const [categoryLoading, setCategoryLoading] = useState()


  const searchTimeoutRef = useRef(null)
  const searchCategoryTimeoutRef = useRef(null)
  const searchSupplierTimeoutRef = useRef(null)
  const isFetchingAllProductsRef = useRef(false)
  const isFetchingCategoriesRef = useRef(false)
  const isFetchingSuppliersRef = useRef(false)
  const router = useRouter()
  const shelfRefs = useRef({});
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
      console.log(editItem);
      // Simulated API call
      console.log("Saving:", {
        channelNumber: editItem.channelNumber,
        shelfIndex: editItem.shelfIndex,
        categoryIds: categories,
        supplierIds: suppliers,
        maxOrderCapacity: maxOrder,
        productName: editItem?.productName,
        productId: editItem?.productId,
        externalProductId: editItem?.externalProductId,
        price: editItem?.price
      })

      setStructure((prev) => {
        const updated = { ...prev }
        updated[editItem.channelNumber][editItem.shelfIndex] = {
          ...updated[editItem.channelNumber][editItem.shelfIndex],
          categoryIds: categories,
          supplierIds: suppliers,
          maxOrderCapacity: maxOrder,
          channelModified: true,
          productName: editItem?.productName,
          productId: editItem?.productId,
          externalProductId: editItem?.externalProductId,
          price: editItem?.price
        }
        return updated
      })

      setEditItem(null)
    } catch (err) {
      console.error(err)
      alert("Update failed")
    }
  }

  const handleUpdatePlanogram = async () => {

    const channelDetails = Object.values(structure).flat()
    console.log(channelDetails);
    const payload = {
      machineStructureId: planogramMeta.machineStructureId,
      planogramVersionId: planogramMeta.planogramVersionId,
      primeMachine: planogramMeta?.primeMachine,
      machineId: planogramMeta.machineId,
      channelDetails: channelDetails
    }

    console.log("Sending full payload:", payload)

    try {
      // // 🔹 API call
      const response = await api.updatePlangoramVersionStructure(payload.planogramVersionId, payload)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Planogram updated successfully:", result)

      setEditItem(null)
    } catch (err) {
      console.error("Update failed:", err)

      alert("Update failed. Please try again.")
    }
  }

  const handleFinalizePlanogram = async () => {

    const channelDetails = Object.values(structure).flat()
    console.log(channelDetails);

    try {
      // // 🔹 API call
      const response = await api.finalizePlangoramVersionStructure(planogramMeta.planogramVersionId, channelDetails)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log("Planogram updated successfully:", result)

      setEditItem(null)
    } catch (err) {
      console.error("Update failed:", err)

      alert("Update failed. Please try again.")
    }
  }
  const fetchProgressively = async ({
    fetchFn,
    onData,
    maxPages = 50,
    limit = 20,
    delay = 300,
    setLoading,
    isFetchingRef,
    setProgress,
    label = "items",
  }) => {
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setLoading(true)

    try {
      let allItems = []
      let lastKey = null
      let pageCount = 0

      setProgress({ current: 0, total: maxPages })

      do {
        pageCount++
        setProgress({ current: pageCount, total: maxPages })

        const response = await fetchFn({ limit, lastKey })

        if (!response.ok) break

        const data = await response.json()
        const items = data.results || data.products || data.productCategories || data.suppliers || []

        allItems = [...allItems, ...items]
        onData([...allItems])

        lastKey = data.lastKey || null

        if (lastKey && pageCount < maxPages) {
          await new Promise((res) => setTimeout(res, delay))
        }
      } while (lastKey && pageCount < maxPages)

      console.log(`Fetched ${allItems.length} ${label}`)
    } catch (err) {
      console.error(`Error fetching ${label}:`, err)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }


  // const fetchAllProductsProgressively = async () => {
  //   if (isFetchingAllProductsRef.current) return

  //   isFetchingAllProductsRef.current = true
  //   setProductSearchLoading(true)

  //   try {
  //     let allFetchedProducts = []
  //     let currentLastKey = null
  //     let pageCount = 0
  //     const maxPages = 50

  //     setFetchProgress({ current: 0, total: maxPages })

  //     do {
  //       pageCount++
  //       setFetchProgress({ current: pageCount, total: maxPages })

  //       const response = await api.getProducts({
  //         limit: 20,
  //         lastKey: currentLastKey,
  //       })

  //       if (response.ok) {
  //         const data = await response.json()
  //         const newProducts = data.products || data.results || []
  //         allFetchedProducts = [...allFetchedProducts, ...newProducts]
  //         setAllProducts([...allFetchedProducts])
  //         setProductOptions([...allFetchedProducts])
  //         currentLastKey = data.lastKey || null
  //       } else {
  //         break
  //       }

  //       // Small delay between pages
  //       if (pageCount < maxPages && currentLastKey) {
  //         await new Promise((resolve) => setTimeout(resolve, 300))
  //       }
  //     } while (currentLastKey && pageCount < maxPages)

  //     console.log(`Fetched ${allFetchedProducts.length} products progressively`)
  //   } catch (err) {
  //     console.error("Error fetching products:", err)
  //   } finally {
  //     setProductSearchLoading(false)
  //     isFetchingAllProductsRef.current = false
  //   }
  // }
  // const fetchAllProductsProgressively = () =>
  //   fetchProgressively({
  //     fetchFn: api.getProducts,
  //     onData: (data) => {
  //       setAllProducts(data)
  //       setProductOptions(data)
  //     },
  //     setLoading: setProductSearchLoading,
  //     isFetchingRef: isFetchingAllProductsRef,
  //     setProgress: setFetchProgress,
  //     label: "products",
  //   })

  const fetchAllSuppliersProgressively = () =>
    fetchProgressively({
      fetchFn: api.getSuppliers,
      onData: setAllSuppliers,
      setLoading: setSupplierLoading,
      isFetchingRef: isFetchingSuppliersRef,
      setProgress: setSupplierFetchProgress,
      label: "suppliers",
    })

  const fetchAllCategoriesProgressively = () =>
    fetchProgressively({
      fetchFn: api.getProductsCategories,
      onData: setAllCategories,
      setLoading: setCategoryLoading,
      isFetchingRef: isFetchingCategoriesRef,
      setProgress: setCategoryFetchProgress,
      label: "categories",
    })

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    searchTimeoutRef.current = setTimeout(() => {
      // if (!isFetchingAllProductsRef.current && allProducts.length === 0) {
      //   console.log("Fetching all products progressively...")
      //   fetchAllProductsProgressively()
      // }

      if (!isFetchingSuppliersRef.current && allSuppliers.length === 0) {
        console.log("Fetching all suppliers progressively...")
        fetchAllSuppliersProgressively()
      }

      if (!isFetchingCategoriesRef.current && allCategories.length === 0) {
        console.log("Fetching all categories progressively...")
        fetchAllCategoriesProgressively()
      }
    }, 500)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  // Fetch
  // const fetchSuppliers = async (useLastKey = null) => {
  //   try {
  //     const response = await api.getSuppliers({
  //       limit: supplierPageSize,   // dynamic limit
  //       lastKey: useLastKey        // pagination key
  //     });

  //     console.log("Supplier fetch response:", response.status);

  //     if (!response.ok) {
  //       const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
  //       throw new Error(errorData.error || `HTTP ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log("Supplier data received:", data);

  //     const fetchedSuppliers = data.suppliers || data.results || [];
  //     const newLastKey = data.lastKey || null;

  //     setSupplierOptions(fetchedSuppliers);
  //     // setSupplierLastKey(newLastKey);
  //     // setHasMoreSuppliers(!!newLastKey);

  //   } catch (error) {
  //     console.error("Failed to load suppliers", error);
  //   }
  // };

  const fetchProducts = async (useLastKey = null) => {
    try {
      const response = await api.getProducts({
        limit: -1,   // dynamic limit
        lastKey: useLastKey        // pagination key
      });

      console.log("products fetch response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("products data received:", data);

      const fetchedCategory = data.products || data.results || [];


      setAllProducts(fetchedCategory);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };

  // useEffect(() => {
  //   fetchSuppliers();
  //   fetchProductsCategories()
  // }, []);
  useEffect(() => {
    fetchProducts()
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
    setLoading(true)
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
        setPlanogramMeta({
          machineStructureId: result?.planogramStructure[0].machineStructureId,
          planogramVersionId: result?.planogramStructure[0].planogramVersionId,
          machineId: result?.planogramStructure[0].machineId,
          primeMachine: result?.planogramStructure[0].primeMachine
        })
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
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchPlanogramStructure()
  }, [machineId])

  // 🔹 Sync all cards height in each shelf row
  useEffect(() => {
    Object.values(shelfRefs.current).forEach((cards) => {
      if (!cards || cards.length === 0) return;
      const maxHeight = Math.max(...cards.map((el) => el.offsetHeight));
      cards.forEach((el) => {
        if (el) el.style.height = `${maxHeight}px`;
      });
    });
  }, [structure]);


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <button
        onClick={() => router.push(
          `/dashboard/planogram-version-details?planogramVersionId=${planogramMeta?.planogramVersionId}`
        )}
        className="mb-3 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
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
        Back to Planogram Details
      </button>
      <div className="mx-auto flex-1">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="mb-8">
            <h3 className="text-4xl font-bold text-gray-900 mb-2">Planogram Structure</h3>
            <p className="text-gray-600">Manage channel configurations and shelf assignments</p>
          </div>
          <div>
            <button
              onClick={action === "finalize" ? handleFinalizePlanogram : handleUpdatePlanogram}
              disabled={updatingPlanogram}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center gap-2"
            >
              {updatingPlanogram && <Loader2 className="h-4 w-4 animate-spin" />}
              {updatingPlanogram ? "Updating..." : action === "finalize" ? "Finalize Structure" : "Update Structure"}
            </button>
          </div>
        </div>

        <div className="">
          {Object.entries(structure)
            .sort(([a], [b]) => Number(b) - Number(a)) // shelves descending
            .map(([shelfNumber, shelves]) => (
              <div key={shelfNumber} className="space-y-3">
                {/* Shelf header */}
                {/* <div className="flex items-center gap-3">
                  <div className="text-lg font-bold px-4 py-1.5 border-2 border-blue-600 rounded-md bg-white text-blue-600">
                    Channel {shelfNumber}
                  </div>
                  <div className="flex-1 h-px bg-gray-300" />
                </div> */}

                {/* Shelves Grid */}
                <div
                  className="grid  items-stretch"
                  style={{
                    gridTemplateColumns: `repeat(${shelves.length}, 1fr)`,
                  }}
                >
                  {shelves.map((item, shelfIndex) => {
                    const selectedCategories = categoryOptions?.filter((cat) =>
                      item.categoryIds?.includes(cat.productCategoryId)
                    );
                    const selectedSuppliers = supplierOptions?.filter((sup) =>
                      item.supplierIds?.includes(sup.supplierId)
                    );

                    return (
                      <div
                        key={`${item.channel}-${item.shelf}`}
                        ref={(el) => {
                          if (!shelfRefs.current[shelfNumber])
                            shelfRefs.current[shelfNumber] = [];
                          shelfRefs.current[shelfNumber][shelfIndex] = el;
                        }}
                        className="relative border-1 border-gray-200 bg-white min-h-72 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3"
                      >
                        {/* Top Badge */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 whitespace-nowrap text-blue-600">
                            {item.shelf} - {item.channel}
                          </div>
                          {item.channelModified && (
                            <div
                              className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                              title="Modified"
                            />
                          )}
                        </div>
                        {/* Warning: Missing External ID */}
                        {!item.productExternalId && (
                          <div className="absolute top-2 right-2 group cursor-pointer">
                            <AlertTriangle
                              className="h-5 w-5 text-yellow-500"
                              strokeWidth={2}
                            />

                            {/* Tooltip */}
                            <div className="absolute right-0 mt-2 w-44 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 z-50">
                              External ID not available
                            </div>
                          </div>
                        )}
                        {item?.productImage?.file && (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              // src={`/products/${item.image}`}
                              src={item?.productImage?.file}
                              className="h-24 w-full object-contain rounded"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.png";
                              }}
                            />
                            <div className="text-sm font-semibold text-gray-700 text-center">
                              {item.productName}
                            </div>
                          </div>
                        )}

                        {/* Categories */}
                        {/* {selectedCategories?.length > 0 && (
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
                        )} */}

                        {/* Suppliers */}
                        {/* {selectedSuppliers?.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Suppliers
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {selectedSuppliers.map((sup) => (
                                <span
                                  key={sup.supplierId}
                                  className="bg-blue-100 text-blue-700 border border-blue-300 rounded pl-1 pr-1 text-xs inline-flex items-center"
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
                        )} */}

                        {/* Configure Button */}
                        {action === "finalize" ? <button
                          onClick={() => openEditModal(item, shelfNumber, shelfIndex)}
                          className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Edit Product
                        </button> :
                          <button
                            onClick={() => openEditModal(item, shelfNumber, shelfIndex)}
                            className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Configure
                          </button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>


      </div>

      {/* Edit Modal */}
      {editItem && (
        action === "finalize" ?
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Configure Channel {editItem?.channel} - Shelf {editItem?.shelf}
                </h3>
                <p className="text-sm text-gray-600">Edit product details, categories, suppliers, and capacity limits</p>
              </div>



              {/* Product Image */}
              {editItem?.productImage?.file && (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <img
                    src={editItem.productImage.file}
                    className="h-32 w-full object-contain rounded"
                    onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                  />
                </div>
              )}


              {/* Product Name Input */}
              <div className="mb-6 relative">
                <label htmlFor="product-search" className="text-base font-semibold mb-2 block text-gray-900">
                  Product
                </label>
                <input
                  id="product-search"
                  type="text"
                  placeholder="Search product..."
                  value={editItem.productName || ""}
                  onFocus={() => {
                    setIsProductModalOpen(true)
                    setProductOptions(allProducts) // show all products on focus
                  }}
                  onChange={(e) => {
                    const search = e.target.value
                    setEditItem({ ...editItem, productName: search })

                    if (search.trim() !== "") {
                      const filtered = allProducts.filter((p) =>
                        p.name.toLowerCase().includes(search.toLowerCase())
                      )
                      setProductOptions(filtered)
                    } else {
                      setProductOptions(allProducts) // show all when input is cleared
                    }
                  }}
                  onBlur={() => {
                    // Delay closing so clicks on dropdown work
                    setTimeout(() => setIsProductModalOpen(false), 150)
                  }}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />

                {productSearchLoading && (
                  <div className="absolute right-2 top-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  </div>
                )}

                {productOptions?.length > 0 && isProductModalOpen && (
                  <ul className="absolute z-50 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded mt-1 shadow-lg">
                    {productOptions.map((p) => (
                      <li
                        key={p.productId}
                        onMouseDown={() => {
                          // use onMouseDown to select before input loses focus
                          setEditItem({
                            ...editItem,
                            productName: p.name,
                            productId: p.productId,
                            externalProductId: p.externalId,
                            price: p.costPrice
                          })
                          setProductOptions([]) // close dropdown after selection
                          setIsProductModalOpen(false)
                        }}
                        className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
                      >
                        {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

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

          </div> :
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  Configure Channel {editItem?.channel} - Shelf {editItem?.shelf}
                </h3>
                <p className="text-sm text-gray-600">Set categories, suppliers, and capacity limits</p>
              </div>

              {editItem.primeMachine && <div className="mb-6">
                <label htmlFor="category-select" className="text-base font-semibold mb-3 block text-gray-900">
                  Categories
                </label>
                <select
                  id="category-select"
                  onChange={handleCategorySelect}
                  value=""
                  disabled={!editItem.primeMachine}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select a category...</option>
                  {allCategories
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
              </div>}

              {editItem.primeMachine && <div className="mb-6">
                <label htmlFor="supplier-select" className="text-base font-semibold mb-3 block text-gray-900">
                  Suppliers
                </label>
                <select
                  id="supplier-select"
                  onChange={handleSupplierSelect}
                  value=""
                  disabled={!editItem.primeMachine}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Select a supplier...</option>
                  {allSuppliers
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
              </div>}

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
