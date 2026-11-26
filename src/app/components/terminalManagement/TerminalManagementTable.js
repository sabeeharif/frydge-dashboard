import React, { useMemo, useState } from "react";
import {
    ChevronUp,
    ChevronDown,
} from "lucide-react";

const TerminalManagementTable = ({
    terminals = [],
    onEdit,
    onDelete,
}) => {

    // SORT STATE
    const [sortConfig, setSortConfig] = useState({
        key: "last_modified",
        direction: "desc",
    });

    const formatDate = (date) => {
        if (!date) return "N/A";

        const d = new Date(date);

        const formattedDate = d
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-");

        const formattedTime =
            d.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

        return `${formattedDate} , ${formattedTime}`;
    };

    // SORT FUNCTION
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction:
                prev.key === key &&
                    prev.direction === "asc"
                    ? "desc"
                    : "asc",
        }));
    };

    // SORTED DATA
    const sortedTerminal = useMemo(() => {
        const sorted = [...terminals];

        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // DATE SORT
            if (
                sortConfig.key === "last_modified"
            ) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else {
                aValue = String(
                    aValue || ""
                ).toLowerCase();

                bValue = String(
                    bValue || ""
                ).toLowerCase();
            }

            if (aValue < bValue) {
                return sortConfig.direction ===
                    "asc"
                    ? -1
                    : 1;
            }

            if (aValue > bValue) {
                return sortConfig.direction ===
                    "asc"
                    ? 1
                    : -1;
            }

            return 0;
        });

        return sorted;
    }, [terminals, sortConfig]);

    // SORT ICON
    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return (
                <ChevronDown className="h-4 w-4 opacity-40" />
            );
        }

        return sortConfig.direction ===
            "asc" ? (
            <ChevronUp className="h-4 w-4" />
        ) : (
            <ChevronDown className="h-4 w-4" />
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] lg:min-w-[700px]">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <tr>
                            <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">
                                Terminal ID
                            </th>
                            <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">
                                Protocol
                            </th>
                            <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">
                                Manufacturer
                            </th>
                            <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">
                                Payment Service Provider
                            </th>
                            <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedTerminal.map(
                            (terminal) => (
                                <React.Fragment
                                    key={terminal.id || terminal.customTerminalId}
                                >
                                    <tr className="border-b hover:bg-gray-50">
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                            {terminal.customTerminalId || "N/A"}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                            {terminal.protocol || "N/A"}
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                            {terminal.manufacturer || "N/A"}
                                        </td>
                                        <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                            {terminal.paymentServiceProvider || "N/A"}
                                        </td>
                                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 align-middle">
                                            <div className="flex justify-start lg:justify-center items-center gap-2 sm:gap-3 text-[11px] sm:text-sm h-full">
                                                <button
                                                    onClick={() => onEdit(terminal)}
                                                    className="text-blue-600 hover:underline cursor-pointer"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => onDelete(terminal)}
                                                    className="text-red-600 hover:underline cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </React.Fragment>
                            )
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TerminalManagementTable;
