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
                limit: ITEMS_PER_PAGE,
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
        <div className="p-8 space-y-8">
            {/* Head */}
            <div className="">
                <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <SquareChartGantt className="h-10 w-10 text-blue-600" />
                    <span className="text-gray-800">Location Configuration</span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                        Showing {filteredLocations?.length} location configs
                    </span>
                </div>
            </div>

            {/* Head - 2 */}
            <div className="">
                <div className="flex flex-col items-center sm:flex-row justify-between gap-4">
                    {/* SEARCH */}
                    <div className="relative w-full sm:max-w-sm">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                        <input
                            type="text"
                            placeholder="Search locations..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRefresh}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
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
