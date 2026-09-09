"use client";

import {
    X,
    Loader2,
    History,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/app/lib/auth";

export const TerminalHistoryModal = ({
    closeModal,
    terminalHistoryId,
}) => {
    const [terminalHistory, setTerminalHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState({
        key: "assignedDate",
        direction: "desc",
    });

    const fetchTerminlaHistory = async (terminalId) => {
        try {
            setLoading(true);

            const res = await api.getTerminalHistory({
                customTerminalId: terminalId,
            });

            const data = await res.json();

            console.log(data);

            setTerminalHistory(data?.terminals || []);
        } catch (error) {
            console.error(
                "Failed to fetch terminal history:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (terminalHistoryId) {
            fetchTerminlaHistory(terminalHistoryId);
        }
    }, [terminalHistoryId]);

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Sorting Logic
    const sortedTerminalHistory = useMemo(() => {
        const sorted = [...terminalHistory];

        sorted.sort((a, b) => {
            const valueA = a?.[sortConfig.key];
            const valueB = b?.[sortConfig.key];

            // Handle date sorting
            if (
                sortConfig.key === "assignedDate" ||
                sortConfig.key === "removedDate"
            ) {
                const dateA = valueA
                    ? new Date(valueA).getTime()
                    : 0;

                const dateB = valueB
                    ? new Date(valueB).getTime()
                    : 0;

                return sortConfig.direction === "asc"
                    ? dateA - dateB
                    : dateB - dateA;
            }

            // Handle string sorting
            const strA = String(valueA || "").toLowerCase();
            const strB = String(valueB || "").toLowerCase();

            if (sortConfig.direction === "asc") {
                return strA.localeCompare(strB);
            }

            return strB.localeCompare(strA);
        });

        return sorted;
    }, [terminalHistory, sortConfig]);

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key && prev.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return (
                <ArrowUpDown className="h-4 w-4 text-gray-400" />
            );
        }

        return sortConfig.direction === "asc" ? (
            <ArrowUp className="h-4 w-4 text-blue-600" />
        ) : (
            <ArrowDown className="h-4 w-4 text-blue-600" />
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <History className="h-5 w-5 text-white" />
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white">
                                Terminal History
                            </h3>

                            <p className="text-sm text-blue-100">
                                View assigned and unassigned terminal records
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={closeModal}
                        className="p-2 rounded-lg text-white hover:bg-white/20 transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">

                    {/* Loader */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

                            <p className="mt-4 text-gray-600 text-sm">
                                Loading terminal history...
                            </p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading &&
                        sortedTerminalHistory?.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <History className="h-12 w-12 text-gray-400" />

                                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                                    No History Found
                                </h3>

                                <p className="text-sm text-gray-500 mt-1">
                                    No terminal history records are available.
                                </p>
                            </div>
                        )}

                    {/* Table */}
                    {!loading &&
                        sortedTerminalHistory?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-100 border-b border-gray-200">
                                            <tr>

                                                <th
                                                    onClick={() =>
                                                        handleSort(
                                                            "customTerminalId"
                                                        )
                                                    }
                                                    className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Terminal ID
                                                        {renderSortIcon(
                                                            "customTerminalId"
                                                        )}
                                                    </div>
                                                </th>

                                                <th
                                                    onClick={() =>
                                                        handleSort(
                                                            "machineFriendlyName"
                                                        )
                                                    }
                                                    className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Machine Friendly Name
                                                        {renderSortIcon(
                                                            "machineFriendlyName"
                                                        )}
                                                    </div>
                                                </th>

                                                <th
                                                    onClick={() =>
                                                        handleSort(
                                                            "assignedDate"
                                                        )
                                                    }
                                                    className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Assigned Date
                                                        {renderSortIcon(
                                                            "assignedDate"
                                                        )}
                                                    </div>
                                                </th>

                                                <th
                                                    onClick={() =>
                                                        handleSort(
                                                            "removedDate"
                                                        )
                                                    }
                                                    className="px-5 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Unassigned Date
                                                        {renderSortIcon(
                                                            "removedDate"
                                                        )}
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-gray-100">
                                            {sortedTerminalHistory?.map(
                                                (row, index) => (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-blue-50 transition"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="font-medium text-gray-900">
                                                                {row?.customTerminalId ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="text-gray-700">
                                                                {row?.machineFriendlyName ||
                                                                    "N/A"}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="text-sm text-green-700 font-medium">
                                                                {formatDate(
                                                                    row?.assignedDate
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="text-sm text-red-600 font-medium">
                                                                {formatDate(
                                                                    row?.removedDate
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                </div>
            </div>
        </div>
    );
};