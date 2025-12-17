"use client";

import React, { Suspense, useEffect, useState } from "react";
import { PackageSearch, RefreshCw, Plus, SquareChartGantt } from "lucide-react";
import Loader from "@/app/components/Loader";
import ManageProductsModal from "@/app/components/products/ManageProductsModal";
import PlanogramTable from "@/app/components/planogram/PlanogramTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import CreatePlanogramModal from "@/app/components/planogram/CreatePlanogramModal";
import EditPlanogramModal from "@/app/components/planogram/EditPlanogramModal";
import DeleteModal from "@/app/components/products/DeleteModal";
import { AuthService, api } from "@/app/lib/auth"
import { useRouter } from "next/navigation";


const PlanogramManagement = () => {
    // States
    const [loading, setLoading] = useState()
    const [planograms, setPlanograms] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        versionDetails: []
    });
    const [limit, setLimit] = useState(10); // dynamic limit
    const [suppliers, setSuppliers] = useState([]);
    const [supplierLastKey, setSupplierLastKey] = useState(null);
    const [hasMoreSuppliers, setHasMoreSuppliers] = useState(false);
    const [supplierPageSize, setSupplierPageSize] = useState(10);
    const [isRotating, setIsRotating] = useState(false);
    // Modal State
    const [showCreateProductModal, setShowCreateProductModal] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [showEditProductModal, setShowEditProductModal] = useState(false);
    const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
    // Products State
    const [creatingProduct, setCreatingProduct] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [updatingProduct, setUpdatingProduct] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const router = useRouter();

    const pageSize = 10

    // Pagination state
    const itemsPerPage = 10;
    const [page, setPage] = useState(1);

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedPlanograms = planograms?.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const hasNextPage = startIndex + itemsPerPage < planograms?.length;
    const hasPrevPage = page > 1;

    // Handle next page
    const handleNextPage = () => {
        if (hasNextPage) {
            setPage(page + 1);
        }
    };

    // Handle previous page
    const handlePrevPage = () => {
        if (hasPrevPage) {
            setPage(page - 1);
        }
    };

    const handleRefresh = async () => {
        setIsRotating(true);
        setTimeout(() => setIsRotating(false), 600); // stop after animation};
    }

    // Modal
    const handleManage = (product) => {
        setSelectedProduct(product);
        setIsManageModalOpen(true);
    };

    // Input Form
    const handleInputChange = (key, value) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    };

    // Create Product
    const handleCreatePlanogram = async () => {
        // Basic validation
        if (!formData.name) {
            alert("Version name is required");
            return;
        }

        if (!formData.versionDetails.length) {
            alert("Please add at least one machine");
            return;
        }

        const primeCount = formData.versionDetails.filter(v => v.primePlanogram).length;
        if (primeCount !== 1) {
            alert("Exactly one Prime Planogram is required");
            return;
        }

        try {
            setCreatingProduct(true);

            const response = await api.createPlanogramVersion(formData)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({
                    error: "Failed to create planogram",
                }));
                throw new Error(errorData.error);
            }

            const createdPlanogram = await response.json();

            const planogramVersionId = createdPlanogram?.planogramVersionId;

            if (!planogramVersionId) {
                throw new Error("Planogram version ID not returned from API");
            }

            // ✅ Navigate to planogram-structure with ID
            router.push(
                `/dashboard/planogram-structure?planogramVersionId=${planogramVersionId}`
            );

            setShowCreateProductModal(false);

            // Reset form
            setFormData({
                name: "",
                versionDetails: [],
            });

        } catch (error) {
            console.error("Create planogram failed:", error);
            alert(error.message || "Something went wrong");
        } finally {
            setCreatingProduct(false);
            closeCreateProductModal()
        }
    };


    // Modal
    const closeCreateProductModal = () => {
        setShowCreateProductModal(false);

        // Optional: reset form after closing
        setFormData({
            name: "",
            versionDetails: []
        });
    };

    // Modal
    const openEditModal = (product) => {
        setEditingProductId(product.planogramVersionId);

        setFormData({
            name: product.name || "",
            versionDetails: product.versionDetails
        });

        setShowEditProductModal(true);
    };

    // Update Product
    const handleUpdateProduct = async () => {
        setUpdatingProduct(true);

        // Backup previous state in case API fails
        const previousProducts = [...planograms];
        // Optimistic UI update
        setPlanograms((prev) =>
            prev.map((p) => (p.planogramVersionId === editingProductId ? { ...p, ...formData } : p))
        );

        try {
            // Call the API
            const response = await api.updatePlangoramVersion({ planogramVersionId: editingProductId, ...formData });

            if (!response.ok) {
                throw new Error("Failed to update product");
            }

            const updated = await response.json();
            console.log("Product updated successfully:", updated);

            // Close modal on success
            setShowEditProductModal(false);

        } catch (error) {
            console.error("Update failed:", error);

            // Rollback on API error
            setPlanograms(previousProducts);

            alert("Failed to update product. Please try again.");
        } finally {
            setUpdatingProduct(false);
        }
    };

    // Remove Product
    const handleDelete = (product) => {
        setSelectedProduct(product); // store the product to delete
        setShowDeleteProductModal(true); // open modal
    };

    // Function to Perform Deletion
    //   const confirmDeleteProduct = () => {
    //     setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
    //     setShowDeleteProductModal(false);
    //     setSelectedProduct(null);
    //   };

    // Fetch
    const fetchPlanogramVersions = async (useLastKey = null) => {
        setLoading(true)
        try {
            let apiUrl = `/api/planogram_versions?limit=${pageSize}`
            if (useLastKey) {
                apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
            }

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey: useLastKey
            })
            console.log("Client fetch response status:", response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()
            console.log("Client received data:", data)

            // Handle different response structures
            const fetchedProducts = data?.planogramVersions || data.results || []
            setPlanograms(fetchedProducts)
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false)
        }
    };

    // Fetch
    //   const fetchSuppliers = async (useLastKey = null) => {
    //     try {
    //       const response = await api.getSuppliers({
    //         limit: supplierPageSize,   // dynamic limit
    //         lastKey: useLastKey        // pagination key
    //       });

    //       console.log("Supplier fetch response:", response.status);

    //       if (!response.ok) {
    //         const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    //         throw new Error(errorData.error || `HTTP ${response.status}`);
    //       }

    //       const data = await response.json();
    //       console.log("Supplier data received:", data);

    //       const fetchedSuppliers = data.suppliers || data.results || [];
    //       const newLastKey = data.lastKey || null;

    //       setSuppliers(fetchedSuppliers);
    //       setSupplierLastKey(newLastKey);
    //       setHasMoreSuppliers(!!newLastKey);

    //     } catch (error) {
    //       console.error("Failed to load suppliers", error);
    //     }
    //   };

    useEffect(() => {
        fetchPlanogramVersions();
    }, [limit]); // refetch when limit changes
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
                            setShowCreateProductModal(true); setFormData({
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
                planogram={paginatedPlanograms}
                onManage={handleManage}
                onEdit={openEditModal}
                onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={paginatedPlanograms}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
            />

            {/* Modal */}
            {isManageModalOpen && (
                <ManageProductsModal
                    product={selectedProduct}
                    suppliers={suppliers}
                    onAssign={handleAssignSupplier}
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}

            {showCreateProductModal && (
                <CreatePlanogramModal
                    closeModal={closeCreateProductModal}
                    handleCreatePlanogram={handleCreatePlanogram}
                    creatingProduct={creatingProduct}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormData}
                />
            )}

            {showEditProductModal && (
                <EditPlanogramModal
                    closeModal={() => setShowEditProductModal(false)}
                    updatingProduct={updatingProduct}
                    handleUpdateProduct={handleUpdateProduct}
                    formData={formData}
                    handleInputChange={handleInputChange}
                    setFormData={setFormData}
                />
            )}

            {showDeleteProductModal && (
                <DeleteModal
                    open={showDeleteProductModal}
                    onClose={() => setShowDeleteProductModal(false)}
                    onDelete={confirmDeleteProduct}
                />
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
