"use client";

import { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, SquareChartGantt, Trash2, Loader2 } from "lucide-react";
import Loader from "@/app/components/Loader";
import PaginationControls from "@/app/components/products/PaginationControls";
import InventoryCalculationTable from "../../components/inventoryCalculation/InventoryCalculationTable";
import InventoryCalculateModal from "../../components/inventoryCalculation/InventoryCalculateModal";
import { api } from "../../lib/auth";

const InventoryCalculation = () => {
    const ITEMS_PER_PAGE = 10;
    
    // States
    const [machines, setMachines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    
    // Store tokens for each page
    const [pageTokens, setPageTokens] = useState({ 1: null });
    const [nextToken, setNextToken] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // FIX 1: Fix Pagination Logic
    // Since the API only returns one page of data at a time, 
    // your current table view is just the whole inventory array.
    const paginatedInventory = inventory; 

    // 1. Update the flags to strictly look at your tracked page tokens
    const hasNextPage = !!pageTokens[currentPage + 1]; 
    const hasPrevPage = currentPage > 1;

    const fetchInventory = async (page = 1) => {
        try {
            setLoading(true);

            // Get token assigned for this specific page
            const currentToken = pageTokens[page] || null;

            const res = await api.getInventory({
                limit: ITEMS_PER_PAGE,
                nextToken: currentToken,
            });
            const data = await res.json();
            
            const items = data?.files || [];
            const token = data?.nextToken || null; // This will be null on page 2

            setInventory(items);
            setCurrentPage(page);

            // 2. Map the token to the NEXT page slot only if it exists
            if (token) {
                setPageTokens((prev) => ({
                    ...prev,
                    [page + 1]: token,
                }));
            } else {
                // Clean up any stray forward tokens if we hit the end of the road
                setPageTokens((prev) => {
                    const updated = { ...prev };
                    delete updated[page + 1];
                    return updated;
                });
            }

        } catch (err) {
            console.error("Failed to load inventory", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async () => {
        try {
            const res = await api.getMachines();
            const data = await res.json();
            setMachines(data.results || []);
        } catch (err) {
            console.error("Failed to load machines", err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.getCategories();
            const data = await res.json();
            setCategories(data.results || []);
        } catch (err) {
            console.error("Failed to load categories", err);
        }
    };

    // FIX 2: Trigger API fetches on page changes
    const handleNextPage = () => {
        if (hasNextPage) {
            fetchInventory(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrevPage) {
            fetchInventory(currentPage - 1);
        }
    };

    const handleRefresh = async () => {
        setIsRotating(true);
        await fetchInventory(1); // Refresh back to page 1
        setTimeout(() => setIsRotating(false), 500);
    };

    // Handle Delete
    const handleDelete = async (location) => {
        if (!window.confirm(`Are you sure you want to delete ${location.venueName}?`)) return;

        try {
            const res = await fetch(
                `https://reporting241024.frydge.com/location-config/api.php?id=${location.id}`,
                { method: "DELETE" }
            );

            if (res.status === 204 || res.ok) {
                setInventory((prev) => prev.filter((loc) => loc.id !== location.id));
                alert("Location deleted successfully!");
            } else {
                const errData = await res.json();
                alert(`Failed to delete location: ${errData.message || res.statusText}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("An error occurred while deleting the location.");
        }
    };

    const handleAdd = () => setIsModalOpen(true);
    
    const handleEdit = (location) => {
        // missing setEditingLocation state logic if needed
        setIsModalOpen(true);
    };

    useEffect(() => {
        // Run parallel instead of chaining multiple individual loading states
        const initFetch = async () => {
            setLoading(true);
            await Promise.all([fetchInventory(1), fetchCategories(), fetchMachines()]);
            setLoading(false);
        };
        initFetch();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-8">
            {/* Head */}
            <div className="space-y-3">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 text-left">
                        <SquareChartGantt className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
                        <span className="text-gray-800">Inventory Calculation</span>
                    </h1>
                    <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600">
                        <span>Showing {inventory?.length} inventory calculation(s)</span>
                    </div>
                </div>

                <div className="flex gap-2 sm:gap-3 lg:justify-end">
                    <button
                        onClick={handleRefresh}
                        className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRotating ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleAdd}
                        className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                    >
                        <span className="sm:hidden">Calculate</span>
                        <span className="hidden sm:inline">Calculate Inventory</span>
                    </button>
                </div>
            </div>

            <InventoryCalculationTable
                inventorys={paginatedInventory}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={paginatedInventory}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                currentPage={currentPage}
                totalPages={currentPage}
                onRefresh={handlePrevPage} // Assuming this maps to prev page click in your component
                onNextPage={handleNextPage}
                pageName="InventoryCalculation"
            />

            {/* Inventory Calculate Modal */}
            {isModalOpen && (
                <InventoryCalculateModal
                    closeModal={() => setIsModalOpen(false)}
                    machines={machines}
                    categories={categories}
                />
            )}
        </div>
    );
};

export default function InventoryCalculationPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                    <Loader />
                </div>
            }
        >
            <InventoryCalculation />
        </Suspense>
    );
}