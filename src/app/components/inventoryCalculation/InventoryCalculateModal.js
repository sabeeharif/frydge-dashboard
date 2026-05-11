"use client";

import { X, Loader2, Search, ChevronUp, ChevronDown } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { api } from "../../lib/auth";
import { useToast } from "../../contexts/ToastContext";

const InventoryCalculateModal = ({
    closeModal,
    machines = [],
    categories = [],
}) => {
    const { success, error } = useToast();
    // STATES
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [loading, setLoading] = useState(false);

    // Toggle States
    const [excludeMachines, setExcludeMachines] = useState(false);
    const [excludeMachinesDropDown, setExcludeMachinesDropDown] = useState(false);
    const [excludeCategories, setExcludeCategories] = useState(false);
    const [excludeCategoriesDropDown, setExcludeCategoriesDropDown] = useState(false);

    // Search States
    const [machineSearch, setMachineSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    // Selected IDs
    const [selectedMachines, setSelectedMachines] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);

    // =========================
    // FILTERED DATA
    // =========================

    const filteredMachines = useMemo(() => {
        return machines.filter((machine) => {
            const search = machineSearch.toLowerCase();

            return (
                machine?.friendlyName
                    ?.toLowerCase()
                    ?.includes(search) ||
                machine?.id
                    ?.toString()
                    ?.toLowerCase()
                    ?.includes(search) ||
                machine?.venue?.name
                    ?.toLowerCase()
                    ?.includes(search)
            );
        });
    }, [machines, machineSearch]);

    const filteredCategories = useMemo(() => {
        return categories.filter((category) =>
            category?.name
                ?.toLowerCase()
                ?.includes(categorySearch.toLowerCase())
        );
    }, [categories, categorySearch]);

    // =========================
    // MACHINE HANDLERS
    // =========================

    const handleMachineChange = useCallback((id) => {
        setSelectedMachines((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            }

            return [...prev, id];
        });
    }, []);

    const handleSelectAllMachines = () => {
        const filteredIds = filteredMachines.map((m) => m.id);

        const allSelected = filteredIds.every((id) =>
            selectedMachines.includes(id)
        );

        if (allSelected) {
            setSelectedMachines((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            );
        } else {
            setSelectedMachines((prev) => [
                ...new Set([...prev, ...filteredIds]),
            ]);
        }
    };

    // =========================
    // CATEGORY HANDLERS
    // =========================

    const handleCategoryChange = useCallback((id) => {
        setSelectedCategories((prev) => {
            if (prev.includes(id)) {
                return prev.filter((item) => item !== id);
            }

            return [...prev, id];
        });
    }, []);

    const handleSelectAllCategories = () => {
        const filteredIds = filteredCategories.map((c) => c.id);

        const allSelected = filteredIds.every((id) =>
            selectedCategories.includes(id)
        );

        if (allSelected) {
            setSelectedCategories((prev) =>
                prev.filter((id) => !filteredIds.includes(id))
            );
        } else {
            setSelectedCategories((prev) => [
                ...new Set([...prev, ...filteredIds]),
            ]);
        }
    };

    // =========================
    // API CALL
    // =========================

    const handleCalculateInventory = async () => {
        try {
            setLoading(true);

            const payload = {
                machines: excludeMachines
                    ? selectedMachines
                    : [],
                categories: excludeCategories
                    ? selectedCategories
                    : [],
            };

            const res = await api.calculateInventory(payload);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data?.message || "Failed to calculate inventory"
                );
            }

            success(data?.message || "Inventory calculation started");

            // OPEN SUCCESS MODAL
            setShowSuccessModal(true);

        } catch (err) {
            console.error(err);

            error(
                err?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
                {/* HEADER */}
                <div className="flex items-center justify-between  border-b border-gray-200 p-6">
                    <span className="text-2xl font-bold text-gray-800">
                        Inventory Calculator
                    </span>

                    <button
                        onClick={closeModal}
                        className="rounded-lg p-2 cursor-pointer text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* MACHINES */}
                    <div className="rounded-2xl border border-gray-200 p-5">
                        <div className="flex  justify-between">
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={excludeMachines}
                                    onChange={(e) => {
                                        setExcludeMachines(
                                            e.target.checked
                                        ); setExcludeMachinesDropDown(true)
                                    }
                                    }
                                    className="h-5 w-5 cursor-pointer"
                                />

                                <span className="text-lg font-semibold text-gray-800">
                                    Select Machines to Exclude
                                </span>
                                {/* COUNT */}
                                <div className=" text-sm text-gray-500">
                                    {selectedMachines.length} machine(s)
                                    selected
                                </div>
                            </label>

                            {excludeMachines && (
                                <button
                                    onClick={() =>
                                        setExcludeMachinesDropDown(
                                            !excludeMachinesDropDown
                                        )
                                    }
                                    className="rounded-lg cursor-pointer border border-gray-200 p-2 hover:bg-gray-100"
                                >
                                    {excludeMachinesDropDown ? (
                                        <ChevronUp className="h-5 w-5" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                        </div>

                        {excludeMachines && excludeMachinesDropDown && (
                            <div className="mt-5">
                                {/* TOP */}
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    {/* SEARCH */}
                                    <div className="relative w-full sm:max-w-sm">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                                        <input
                                            type="text"
                                            placeholder="Search machines..."
                                            value={machineSearch}
                                            onChange={(e) =>
                                                setMachineSearch(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* SELECT ALL */}
                                    <div className="flex gap-2 flex-wrap">
                                        {/* SELECT ALL */}
                                        <button
                                            onClick={handleSelectAllMachines}
                                            className="rounded-lg cursor-pointer bg-blue-100 px-4 py-2 text-sm text-blue-700 hover:bg-blue-200"
                                        >
                                            Select All Filtered
                                        </button>

                                        {/* REMOVE ALL */}
                                        <button
                                            onClick={() => setSelectedMachines([])}
                                            className="rounded-lg cursor-pointer bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                </div>



                                {/* LIST */}
                                <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredMachines.length > 0 ? (
                                        filteredMachines.map(
                                            (machine) => (
                                                <label
                                                    key={machine.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                                                >
                                                    <input
                                                        className="cursor-pointer"
                                                        type="checkbox"
                                                        checked={selectedMachines.includes(
                                                            machine.id
                                                        )}
                                                        onChange={() =>
                                                            handleMachineChange(
                                                                machine.id
                                                            )
                                                        }
                                                    />

                                                    <span className="text-xs inline text-gray-700 ">
                                                        <span className={machine?.venue?.name ? "text-gray-700" : "text-red-600"}>
                                                            {machine?.venue?.name || "N/A"}
                                                        </span>

                                                        <span className={machine?.friendlyName ? "text-gray-700" : "text-red-600"}>
                                                            (  {machine?.friendlyName || "N/A"})
                                                        </span>
                                                    </span>
                                                </label>
                                            )
                                        )
                                    ) : (
                                        <div className="col-span-full text-center text-sm text-gray-500 py-6">
                                            No machines found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CATEGORIES */}
                    <div className="rounded-2xl border border-gray-200 p-5">
                        <div className="flex justify-between">
                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={excludeCategories}
                                    onChange={(e) => {
                                        setExcludeCategories(
                                            e.target.checked
                                        );
                                        setExcludeCategoriesDropDown(true)
                                    }
                                    }
                                    className="h-5 w-5 cursor-pointer"
                                />

                                <span className="text-lg font-semibold text-gray-800">
                                    Select Product Categories to Exclude
                                </span>
                                {/* COUNT */}
                                <div className="mb-3 text-sm text-gray-500">
                                    {
                                        selectedCategories.length
                                    }{" "}
                                    category(s) selected
                                </div>
                            </label>

                            {excludeCategories && (
                                <button
                                    onClick={() =>
                                        setExcludeCategoriesDropDown(
                                            !excludeCategoriesDropDown
                                        )
                                    }
                                    className="rounded-lg border cursor-pointer border-gray-200 p-2 hover:bg-gray-100"
                                >
                                    {excludeCategoriesDropDown ? (
                                        <ChevronUp className="h-5 w-5" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                        </div>

                        {excludeCategories && excludeCategoriesDropDown && (
                            <div className="mt-5">
                                {/* TOP */}
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    {/* SEARCH */}
                                    <div className="relative w-full sm:max-w-sm">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                                        <input
                                            type="text"
                                            placeholder="Search categories..."
                                            value={categorySearch}
                                            onChange={(e) =>
                                                setCategorySearch(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* SELECT ALL */}
                                    <div className="flex gap-2 flex-wrap">
                                        {/* SELECT ALL */}
                                        <button
                                            onClick={handleSelectAllCategories}
                                            className="rounded-lg cursor-pointer bg-blue-100 px-4 py-2 text-sm text-blue-700 hover:bg-blue-200"
                                        >
                                            Select All Filtered
                                        </button>

                                        {/* REMOVE ALL */}
                                        <button
                                            onClick={() => setSelectedCategories([])}
                                            className="rounded-lg cursor-pointer bg-red-100 px-4 py-2 text-sm text-red-700 hover:bg-red-200"
                                        >
                                            Remove All
                                        </button>
                                    </div>
                                </div>



                                {/* LIST */}
                                <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-xl border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map(
                                            (category) => (
                                                <label
                                                    key={category.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                                                >
                                                    <input
                                                    className="cursor-pointer"
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(
                                                            category.id
                                                        )}
                                                        onChange={() =>
                                                            handleCategoryChange(
                                                                category.id
                                                            )
                                                        }
                                                    />

                                                    <span className="text-sm text-gray-700">
                                                        {
                                                            category.name
                                                        }
                                                    </span>
                                                </label>
                                            )
                                        )
                                    ) : (
                                        <div className="col-span-full text-center text-sm text-gray-500 py-6">
                                            No categories found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
                    <button
                        onClick={closeModal}
                        disabled={loading}
                        className="rounded-lg cursor-pointer bg-gray-300 px-6 py-3 text-gray-700 transition hover:bg-gray-400"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCalculateInventory}
                        disabled={loading}
                        className={`flex items-center cursor-pointer gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 ${loading
                            ? "cursor-not-allowed opacity-50"
                            : ""
                            }`}
                    >
                        {loading && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}

                        {loading ? "Executing..." : "Execute"}
                    </button>
                </div>
            </div>
            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Inventory Calculation Started
                                </h3>

                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                    The execution will take time and the requested
                                    Inventory file will be available in Inventory
                                    list after 5 minutes.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    closeModal();
                                }}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    closeModal();
                                }}
                                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryCalculateModal;