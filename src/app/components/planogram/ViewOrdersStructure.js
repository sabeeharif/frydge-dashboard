"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/app/lib/auth";
import Loader from "@/app/components/Loader";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/app/contexts/ToastContext";

const PlanogramStructure = ({ setIsOpenOrder }) => {
    // Local States
    const [scrollWidth, setScrollWidth] = useState(0)
    const [editItem, setEditItem] = useState(null)
    const [categories, setCategories] = useState([])
    const [suppliers, setSuppliers] = useState([])
    const [maxOrder, setMaxOrder] = useState({})
    const [planogramMeta, setPlanogramMeta] = useState(null)
    const searchParams = useSearchParams()
    // Machine
    const [selectedMachine, setSelectedMachine] = useState(null);
    const machineId = searchParams.get("machineId")
    const planogramVersionId = searchParams.get("planogramVersionId")
    const action = searchParams.get("action")
    // Local States
    const [productOptions, setProductOptions] = useState([])
    const [productSearchLoading, setProductSearchLoading] = useState(false)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [supplierFetchProgress, setSupplierFetchProgress] = useState()
    const [categoryFetchProgress, setCategoryFetchProgress] = useState()
    const [allProducts, setAllProducts] = useState([])
    const [allSuppliers, setAllSuppliers] = useState([])
    const [allCategories, setAllCategories] = useState([])
    const [groupMachines, setGroupMachines] = useState([]) // all machines
    const [selectedDate, setSelectedDate] = useState("");
    const [structure, setStructure] = useState({})
    const [loading, setLoading] = useState(false)
    const [supplierLoading, setSupplierLoading] = useState(false)
    const [categoryLoading, setCategoryLoading] = useState(false)
    // Ref
    const topScrollRef = useRef(null);
    const contentScrollRef = useRef(null);
    const searchTimeoutRef = useRef(null)
    const isFetchingCategoriesRef = useRef(false)
    const isFetchingSuppliersRef = useRef(false)
    const shelfRefs = useRef({});
    // Helper
    const router = useRouter()
    const pageSize = 10
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    // Formats a date string into a readable format.
    const formatDate = (dateString, dateOnly = false) => {
        try {
            if (!dateString) return "";

            // Split date and time
            const [datePart, timePart] = dateString.split("T");
            const [day, month, year] = datePart.split("-");
            // const [hour, minute, second] = timePart.split(":");

            // Create valid Date object (YYYY-MM-DDTHH:mm:ss)
            const date = new Date(
                `${year}-${month}-${day}T00:00:01`
            );

            if (dateOnly) {
                return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                });
            }

            return date.toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            return dateString;
        }
    };

    // Formats a date string from "YYYY-MM-DD" to "DD-MM-YYYY" for planned planogram display
    const formatPlannedPlanogramDate = (dateStr) => {
        if (!dateStr) return "";

        const [year, month, day] = dateStr.split("-");
        return `${day}-${month}-${year}`;
    };

    // Handles saving edits made to a specific channel item:
    const handleSave = async () => {
        try {
            // Simulated API call
            // console.log("Saving:", {
            //     channelNumber: editItem.channelNumber,
            //     shelfIndex: editItem.shelfIndex,
            //     categoryIds: categories,
            //     supplierIds: suppliers,
            //     maxOrderCapacity: maxOrder,
            //     productName: editItem?.productName,
            //     productId: editItem?.productId,
            //     externalProductId: editItem?.externalProductId,
            //     price: editItem?.price
            // })

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

    // Helper function to fetch data progressively in pages with optional delay.
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

    // Fetches all suppliers progressively using a helper function,
    // updates state, loading, progress, and prevents duplicate fetches.
    const fetchAllSuppliersProgressively = () =>
        fetchProgressively({
            fetchFn: api.getSuppliers,
            onData: setAllSuppliers,
            setLoading: setSupplierLoading,
            isFetchingRef: isFetchingSuppliersRef,
            setProgress: setSupplierFetchProgress,
            label: "suppliers",
        })

    // Fetches all product categories progressively using a helper function,
    // updates state, loading, progress, and prevents duplicate fetches.
    const fetchAllCategoriesProgressively = () =>
        fetchProgressively({
            fetchFn: api.getProductsCategories,
            onData: setAllCategories,
            setLoading: setCategoryLoading,
            isFetchingRef: isFetchingCategoriesRef,
            setProgress: setCategoryFetchProgress,
            label: "categories",
        })

    // Adds a selected category to the categories list if it's not already present
    const handleCategorySelect = (e) => {
        const value = e.target.value
        if (value && !categories.includes(value)) {
            setCategories([...categories, value])
        }
    };

    // Adds a selected supplier to the suppliers list if not already included
    const handleSupplierSelect = (e) => {
        const value = e.target.value
        if (value && !suppliers.includes(value)) {
            setSuppliers([...suppliers, value])
        }
    }

    // Removes a category from the categories list by filtering out the given catId
    const removeCategory = (catId) => {
        setCategories(categories.filter((c) => c !== catId))
    }

    // Removes a supplier from the suppliers list by filtering out the given supId
    const removeSupplier = (supId) => {
        setSuppliers(suppliers.filter((s) => s !== supId))
    }

    // Fetch and build grouped planogram structure for a machine from internal orders and snapshots
    const fetchInteranalOrdersStructure = async (machine) => {
        let machineId = machine?.machineId
        if (!machineId) return;

        setSelectedMachine(machine); // ⭐ store full machine
        setLoading(true);

        try {
            // 1️⃣ Fetch internal orders
            const response = await api.getInternalOreders({
                planogramVersionId,
                machineId,
                limit: 10,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();

            if (result.planogramOrders?.length > 0) {
                const planograms = {};

                for (const order of result.planogramOrders) {
                    const {
                        planogramOrderId,
                        planogramVersionId,
                        includedMachineIds = [],
                        excludedMachineIds = [],
                        plannedPlanogramDate,
                        orderSnapshotId, // <-- Use this to fetch channels
                    } = order;

                    let snapshotArray = [];

                    // 2️⃣ Fetch channels using orderSnapshotId
                    if (orderSnapshotId) {
                        const snapshotResponse =
                            await api.getOrderSnapshotChannels({
                                snapshotId: orderSnapshotId,
                                machineId: machineId,
                                planogramVersionId: planogramVersionId,
                                plannedPlanogramDate: formatPlannedPlanogramDate(selectedDate),

                            });
                        if (snapshotResponse.ok) {
                            const snapshotData = await snapshotResponse.json();
                            snapshotArray = Object.values(snapshotData?.orderSnapshots[0]?.orderDetails || {}).flat();
                        }
                    } else if (order.orderSnapshot?.[0]?.orderDetails) {
                        // fallback if snapshotId missing
                        snapshotArray = Object.values(order.orderSnapshot[0].orderDetails).flat();
                    }

                    // 3️⃣ Group channels by shelf
                    let grouped = {};
                    if (snapshotArray.length > 0) {
                        grouped = snapshotArray.reduce((acc, item) => {
                            if (!acc[item.shelf]) acc[item.shelf] = [];
                            acc[item.shelf].push(item);
                            return acc;
                        }, {});

                        Object.keys(grouped).forEach((shelf) => {
                            grouped[shelf].sort((a, b) => a.channel - b.channel);
                        });
                    }

                    planograms[plannedPlanogramDate] = {
                        meta: {
                            planogramOrderId,
                            planogramVersionId,
                            includedMachineIds,
                            excludedMachineIds,
                            plannedPlanogramDate,
                        },
                        structure: grouped,
                        hasSnapshot: snapshotArray.length > 0,
                    };
                }

                setPlanogramMeta(planograms);
                setStructure(planograms);
            } else {
                setStructure(result?.internalOrders || []);
            }
        } catch (error) {
            console.error("Failed to fetch planogram structure", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetches planogram versions from the API with optional pagination (lastKey).
    // Handles response parsing, loading state, and filters out machines with errors
    // before updating the grouped machines state.
    const fetchPlanogramVersions = async (useLastKey = null) => {
        setLoading(true)
        try {
            let apiUrl = `/api/planogram_versions?limit=${pageSize}`
            if (useLastKey) {
                apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
            }

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey: useLastKey,
                planogramVersionId: planogramVersionId
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()

            // Handle different response structures
            const fetchedProducts = data?.planogramVersions[0] || data?.results || []
            // console.log("fetchedProducts", fetchedProducts)

            const detailResponse = await api.planogramVersionDetails({
                versionDetailId: fetchedProducts?.versionDetailId,
                limit: 10, // or any limit you want
            });

            const detailData = await detailResponse.json();
            // console.log("detailData", detailData)

            setLoading(false)
            const machines = detailData?.versionDetails?.filter((item) => !item.error)
            // console.log("machines", machines)

            setGroupMachines(machines)
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false)
        }
    };

    // 
    const hasValidSnapshot = (shelvesByNumber) => {
        if (!shelvesByNumber?.structure) return false

        return Object.values(shelvesByNumber.structure).some(
            (shelves) => Array.isArray(shelves) && shelves.length > 0
        )
    }

    // Filters structure entries to include only shelves that have a valid snapshot
    const validEntries = Object?.entries(structure)?.filter(
        ([, shelvesByNumber]) => hasValidSnapshot(shelvesByNumber)
    );

    // On component mount, sets up a debounced effect to progressively fetch all suppliers and categories
    // if they haven't been loaded yet. Clears timeout on unmount to prevent memory leaks.
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

    // Ensures all cards within each shelf have equal height by calculating the tallest card
    // and applying that height to all other cards. Runs whenever the planogram structure changes.
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

    // Fetches planogram versions whenever the planogramVersionId changes
    // Ensures the component has the latest version data for the selected planogram.
    useEffect(() => {
        if (planogramVersionId) {
            fetchPlanogramVersions()
        }
    }, [planogramVersionId])

    // Updates the scrollWidth state based on the content's scrollWidth
    // Runs whenever the planogram structure changes to reflect new content size.
    useEffect(() => {
        if (contentScrollRef.current) {
            setScrollWidth(contentScrollRef.current.scrollWidth)
        }
    }, [structure])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        )
    }

    // console.log("db", groupMachines)
    return (
        <div className="min-h-screen bg-gray-50 pt-4">
            <button
                onClick={() => {
                    if (structure && Object.keys(structure)?.length > 0) {
                        setStructure({}); // reset if it has data
                    } else {
                        router.push(
                            `/dashboard/planogram-version-details?planogramVersionId=${planogramVersionId}`
                        );
                        setIsOpenOrder(false); // otherwise close
                    }
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
                </div>

                {/* Date Selector */}
                <div className="w-1/3 mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Date
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                {/* Table Container */}
                {selectedDate && validEntries?.length === 0 && (
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="w-full border-collapse">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">Machine ID</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">Machine Name</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">Venue Name</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">Prime Planogram</th>
                                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupMachines?.map((machine, index) => (
                                    <tr key={machine?.machineId} className={index !== 0 ? "border-t border-gray-200" : ""}>
                                        {/* Machine ID */}
                                        <td className="px-4 py-4">
                                            <span className="inline-block rounded px-3 py-1 text-sm font-semibold text-gray-800">
                                                {machine.machineId}
                                            </span>
                                        </td>

                                        {/* Machine Name */}
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-800">{machine?.friendlyName}</div>
                                        </td>

                                        {/* Venue Name */}
                                        <td className="px-4 py-4">
                                            <div className="text-sm font-medium text-gray-800">
                                                {machine?.venueName || "_"}
                                            </div>
                                        </td>

                                        {/* Prime Planogram */}
                                        <td className="px-4 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${machine?.primePlanogram ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-500"}`}>
                                                {machine?.primePlanogram ? "Yes" : "No"}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => fetchInteranalOrdersStructure(machine)}
                                                    className="text-green-600 hover:underline cursor-pointer"
                                                >
                                                    View Order
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 🔹 TOP SCROLLBAR */}
                {selectedDate && validEntries?.length === 0 && <div
                    ref={topScrollRef}
                    className="overflow-x-scroll overflow-y-hidden mt-10 h-4 mb-4"
                    onScroll={(e) => {
                        if (contentScrollRef.current) {
                            contentScrollRef.current.scrollLeft = e.target.scrollLeft
                        }
                    }}
                >
                    <div style={{ width: `${scrollWidth}px` }} className="h-1" />
                </div>}

                {/* Machine Info Header */}
                {validEntries?.length > 0 && <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Machine ID</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {selectedMachine?.machineId || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase">Machine Name</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {selectedMachine?.friendlyName || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase">Venue Name</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {selectedMachine?.venueName || "N/A"}
                        </p>
                    </div>
                </div>}

                {/* 🔹 ACTUAL CONTENT */}
                <div
                    ref={contentScrollRef}
                    className="flex gap-10 overflow-x-scroll hide-scrollbar"
                    onScroll={(e) => {
                        if (topScrollRef.current) {
                            topScrollRef.current.scrollLeft = e.target.scrollLeft
                        }
                    }}
                >

                    {validEntries.length === 0 ? (
                        /* 🔹 EMPTY STATE */
                        <div className="min-w-full flex items-center justify-center py-20">
                            <p className="text-gray-500 text-lg font-medium">
                                No orders available to display
                            </p>
                        </div>
                    ) : (
                        /* 🔹 DATA RENDER */
                        validEntries.map(([plannedPlanogramDate
                            , shelvesByNumber]) => (

                            <div key={plannedPlanogramDate
                            } className="mb-10 min-w-full border p-4 border-blue-600 rounded-lg">

                                {/* Planogram Header */}
                                <div className="text-lg font-bold mb-4">
                                    Date: {formatDate(plannedPlanogramDate, true)}
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
                                                        key={`${plannedPlanogramDate
                                                            }-${item.channel}-${item.shelf}`}
                                                        ref={(el) => {
                                                            if (!shelfRefs.current[plannedPlanogramDate
                                                            ])
                                                                shelfRefs.current[plannedPlanogramDate
                                                                ] = {};
                                                            if (!shelfRefs.current[plannedPlanogramDate
                                                            ][shelfNumber])
                                                                shelfRefs.current[plannedPlanogramDate
                                                                ][shelfNumber] = [];
                                                            shelfRefs.current[plannedPlanogramDate
                                                            ][shelfNumber][shelfIndex] = el;
                                                        }}
                                                        className="relative border-1 border-gray-200 bg-white min-h-72 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3"
                                                    >
                                                        {/* Top Badge */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 whitespace-nowrap text-blue-600">
                                                                {item.shelf} - {item.channel}
                                                            </div>
                                                            {/* {item.channelModified && (
                                                                <div
                                                                    className="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                                                                    title="Modified"
                                                                />
                                                            )} */}
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
                                                            <div className="flex flex-col justify-center h-full items-center gap-2">
                                                                <img
                                                                    // src={`/products/${item.image}`}
                                                                    src={item?.productImage?.file}
                                                                    className="h-24 w-auto object-contain rounded"
                                                                    onError={(e) => {
                                                                        e.currentTarget.src = "/placeholder.png";
                                                                    }}
                                                                />
                                                                <div className="text-xs font-semibold text-gray-700 text-center">
                                                                    {item.productName}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col justify-center items-center ">
                                                            <div className="flex  items-center gap-4">

                                                                {/* Categories */}
                                                                {item?.categoryIds?.length > 0 && (
                                                                    <div
                                                                        className="relative inline-block group bg-green-500 text-white px-2 py-0.5 rounded-lg"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    >
                                                                        {/* Trigger */}
                                                                        <span className="text-xs font-semibold cursor-pointer">
                                                                            Categories
                                                                        </span>

                                                                        {/* Tooltip */}
                                                                        <div className="absolute left-0 top-full  hidden group-hover:block z-50">
                                                                            <div className="w-56 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700 max-h-40 overflow-y-auto">
                                                                                {allCategories
                                                                                    ?.filter((cat) =>
                                                                                        item.categoryIds.includes(cat.productCategoryId)
                                                                                    )
                                                                                    .map((cat) => (
                                                                                        <div
                                                                                            key={cat.productCategoryId}
                                                                                            className="py-0.5 whitespace-nowrap"
                                                                                        >
                                                                                            {cat.name}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}



                                                                {/* Suppliers */}
                                                                {item?.supplierIds?.length > 0 && (
                                                                    <div
                                                                        className="relative px-2 py-0.5 bg-blue-600 text-white  rounded-lg inline-block group "
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                    >
                                                                        {/* Trigger */}
                                                                        <span className=" text-xs font-semibold cursor-pointer">
                                                                            Suppliers
                                                                        </span>

                                                                        {/* Tooltip */}
                                                                        <div className="absolute left-0 top-full hidden group-hover:block z-50">
                                                                            <div
                                                                                className="w-56 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700 max-h-40 overflow-y-auto"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                {allSuppliers
                                                                                    ?.filter((sup) =>
                                                                                        item.supplierIds.includes(sup.supplierId)
                                                                                    )
                                                                                    .map((sup) => (
                                                                                        <div
                                                                                            key={sup.supplierId}
                                                                                            className="py-0.5 whitespace-nowrap"
                                                                                        >
                                                                                            {sup.name}
                                                                                        </div>
                                                                                    ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            </div>
                                                            {/* Max Order */}
                                                            <div
                                                                className="relative inline-block group mt-2 bg-gray-500 text-white px-2 py-0.5 rounded-lg"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {/* Trigger */}
                                                                <span className="text-xs font-semibold cursor-pointer">
                                                                    Order Days
                                                                </span>

                                                                {/* Tooltip */}
                                                                <div className="absolute left-0 top-full  hidden group-hover:block z-50">
                                                                    <div className="w-36 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700">
                                                                        {Object.entries(item.maxOrderCapacity || {}).map(
                                                                            ([day, val]) => (
                                                                                <div
                                                                                    key={day}
                                                                                    className="py-0.5 flex justify-between gap-2"
                                                                                >
                                                                                    <span>{day}</span>
                                                                                    <span className="font-semibold">{val}</span>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>


                                                        {/* <button
                                                            onClick={() =>
                                                                openEditModal(item, shelfNumber, shelfIndex, plannedPlanogramDate
)
                                                            }
                                                            className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                                        >
                                                            Edit
                                                        </button> */}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ))
                    )}
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