"use client";

import { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, SquareChartGantt, Trash2, Loader2, Search } from "lucide-react";
import Loader from "@/app/components/Loader";
import LocationConfigTable from "../../components/location/LocationConfigTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import AddLocationConfigModal from "../../components/location/AddLocationConfigModal";
import { api } from "@/app/lib/auth";
const LocationConfig = () => {
    const ITEMS_PER_PAGE = 10;
    // States
    const [terminals, setTerminals] = useState([]);
    const [locationConfigs, setLocationConfigs] = useState([]);
    const [editingLocation, setEditingLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    const [search, setSearch] = useState("");
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredLocations = locationConfigs.filter(
        (location) => {
            const searchValue =
                search.toLowerCase();

            return (
                location?.venueName
                    ?.toLowerCase()
                    .includes(searchValue) ||
                location?.machineType
                    ?.toLowerCase()
                    .includes(searchValue) ||
                location?.terminalId
                    ?.toLowerCase()
                    .includes(searchValue)
                ||
                location?.machineSn
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        }
    );


    // Calculate Pagination
    const totalPages = Math.ceil(
        filteredLocations.length /
        ITEMS_PER_PAGE
    );

    const paginatedLocations =
        filteredLocations.slice(
            (currentPage - 1) *
            ITEMS_PER_PAGE,
            currentPage *
            ITEMS_PER_PAGE
        );

    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Fetch
    const fetchLocationConfig = async () => {
        try {
            setLoading(true);

            const res = await fetch(
                "https://reporting241024.frydge.com/location-config/api.php"
            );

            const data = await res.json();

            setLocationConfigs(data);
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
        await fetchLocationConfig(); // re-fetch the data
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
        setEditingLocation(null); // set
        setIsModalOpen(true); // open modal
    };

    // Handle Edit
    const handleEdit = (location) => {
        setEditingLocation(location); // set location to edit
        setIsModalOpen(true); // open modal
    };

    const fetchTerminals = async () => {
        try {
            setLoading(true);

            const res = await api.getTerminals({
                limit: -1,
            });

            const data = await res.json();

            setTerminals(data.terminals || []);

        } catch (err) {
            console.error("Failed to load terminals", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLocationConfig();
        fetchTerminals();
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        )
    }

    return (
        <div className="space-y-4 lg:space-y-8">
            {/* Head */}
            <div>
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-800 mb-1 lg:mb-2 flex items-center gap-2 lg:gap-3 text-left">
                    <SquareChartGantt className="h-6 w-6 lg:h-10 lg:w-10 text-blue-600 shrink-0" />
                    <span className="text-gray-800">Location Configuration</span>
                </h1>
                <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-600">
                    <span>
                        Showing {filteredLocations?.length} location configs
                    </span>
                </div>
            </div>

            {/* Head - 2 */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    {/* SEARCH */}
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm lg:text-base outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleRefresh}
                            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRotating ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleAdd}
                            className="flex-1 sm:flex-none px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center justify-center gap-1.5 sm:gap-2"
                        >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Add
                        </button>
                    </div>
                </div>
            </div>

            <LocationConfigTable
                locations={paginatedLocations}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={paginatedLocations}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
            />

            {/* Add Location Modal */}
            {isModalOpen && (
                <AddLocationConfigModal
                    closeModal={() => setIsModalOpen(false)}
                    fetchLocationConfig={fetchLocationConfig}
                    existingLocation={editingLocation}
                    terminals={terminals}
                />
            )}
        </div>
    );
};

export default function LocationConfigPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                    <Loader />
                </div>
            }
        >
            <LocationConfig />
        </Suspense>
    );
}
