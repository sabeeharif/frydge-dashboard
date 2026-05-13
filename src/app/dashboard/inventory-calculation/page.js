"use client";

import { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, SquareChartGantt, Trash2, Loader2 } from "lucide-react";
import Loader from "@/app/components/Loader";
import LocationConfigTable from "../../components/location/LocationConfigTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import AddLocationConfigModal from "../../components/location/AddLocationConfigModal";
import InventoryCalculationTable from "../../components/inventoryCalculation/InventoryCalculationTable";
import InventoryCalculateModal from "../../components/inventoryCalculation/InventoryCalculateModal";
import { api } from "../../lib/auth";

const InventoryCalculation = () => {
    const ITEMS_PER_PAGE = 10;
    // States
    const [machines, setMachines] = useState([])
    const [categories, setCategories] = useState([])
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    // Store tokens for each page
    const [pageTokens, setPageTokens] = useState({
        1: null,
    });
    const [nextToken, setNextToken] = useState(null);
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate Pagination
    const totalPages = Math.ceil(inventory.length / ITEMS_PER_PAGE);

    const paginatedInventory = inventory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Fetch
    const fetchInventory = async (page = 1) => {
        try {
            setLoading(true);

            // Get token for current page
            const continuationToken = pageTokens[page];

            const res = await api.getInventory({
                limit: ITEMS_PER_PAGE,
                continuationToken,
            });
            const data = await res.json();
            console.log("API RESPONSE:", data);

            // Your API data
            const items = data?.files || [];

            // Next token from API
            const token = data?.continuationToken || null;

            setInventory(items);

            // Save next page token
            if (token) {
                setPageTokens((prev) => ({
                    ...prev,
                    [page + 1]: token,
                }));
            }

            setNextToken(token);
            setCurrentPage(page);
        } catch (err) {
            console.error("Failed to load inventory", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchMachines = async () => {
        try {
            setLoading(true);

            const res = await api.getMachines()
            const data = await res.json();

            setMachines(data.results);
        } catch (err) {
            console.error("Failed to load location config", err);
        } finally {
            setLoading(false);
        }
    };
    const fetchCategories = async () => {
        try {
            setLoading(true);

            const res = await api.getCategories()
            const data = await res.json();

            setCategories(data.results);
        } catch (err) {
            console.error("Failed to load location config", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (hasPrevPage) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleRefresh = async () => {
        setIsRotating(true);       // start spinning
        await fetchInventory(); // re-fetch the data
        setTimeout(() => setIsRotating(false), 500); // stop spinning after a short delay
    };

    // Handle Delete
    const handleDelete = async (location) => {
        if (!window.confirm(`Are you sure you want to delete ${location.venueName}?`)) return;

        try {
            const res = await fetch(
                `https://reporting241024.frydge.com/location-config/api.php?id=${location.id}`,
                {
                    method: "DELETE",
                }
            );

            if (res.status === 204 || res.ok) {
                // Remove deleted location from state
                setLocationConfigs((prev) => prev.filter((loc) => loc.id !== location.id));
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

    const handleAdd = () => {
        setIsModalOpen(true); // open modal
    };

    // Handle Edit
    const handleEdit = (location) => {
        setEditingLocation(location); // set location to edit
        setIsModalOpen(true); // open modal
    };

    useEffect(() => {
        fetchInventory();
        fetchCategories();
        fetchMachines();
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
                    <span className="text-gray-800">Inventory Calculation</span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Showing {inventory?.length} inventory calculation</span>
                </div>
            </div>

            {/* Head - 2 */}
            <div className="">
                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 cursor-pointer bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                    >
                        Calculate Inventory
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
                totalPages={totalPages}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
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
