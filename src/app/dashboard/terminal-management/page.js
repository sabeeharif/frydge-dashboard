"use client";

import { Suspense, useEffect, useState } from "react";
import { RefreshCw, Plus, Search, SquareTerminal } from "lucide-react";
import Loader from "@/app/components/Loader";
import PaginationControls from "@/app/components/products/PaginationControls";
import TerminalManagementTable from "../../components/terminalManagement/TerminalManagementTable";
import { api } from "../../lib/auth";
import AddTerminalModal from "../../components/terminalManagement/AddTerminalModal";

const TerminalManagement = () => {
    const ITEMS_PER_PAGE = 10;
    // States
    const [terminals, setTerminals] = useState([]);
    const [editingTerminal, setEditingTerminal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isRotating, setIsRotating] = useState(false);
    const [search, setSearch] = useState("");
    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filteredTerminals = terminals.filter((terminal) => {
        const searchValue = search.toLowerCase();

        return (
            terminal?.customTerminalId
                ?.toLowerCase()
                .includes(searchValue) ||
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
    });

    // Calculate Pagination (client-side, same as Location Configuration)
    const totalPages = Math.ceil(
        filteredTerminals.length / ITEMS_PER_PAGE
    );

    const paginatedTerminals = filteredTerminals.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Fetch all terminals at once so search works across every page
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
        setIsRotating(true);
        await fetchTerminals();
        setTimeout(() => setIsRotating(false), 500);
    };

    // Handle Delete
    const handleDelete = async (terminal) => {
        if (!window.confirm(`Are you sure you want to delete ${terminal.protocol}?`)) return;
        const data = { terminalId: terminal.terminalId };
        try {
            const res = await api.deleteTerminal(data);

            if (res.status === 204 || res.ok) {
                setTerminals((prev) =>
                    prev.filter((loc) => loc.terminalId !== terminal.terminalId)
                );
                alert("Payment terminal deleted successfully!");
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
        setEditingTerminal(null);
        setIsModalOpen(true);
    };

    // Handle Edit
    const handleEdit = (terminal) => {
        setEditingTerminal(terminal);
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchTerminals();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        );
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
                        Showing {filteredTerminals?.length} terminals
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
                terminals={paginatedTerminals}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination Controls */}
            <PaginationControls
                paginatedItems={paginatedTerminals}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onRefresh={handlePrevPage}
                onNextPage={handleNextPage}
            />

            {/* Add Terminal Modal */}
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

export default function TerminalManagementPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                    <Loader />
                </div>
            }
        >
            <TerminalManagement />
        </Suspense>
    );
}
