"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { RefreshCw, Plus, Search, SquareTerminal, Loader2 } from "lucide-react";
import Loader from "@/app/components/Loader";
import PaginationControls from "@/app/components/products/PaginationControls";
import TerminalManagementTable from "../../components/terminalManagement/TerminalManagementTable";
import { api } from "../../lib/auth";
import AddTerminalModal from "../../components/terminalManagement/AddTerminalModal";

const TerminalManagement = () => {
    const pageSize = 10;

    const [terminals, setTerminals] = useState([]);
    const [editingTerminal, setEditingTerminal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRotating, setIsRotating] = useState(false);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cursor pagination cache (same pattern as Users)
    const [pages, setPages] = useState([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [lastKeys, setLastKeys] = useState([]);
    const [hasNextPage, setHasNextPage] = useState(false);

    // Progressive full load for search
    const [allTerminals, setAllTerminals] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
    const searchTimeoutRef = useRef(null);
    const isFetchingAllRef = useRef(false);

    const filteredTerminals = (() => {
        if (!search) {
            return terminals;
        }

        const searchData = allTerminals.length > 0 ? allTerminals : terminals;
        const searchValue = search.toLowerCase();

        return searchData.filter(
            (terminal) =>
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
    })();

    const fetchAllTerminalsProgressively = async () => {
        if (isFetchingAllRef.current) return;

        isFetchingAllRef.current = true;
        setSearchLoading(true);

        try {
            let allFetchedTerminals = [];
            let currentLastKey = null;
            let pageCount = 0;
            const maxPages = 50;

            setFetchProgress({ current: 0, total: maxPages });

            do {
                pageCount++;
                setFetchProgress({ current: pageCount, total: maxPages });

                const response = await api.getTerminals({
                    limit: 20,
                    lastKey: currentLastKey,
                });

                if (response.ok) {
                    const data = await response.json();
                    const newTerminals = data.terminals || data.results || [];
                    allFetchedTerminals = [...allFetchedTerminals, ...newTerminals];
                    setAllTerminals([...allFetchedTerminals]);
                    currentLastKey = data.lastKey || null;
                } else {
                    break;
                }

                if (pageCount < maxPages && currentLastKey) {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }
            } while (currentLastKey && pageCount < maxPages);

            console.log(
                `Successfully fetched ${allFetchedTerminals.length} terminals for search`
            );
        } catch (error) {
            console.error("Error fetching all terminals:", error);
        } finally {
            setSearchLoading(false);
            isFetchingAllRef.current = false;
        }
    };

    const fetchTerminals = async (useLastKey = null, targetIndex = 0) => {
        try {
            setLoading(true);

            const response = await api.getTerminals({
                limit: pageSize,
                lastKey: useLastKey,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const fetchedTerminals = data.terminals || data.results || [];
            const newLastKey = data.lastKey || null;

            setPages((prev) => {
                const updated = [...prev];
                updated[targetIndex] = fetchedTerminals;
                return updated;
            });

            setLastKeys((prev) => {
                const updated = [...prev];
                updated[targetIndex] = newLastKey;
                return updated;
            });

            setTerminals(fetchedTerminals);
            setHasNextPage(!!newLastKey);
            setPageIndex(targetIndex);
        } catch (err) {
            console.error("Failed to load terminals", err);
        } finally {
            setLoading(false);
        }
    };

    const resetAndFetch = async () => {
        setPages([]);
        setLastKeys([]);
        setPageIndex(0);
        setAllTerminals([]);
        isFetchingAllRef.current = false;
        await fetchTerminals(null, 0);
    };

    const handleNextPage = () => {
        const nextIndex = pageIndex + 1;

        if (pages[nextIndex]) {
            setTerminals(pages[nextIndex]);
            setPageIndex(nextIndex);
            setHasNextPage(!!lastKeys[nextIndex]);
            return;
        }

        const currentLastKey = lastKeys[pageIndex];
        if (currentLastKey) {
            fetchTerminals(currentLastKey, nextIndex);
        }
    };

    const handlePrevPage = () => {
        if (pageIndex === 0) return;

        const prevIndex = pageIndex - 1;
        setTerminals(pages[prevIndex]);
        setPageIndex(prevIndex);
        setHasNextPage(!!lastKeys[prevIndex]);
    };

    const handleRefresh = async () => {
        setIsRotating(true);
        await resetAndFetch();
        setTimeout(() => setIsRotating(false), 500);
    };

    const handleDelete = async (terminal) => {
        if (!window.confirm(`Are you sure you want to delete ${terminal.protocol}?`)) return;
        const data = { terminalId: terminal.terminalId };
        try {
            const res = await api.deleteTerminal(data);

            if (res.status === 204 || res.ok) {
                setTerminals((prev) =>
                    prev.filter((loc) => loc.terminalId !== terminal.terminalId)
                );
                setAllTerminals((prev) =>
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

    const handleEdit = (terminal) => {
        setEditingTerminal(terminal);
        setIsModalOpen(true);
    };

    useEffect(() => {
        fetchTerminals(null, 0);
    }, []);

    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (
            terminals.length > 0 &&
            !isFetchingAllRef.current &&
            allTerminals.length === 0
        ) {
            searchTimeoutRef.current = setTimeout(() => {
                fetchAllTerminalsProgressively();
            }, 500);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [terminals.length]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        );
    }

    const canGoNext = hasNextPage || !!pages[pageIndex + 1];
    const currentPage = pageIndex + 1;
    const totalPages = canGoNext ? currentPage + 1 : currentPage;

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
                        Showing {search ? filteredTerminals.length : terminals.length} terminals
                    </span>
                    {searchLoading && (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                                Loading search data... ({fetchProgress.current}/{fetchProgress.total})
                            </span>
                        </div>
                    )}
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
                            placeholder={
                                allTerminals.length > 0
                                    ? `Search through all ${allTerminals.length} terminals...`
                                    : "Search Terminals..."
                            }
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
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

            {search && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                        Found {filteredTerminals.length} terminal
                        {filteredTerminals.length !== 1 ? "s" : ""} matching &quot;{search}&quot;
                        {allTerminals.length > 0
                            ? ` (searching through ${allTerminals.length} total terminals)`
                            : " (searching current page only)"}
                    </p>
                </div>
            )}

            <TerminalManagementTable
                terminals={filteredTerminals}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            {/* Pagination Controls — hidden while searching */}
            {!search && (
                <PaginationControls
                    paginatedItems={terminals}
                    hasNextPage={canGoNext}
                    hasPrevPage={pageIndex > 0}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onRefresh={handlePrevPage}
                    onNextPage={handleNextPage}
                />
            )}

            {/* Add Terminal Modal */}
            {isModalOpen && (
                <AddTerminalModal
                    closeModal={() => setIsModalOpen(false)}
                    fetchTerminals={resetAndFetch}
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
