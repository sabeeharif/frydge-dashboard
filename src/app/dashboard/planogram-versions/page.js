"use client";

import React, { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, SquareChartGantt, Trash2, Loader2 } from "lucide-react";
import Loader from "@/app/components/Loader";
import PlanogramTable from "@/app/components/planogram/PlanogramTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import CreatePlanogramModal from "@/app/components/planogram/CreatePlanogramModal";
import EditPlanogramModal from "@/app/components/planogram/EditPlanogramModal";
import { api } from "@/app/lib/auth"
import { useRouter } from "next/navigation";
import { useToast } from "@/app/contexts/ToastContext";


const PlanogramManagement = () => {
    // States
    const [loading, setLoading] = useState()
    const [planograms, setPlanograms] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        versionDetails: []
    });
    const [limit, setLimit] = useState(10); // dynamic limit
    const [isRotating, setIsRotating] = useState(false);
    // Modal State
    const [showCreatePlanogramModal, setShowCreatePlanogramModal] = useState(false);
    const [showEditPlanogramModal, setShowEditPlanogramModal] = useState(false);
    const [showDeletePlanogramModal, setShowDeletePlanogramModal] = useState(false);

    // planogram State
    const [creatingPlanogram, setCreatingPlanogram] = useState(false);
    const [updatingPlanogram, setUpdatingPlanogram] = useState(false);
    const [deletingPlanogram, setDeletingPalogram] = useState(false);
    const [editingPlanogramId, setEditingPlanogramId] = useState(null);
    const [selectedPlanogram, setSelectedPlanogram] = useState(null);
    const [deleteingPlanogramId, setDeleteingPlanogramId] = useState(null);
    const router = useRouter();

    const pageSize = 10;

    // cursor pagination
    const [planogramLastKey, setPlanogramLastKey] = useState(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // cache + page index
    const pageCacheRef = React.useRef({});
    const currentPageRef = React.useRef(0);
    const { success: toastSucess } = useToast()

    // Handle next page
    const handleNextPage = () => {
        if (!hasNextPage) return;

        const nextPage = currentPageRef.current + 1;

        // ✅ From cache
        if (pageCacheRef.current[nextPage]) {
            currentPageRef.current = nextPage;
            const cached = pageCacheRef.current[nextPage];

            setPlanograms(cached.items);
            setPlanogramLastKey(cached.lastKey);
            setHasPrevPage(true);
            setHasNextPage(cached.items.length === pageSize);
            setCurrentPage(currentPage + 1)
            return;
        }

        // ✅ API call
        currentPageRef.current = nextPage;
        fetchPlanogramVersions(planogramLastKey);
    };

    // Handle prev page
    const handlePrevPage = () => {
        if (currentPageRef.current === 0) return;

        const prevPage = currentPageRef.current - 1;
        const cached = pageCacheRef.current[prevPage];
        if (!cached) return;

        currentPageRef.current = prevPage;

        setPlanograms(cached.items);
        setPlanogramLastKey(cached.lastKey);
        setHasPrevPage(prevPage > 0);
        setHasNextPage(true);
    };

    // Handle Refresh
    const handleRefresh = async () => {
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 600); // stop after animation};
    }

    // Input Form
    const handleInputChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    // Create planogram
    const handleCreatePlanogram = async () => {
        setCreatingPlanogram(true);
        // Basic validation
        if (!formData.name) {
            setCreatingPlanogram(false)
            alert("Version name is required");
            return;
        }

        if (!formData.versionDetails.length) {
            setCreatingPlanogram(false)
            alert("Please add at least one machine");
            return;
        }

        const primeCount = formData.versionDetails.filter(v => v.primePlanogram).length;
        if (primeCount !== 1) {
            setCreatingPlanogram(false)
            alert("Exactly one Prime Planogram is required");
            return;
        }

        try {
            const response = await api.createPlanogramVersion(formData)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Failed to create planogram",
                }));
                throw new Error(errorData.error);
            }


            const createdPlanogram = await response.json();

            const planogramVersionId = createdPlanogram?.planogramVersionId;
            // 2️⃣ INIT STRUCTURE API CALL
            const initRes = await api.initPlanogramStructure(planogramVersionId, { force: false });

            if (!initRes.ok) {
                throw new Error("Structure init failed");
            }
            if (!planogramVersionId) {
                throw new Error("Planogram version ID not returned from API");
            }

            // ✅ Navigate to planogram-structure with ID
            router.push(
                `/dashboard/planogram-version-details?planogramVersionId=${planogramVersionId}`
            );

            // setShowCreatePlanogramModal(false);

            // Reset form
            setFormData({
                name: "",
                versionDetails: [],
            });

        } catch (error) {
            console.error("Create planogram failed:", error);
            alert(error.message || "Something went wrong");
            setCreatingPlanogram(false);
        } finally {
            setCreatingPlanogram(false);
        }
    };

    // CLose Create Modal
    const closeCreatePlanogramModal = () => {
        setShowCreatePlanogramModal(false);

        // Optional: reset form after closing
        setFormData({
            name: "",
            versionDetails: []
        });
    };

    // Open Edit Modal
    const openEditModal = async (planogram) => {
        setEditingPlanogramId(planogram.planogramVersionId);
        setSelectedPlanogram(planogram);

        // console.log("openEditModal", planogram)

        const detailResponse = await api.planogramVersionDetails({
            versionDetailId: planogram?.versionDetailId, // assuming _id is the version ID
            limit: 10, // or any limit you want
        });

        if (!detailResponse.ok) {
            alert("Failed to fetch planogram details. Please try again.");
            return;
        }

        const detailData = await detailResponse.json();
        // console.log("detailData", detailData)

        setFormData({
            name: planogram.name || "",
            versionDetails: detailData?.versionDetails
        });

        setShowEditPlanogramModal(true);
    };

    // Open Delete Modal
    const openDeleteModal = (planogram) => {
        setDeleteingPlanogramId(planogram.planogramVersionId);

        setFormData({
            name: planogram.name || "",
            versionDetails: planogram.versionDetails
        });

        setShowDeletePlanogramModal(true);
    };

    // Update Product
    const handleUpdatePlanogram = async () => {
        setUpdatingPlanogram(true);
        // console.log("formData", formData);
        // console.log("selectedPlanogram", selectedPlanogram);

        // Backup previous state in case API fails
        const previousPlanogram = [...planograms];
        // Optimistic UI update
        setPlanograms((prev) =>
            prev.map((p) => (p.planogramVersionId === editingPlanogramId ? { ...p, ...formData } : p))
        );

        try {
            // Call the API
            const response = await api.updatePlangoramVersion({ planogramVersionId: editingPlanogramId, ...formData, versionDetailId: selectedPlanogram?.versionDetailId });

            if (!response.ok) {
                throw new Error("Failed to update planogram");
            }

            const updated = await response.json();
            console.log("Product updated successfully:", updated);

            // 🔹 Fire and forget (background)
            api.initPlanogramStructure(editingPlanogramId, { force: true })
                .then((res) => {
                    if (!res.ok) {
                        console.error("Structure init failed");
                    }
                })
                .catch((err) => console.error("Structure init error:", err));

            // Close modal immediately
            setShowEditPlanogramModal(false);

        } catch (error) {
            console.error("Update failed:", error);

            // Rollback on API error
            setPlanograms(previousPlanogram);

            alert("Failed to update planogram. Please try again.");
        } finally {
            setUpdatingPlanogram(false);
        }
    };

    // Fetch
    const fetchPlanogramVersions = async (lastKey = null) => {
        try {
            setLoading(true);

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            const fetched = data.planogramVersions || [];
            const newLastKey = data.lastKey || null;

            // 🔹 Cache current page
            pageCacheRef.current[currentPageRef.current] = {
                items: fetched,
                lastKey: newLastKey,
            };

            // console.log("dd", fetched)
            setPlanograms(fetched);
            setPlanogramLastKey(newLastKey);

            // ✅ CRITICAL FIX
            setHasNextPage(fetched.length === pageSize);
            setHasPrevPage(currentPageRef.current > 0);

        } catch (err) {
            console.error("Failed to load planograms", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDeletePalnogram = async () => {

        if (!deleteingPlanogramId) return;

        try {
            setDeletingPalogram(true);

            const response = await api.deletePlangoramVersion({
                planogramVersionId: deleteingPlanogramId,
            });

            if (!response.ok) {
                throw new Error("Failed to delete Planogram");
            }
            toastSucess("Planogram Delete Sucessfully")
            await fetchPlanogramVersions(null);

        } catch (error) {
            console.error("Delete supplier error:", error);
        } finally {
            setDeletingPalogram(false);
            setShowDeletePlanogramModal(false)
            setDeleteingPlanogramId(null)
        }

    }

    useEffect(() => {
        currentPageRef.current = 0;
        pageCacheRef.current = {};

        fetchPlanogramVersions(null);
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">

            {/* Head */}
            <div className="">
                <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <SquareChartGantt className="h-10 w-10 text-blue-600" />
                    <span className="text-gray-800">Planogram Versions </span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Showing {planograms?.length} Planogram Versions</span>
                </div>
            </div>

            {/* Head - 2 */}
            <div className="">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            setShowCreatePlanogramModal(true); setFormData({
                                name: "",
                                versionDetails: [],
                            });
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Planogram Versions
                    </button>
                </div>
            </div>

            {/* Table */}
            <PlanogramTable
                planogram={planograms}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={planograms}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                totalPages={1}
                currentPage={currentPage}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
            />

            {showCreatePlanogramModal && (
                <CreatePlanogramModal
                    closeModal={closeCreatePlanogramModal}
                    handleCreatePlanogram={handleCreatePlanogram}
                    creatingPlanogram={creatingPlanogram}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormData}
                />
            )}

            {showEditPlanogramModal && (
                <EditPlanogramModal
                    closeModal={() => setShowEditPlanogramModal(false)}
                    updatingPlanogram={updatingPlanogram}
                    handleUpdatePlanogram={handleUpdatePlanogram}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormData}
                />
            )}

            {showDeletePlanogramModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="p-6">
                            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Planogram</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Are you sure you want to delete ({formData.name}) and all its data?
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeletePlanogramModal(false)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeletePalnogram}
                                    className=" px-4 py-2 flex justify-center items-center gap-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    {deletingPlanogram && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {deletingPlanogram ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function PlanogramManagementPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                    <Loader />
                </div>
            }
        >
            <PlanogramManagement />
        </Suspense>
    );
}
