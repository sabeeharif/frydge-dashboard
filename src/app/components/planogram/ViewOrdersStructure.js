"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/app/lib/auth";
import Loader from "@/app/components/Loader";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/app/contexts/ToastContext";

const PlanogramStructure = ({ setIsOpenOrder }) => {
    const [editItem, setEditItem] = useState(null)
    const [categories, setCategories] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [maxOrder, setMaxOrder] = useState({})
    const [updatingPlanogram, setUpdatingPlanogram] = useState()
    const [planogramMeta, setPlanogramMeta] = useState(null)
    const searchParams = useSearchParams()
    const machineId = searchParams.get("machineId")
    const planogramVersionId = searchParams.get("planogramVersionId")
    const action = searchParams.get("action")
    const [productOptions, setProductOptions] = useState([])
    const [productSearchLoading, setProductSearchLoading] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [supplierFetchProgress, setSupplierFetchProgress] = useState()
    const [allProducts, setAllProducts] = useState([])
    const [allSuppliers, setAllSuppliers] = useState([])
    const [allCategories, setAllCategories] = useState([])
    const [availableDates, setAvailableDates] = useState(["2025-08-01",
        "2025-08-05",
        "2025-08-10"])
    const [selectedDate, setSelectedDate] = useState("")
    const topScrollRef = useRef(null);
    const contentScrollRef = useRef(null);
    const [categoryFetchProgress, setCategoryFetchProgress] = useState()
    const [supplierLoading, setSupplierLoading] = useState()
    const [categoryLoading, setCategoryLoading] = useState()
    const [groupMachines, setGroupMachines] = useState([]) // all machines
    const [excludeEnabled, setExcludeEnabled] = useState(false)
    const [excludedMachineIds, setExcludedMachineIds] = useState([])
    const [includeEnabled, setIncludeEnabled] = useState(false)
    const [includedMachineIds, setIncludedMachineIds] = useState([])
    const [applyToGroup, setApplyToGroup] = useState(false)
    const pageSize = 10


    const searchTimeoutRef = useRef(null)
    const hasFetchedPlanogramRef = useRef(false)
    const isFetchingCategoriesRef = useRef(false)
    const isFetchingSuppliersRef = useRef(false)
    const router = useRouter()
    const shelfRefs = useRef({});
    const [structure, setStructure] = useState({})
    const [loading, setLoading] = useState(false)
    const { success: toastSuccess } = useToast()

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    const openEditModal = (item, channelNumber, shelfIndex) => {
        setEditItem({ ...item, channelNumber, shelfIndex })
        setCategories(item.categoryIds || [])
        setSuppliers(item.supplierIds || [])
        setMaxOrder(item.maxOrderCapacity || {})
        fetchProducts(item)
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
        setUpdatingPlanogram(true)
        const channelDetails = Object.values(structure).flat()
        const payload = {
            machineStructureId: planogramMeta.machineStructureId,
            planogramVersionId: planogramMeta.planogramVersionId,
            primeMachine: planogramMeta?.primeMachine,
            machineId: planogramMeta.machineId,
            channelDetails: channelDetails,

        }

        console.log("Sending full payload:", payload)

        try {
            // // 🔹 API call
            const response = await api.updatePlangoramVersionStructure(payload.planogramVersionId, payload)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const result = await response.json()
            toastSuccess("Successfully Update Planogram Structure")

            setEditItem(null)
            fetchPlanogramStructure()
        } catch (err) {
            console.error("Update failed:", err)

            alert("Update failed. Please try again.")
        } finally {
            setUpdatingPlanogram(false)
        }
    }

    const handleFinalizePlanogram = async () => {
        setUpdatingPlanogram(true)
        const channelDetails = Object.values(structure).flat()
        const paylod = {
            excludedMachineIds: excludedMachineIds,
            includedMachineIds: includedMachineIds,
            productAssignments: channelDetails
        }

        try {
            // // 🔹 API call
            const response = await api.finalizePlangoramVersionStructure(planogramMeta.planogramVersionId, paylod)

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const result = await response.json()
            console.log("Planogram updated successfully:", result)
            toastSuccess(`${result?.message}`)
            router.push(
                `/dashboard/planogram-version-details?planogramVersionId=${planogramMeta?.planogramVersionId}`
            )
            setEditItem(null)
        } catch (err) {
            console.error("Update failed:", err)

            alert("Update failed. Please try again.")
        } finally {
            setUpdatingPlanogram(false)
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

    const fetchProducts = async (item) => {
        try {
            const response = await api.getProductsByCategoryAndSupplier(
                item.categoryIds,   // dynamic limit
                item?.supplierIds        // pagination key
            );

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

    const handleExcludeMachinesSelect = (e) => {
        const value = e.target.value
        if (value && !excludedMachineIds.includes(value)) {
            setExcludedMachineIds([...excludedMachineIds, value])
        }
    }

    const handleIncludeMachinesSelect = (e) => {
        const value = e.target.value
        if (value && !includedMachineIds.includes(value)) {
            setIncludedMachineIds([...includedMachineIds, value])
        }
    }

    const removeCategory = (catId) => {
        setCategories(categories.filter((c) => c !== catId))
    }

    const removeSupplier = (supId) => {
        setSuppliers(suppliers.filter((s) => s !== supId))
    }

    const fetchInteranalOrdersStructure = async () => {
        setLoading(true)
        try {
            const response = await api.getInternalOreders({
                planogramVersionId: planogramVersionId,
                // machineId: machineId,
                limit: 10
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            console.log("response", response);
        } catch (error) {
            console.error("Failed to fetch planogram structure", error);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        if (!planogramVersionId) return
        if (hasFetchedPlanogramRef.current) return

        hasFetchedPlanogramRef.current = true
        fetchInteranalOrdersStructure()
    }, [planogramVersionId])

    useEffect(() => {
        Object.values(shelfRefs.current).forEach((planogram) => {
            if (!planogram) return;

            Object.values(planogram).forEach((cards) => {
                if (!Array.isArray(cards) || cards.length === 0) return;

                const maxHeight = Math.max(
                    ...cards
                        .filter(Boolean)
                        .map((el) => el.offsetHeight)
                );

                cards.forEach((el) => {
                    if (el) el.style.height = `${maxHeight}px`;
                });
            });
        });
    }, [structure]);


    const fetchPlanogramVersions = async (useLastKey = null) => {
        try {
            let apiUrl = `/api/planogram_versions?limit=${pageSize}`
            if (useLastKey) {
                apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
            }

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey: useLastKey,
                planogramVersionId: planogramMeta?.planogramVersionId
            })
            console.log("Client fetch response status:", response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()

            // Handle different response structures
            const fetchedProducts = data?.planogramVersions[0] || data.results || []
            console.log(fetchedProducts.versionDetails)
            setGroupMachines(fetchedProducts.versionDetails)
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        if (planogramMeta?.planogramVersionId) {
            fetchPlanogramVersions()
        }
    }, [planogramMeta])

    const maxColumns = Math.max(
        ...Object.values(structure).flatMap((p) =>
            Object.values(p.structure).map((s) => s.length)
        )
    );

    const scrollWidth = maxColumns * 280; // card width + gap

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
                onClick={() => {
                    router.push(
                        `/dashboard/planogram-version-details?planogramVersionId=${planogramVersionId}`
                    )
                        ; setIsOpenOrder(false)
                }}
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
                        <h3 className="text-4xl font-bold text-gray-900 mb-2 gap-3 flex">Planogram Version - Previous Orders
                            {planogramMeta?.primeMachine && <span className=" px-3 bg-green-500 text-white rounded-lg text-sm font-semibold
            flex items-center">{planogramMeta?.primeMachine ? "Prime" : ""}</span>} </h3>
                        <p className="text-gray-600">Manage channel configurations and shelf assignments</p>
                    </div>
                    {/* <div>
                        <button
                            onClick={action === "finalize" ? handleFinalizePlanogram : handleUpdatePlanogram}
                            disabled={updatingPlanogram}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg 
            hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed 
            transition-colors flex items-center gap-2"
                        >
                            {updatingPlanogram && <Loader2 className="h-4 w-4 animate-spin" />}
                            {updatingPlanogram ? "Updating..." : action === "finalize" ? "Apply Structure" : "Update Structure"}
                        </button>
                    </div> */}
                </div>


                <div className="flex flex-wrap gap-4 items-center mb-6">
                    {/* Date Dropdown */}
                    {/* <select
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select date</option>
                        {availableDates.map((date) => (
                            <option key={date} value={date}>
                                {new Date(date).toLocaleDateString()}
                            </option>
                        ))}
                    </select> */}

                </div>


                {/* 🔹 TOP SCROLLBAR */}
                <div
                    ref={topScrollRef}
                    className="overflow-x-scroll overflow-y-hidden h-4 mb-4"
                    onScroll={(e) => {
                        if (contentScrollRef.current) {
                            contentScrollRef.current.scrollLeft = e.target.scrollLeft;
                        }
                    }}
                >
                    {/* Dummy width element */}
                    <div style={{ width: `${scrollWidth}px` }} className="h-1" />

                </div>

                {/* 🔹 ACTUAL CONTENT (YOUR CODE) */}
                <div
                    ref={contentScrollRef}
                    className="flex gap-10 overflow-x-scroll hide-scrollbar"
                    onScroll={(e) => {
                        if (topScrollRef.current) {
                            topScrollRef.current.scrollLeft = e.target.scrollLeft;
                        }
                    }}
                >

                    {Object.entries(structure).map(([planogramId, shelvesByNumber]) => (
                        <div key={planogramId} className="mb-10 min-w-max">

                            {/* Planogram Header */}
                            <div className="text-lg font-bold mb-4">
                                Planogram Version: {planogramId}
                            </div>

                            {Object.entries(shelvesByNumber.structure)
                                .sort(([a], [b]) => Number(b) - Number(a))
                                .map(([shelfNumber, shelves]) => (
                                    <div key={shelfNumber} className="space-y-3 mb-6">

                                        <div
                                            className="grid items-stretch"
                                            style={{
                                                gridTemplateColumns: `repeat(${shelves.length}, 1fr)`,
                                            }}
                                        >
                                            {shelves.map((item, shelfIndex) => (
                                                <div
                                                    key={`${planogramId}-${item.channel}-${item.shelf}`}
                                                    ref={(el) => {
                                                        if (!shelfRefs.current[planogramId])
                                                            shelfRefs.current[planogramId] = {};
                                                        if (!shelfRefs.current[planogramId][shelfNumber])
                                                            shelfRefs.current[planogramId][shelfNumber] = [];
                                                        shelfRefs.current[planogramId][shelfNumber][shelfIndex] = el;
                                                    }}
                                                    className="relative border-1 border-gray-200 bg-white min-h-72 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 text-blue-600">
                                                            {item.shelf} - {item.channel}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            openEditModal(item, shelfNumber, shelfIndex, planogramId)
                                                        }
                                                        className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                                    >
                                                        {action === "finalize" ? "Edit Product" : "Configure"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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

                            {planogramMeta?.primeMachine && <div className="mb-6">
                                <label htmlFor="category-select" className="text-base font-semibold mb-3 block text-gray-900">
                                    Categories
                                </label>
                                <select
                                    id="category-select"
                                    onChange={handleCategorySelect}
                                    value=""
                                    disabled={!planogramMeta.primeMachine}
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

                                {categories?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {categories?.map((productCategoryId) => {
                                            const cat = allCategories.find((c) => c.productCategoryId === productCategoryId)
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

                            {planogramMeta?.primeMachine && <div className="mb-6">
                                <label htmlFor="supplier-select" className="text-base font-semibold mb-3 block text-gray-900">
                                    Suppliers
                                </label>
                                <select
                                    id="supplier-select"
                                    onChange={handleSupplierSelect}
                                    value=""
                                    disabled={!planogramMeta.primeMachine}
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

                                {suppliers?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {suppliers?.map((supplierId) => {
                                            const sup = allSuppliers?.find((s) => s.supplierId === supplierId)
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

export default function ViewOrderStructure({ setIsOpenOrder }) {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-50">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            }
        >
            <PlanogramStructure setIsOpenOrder={setIsOpenOrder} />
        </Suspense>
    )
}