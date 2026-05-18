"use client";

import { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, SquareChartGantt, Trash2, Loader2, Search, SquareTerminal } from "lucide-react";
import Loader from "@/app/components/Loader";
import LocationConfigTable from "../../components/location/LocationConfigTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import AddLocationConfigModal from "../../components/location/AddLocationConfigModal";
import TerminalManagementTable from "../../components/terminalManagement/TerminalManagementTable";
import { api } from "../../lib/auth";
import AddTerminalModal from "../../components/terminalManagement/AddTerminalModal";
const LocationConfig = () => {
    const ITEMS_PER_PAGE = 10;
    // States
    const [terminals, setTerminals] = useState([]);
    const [editingTerminal, setEditingTerminal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    const [search, setSearch] = useState("");
    const [lastKey, setLastKey] = useState(null);
    const [nextKey, setNextKey] = useState(null);
    const [pageHistory, setPageHistory] = useState([]);
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredTerminal = terminals.filter(
        (terminal) => {
            const searchValue =
                search.toLowerCase();

            return (
                terminal?.protocol
                    ?.toLowerCase()
                    .includes(searchValue) ||
                terminal?.manufacturer
                    ?.toLowerCase()
                    .includes(searchValue) ||
                terminal?.paymentServiceProvider
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        }
    );


    // Calculate Pagination

    const hasNextPage = !!nextKey;
    const hasPrevPage = pageHistory.length > 0;

    // Fetch
    const fetchTerminals = async (key = null) => {
        try {
            setLoading(true);

            const res = await api.getTerminals({
                limit: ITEMS_PER_PAGE,
                lastKey: key,
            });

            const data = await res.json();

            setTerminals(data.terminals || []);

            // backend should return this
            setNextKey(data.lastKey || null);

        } catch (err) {
            console.error("Failed to load terminals", err);
        } finally {
            setLoading(false);
        }
    };

    const handleNextPage = async () => {
        if (!nextKey) return;

        setPageHistory((prev) => [...prev, lastKey]);

        setLastKey(nextKey);

        setCurrentPage((prev) => prev + 1);

        await fetchTerminals(nextKey);
    };

    const handlePrevPage = async () => {
        if (pageHistory.length === 0) return;

        const history = [...pageHistory];

        const prevKey = history.pop();

        setPageHistory(history);

        setLastKey(prevKey || null);

        setCurrentPage((prev) => Math.max(prev - 1, 1));

        await fetchTerminals(prevKey || null);
    };
    const handleRefresh = async () => {
        setIsRotating(true);       // start spinning
        await fetchTerminals(); // re-fetch the data
        setTimeout(() => setIsRotating(false), 500); // stop spinning after a short delay
    };

    // Handle Delete
    const handleDelete = async (terminal) => {
        if (!window.confirm(`Are you sure you want to delete ${terminal.protocol}?`)) return;
        const data = { terminalId: terminal.terminalId }
        try {
            const res = await api.deleteTerminal(data)

            if (res.status === 204 || res.ok) {
                // Remove deleted terminal from state
                setTerminals((prev) =>
                    prev.filter((loc) => loc.id !== terminal.id)
                );
                alert("Location deleted successfully!");
            } else {
                const errData = await res.json();
                alert(`Failed to delete terminal: ${errData.message || res.statusText}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            alert("An error occurred while deleting the terminal.");
        }
    };

    const handleAdd = () => {
        setEditingTerminal(null); // set
        setIsModalOpen(true); // open modal
    };

    // Handle Edit
    const handleEdit = (terminal) => {
        setEditingTerminal(terminal); // set location to edit
        setIsModalOpen(true); // open modal
    };

    useEffect(() => {
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
                    <SquareTerminal className="h-10 w-10 text-blue-600" />
                    <span className="text-gray-800">Terminal Management</span>
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                        Showing {filteredTerminal?.length} terminals
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
                            placeholder="Search Terminals..."
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

            <TerminalManagementTable
                terminals={filteredTerminal}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={filteredTerminal}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                currentPage={currentPage}
                totalPages={currentPage + (hasNextPage ? 1 : 0)}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
            />

            {/* Add Location Modal */}
            {isModalOpen && (
                <AddTerminalModal
                    closeModal={() => setIsModalOpen(false)}
                    fetchTerminals={fetchTerminals}
                    existingTerminal={editingTerminal}
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
