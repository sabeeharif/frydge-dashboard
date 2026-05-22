"use client";
import { api } from "@/app/lib/auth";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TerminalHistoryModal } from "../location/TerminalHistoryModal"


const AddLocationConfigModal = ({ closeModal, fetchLocationConfig, existingLocation = null, terminals }) => {
    const [formData, setFormData] = useState({
        machineSn: existingLocation?.machineSn || "",
        machineId: existingLocation?.machineId || "",
        machineType: existingLocation?.machineType || null,
        friendlyNumber: existingLocation?.friendlyNumber || "",
        friendlyName: existingLocation?.friendlyName || null,
        terminalId: existingLocation?.terminalId || "",
        terminalHistoryId: existingLocation?.terminalHistoryId || "",
        paymentTerminalType: existingLocation?.paymentTerminalType || "",
        insuranceActive: existingLocation?.insuranceActive || null,
        subsidyVoucherAnonym: existingLocation?.subsidyVoucherAnonym || null,
        lastElectricalAudit: existingLocation?.lastElectricalAudit || null,
        nextElectricalAudit: existingLocation?.nextElectricalAudit || null,
        machineKey: existingLocation?.machineKey || null,
        elevatorRoof: existingLocation?.elevatorRoof || null,
        venueName: existingLocation?.venueName || "",
        subsidyVariant: existingLocation?.subsidyVariant || 0,
        subsidyValueLimit: existingLocation?.subsidyValueLimit || "0.00",
        mainPriceOverride: existingLocation?.mainPriceOverride || "",
        mealPriceOverride: existingLocation?.mealPriceOverride || "",
        saladPriceOverride: existingLocation?.saladPriceOverride || "",
        snackPriceOverride: existingLocation?.snackPriceOverride || "",
        drinkPriceOverride: existingLocation?.drinkPriceOverride || "",
        minRevenuePD: existingLocation?.minRevenuePD || null,
        feePM: existingLocation?.feePM || null,
        note: existingLocation?.note || "",
    });
    const [loading, setLoading] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [terminalSearch, setTerminalSearch] = useState("");
    const [terminalHistoryId, setTerminalHistoryId] = useState()
    const terminalDropdownRef = useRef(null);
    const [isTerminalModal, setIsTerminalModal] = useState(false)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                terminalDropdownRef.current &&
                !terminalDropdownRef.current.contains(event.target)
            ) {
                setIsTerminalOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const filteredTerminals = terminals?.filter((item) => {
        const search = terminalSearch.toLowerCase();

        return (
            item?.customTerminalId?.toLowerCase().includes(search) ||
            item?.protocol?.toLowerCase().includes(search)||
            item?.manufacturer?.toLowerCase().includes(search)
        );
    });


    const handleSaveLocation = async () => {
        try {
            setLoading(true);

            const isEdit = !!existingLocation;

            let updatedFormData = { ...formData };

            // =========================
            // CREATE LOCATION
            // =========================
            if (!isEdit) {
                const payload = {
                    customTerminalId: formData.terminalId,
                    machineFriendlyName: formData.friendlyName,
                };

                const assignRes = await api.assignTerminalToMachine(payload);
                const data = await assignRes.json()
                data?.terminal?.terminalHistoryId;

                updatedFormData = {
                    ...updatedFormData,
                    terminalHistoryId: data?.terminal?.terminalHistoryId,
                };

                setFormData(updatedFormData);
            }

            // =========================
            // EDIT LOCATION
            // =========================
            // =========================
            // EDIT LOCATION
            // =========================
            if (isEdit) {
                const oldTerminalId = existingLocation?.terminalId;
                const newTerminalId = formData?.terminalId?.trim();

                // Check if terminal changed
                if (oldTerminalId !== newTerminalId) {

                    if (existingLocation?.terminalHistoryId) {
                        // 1. Unassign old terminal
                        await api.unassignTerminal({
                            terminalHistoryId:
                                existingLocation?.terminalHistoryId,
                        });

                    }

                    // 2. If new terminal is empty
                    // only unassign and clear terminalHistoryId
                    if (!newTerminalId) {
                        updatedFormData = {
                            ...updatedFormData,
                            terminalHistoryId: "",
                        };

                        setFormData(updatedFormData);
                    } else {

                        // 3. Assign new terminal
                        const assignRes = await api.assignTerminalToMachine({
                            customTerminalId: newTerminalId,
                            machineFriendlyName: formData.friendlyName,
                        });

                        const data = await assignRes.json();

                        const terminalHistoryId =
                            data?.terminal?.terminalHistoryId;

                        updatedFormData = {
                            ...updatedFormData,
                            terminalHistoryId,
                        };

                        setFormData(updatedFormData);
                    }
                }
            }

            // =========================
            // SAVE LOCATION API
            // =========================
            const url = isEdit
                ? `https://reporting241024.frydge.com/location-config/api.php?id=${existingLocation.id}`
                : "https://reporting241024.frydge.com/location-config/api.php";

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedFormData),
            });

            if (!res.ok) {
                throw new Error(
                    `${isEdit ? "Update" : "Add"} location failed`
                );
            }

            fetchLocationConfig?.();
            closeModal();

            if (!isEdit) {
                setFormData({
                    machineSn: "",
                    machineId: "",
                    friendlyNumber: "",
                    terminalId: "",
                    venueName: "",
                    subsidyVariant: 0,
                    subsidyValueLimit: "0.00",
                    note: "",
                    terminalHistoryId: "",
                });
            }
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-800">Add Location Config</h3>
                    <button
                        onClick={closeModal}
                        className="p-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Venue Name
                            </label>
                            <input
                                type="text"
                                placeholder="Venue Name"
                                value={formData.venueName}
                                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Machine SN
                            </label>
                            <input
                                type="text"
                                placeholder="Machine SN"
                                value={formData.machineSn}
                                onChange={(e) => setFormData({ ...formData, machineSn: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Machine ID
                            </label>
                            <input
                                type="text"
                                placeholder="Machine ID"
                                value={formData.machineId}
                                onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Machine Type
                            </label>
                            <input
                                type="text"
                                placeholder="Machine Type"
                                value={formData.machineType}
                                onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Friendly Number
                            </label>
                            <input
                                type="text"
                                placeholder="Friendly Number"
                                value={formData.friendlyNumber}
                                onChange={(e) => setFormData({ ...formData, friendlyNumber: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Friendly Name
                            </label>
                            <input
                                type="text"
                                placeholder="Friendly Name"
                                value={formData.friendlyName}
                                onChange={(e) => setFormData({ ...formData, friendlyName: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div className="relative" ref={terminalDropdownRef}>
                            <label className="flex justify-between relative">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Terminal</span>
                                {formData.terminalId &&
                                    <button onClick={() => setIsTerminalModal(!isTerminalModal)} className="block p-0.5 absolute border-green-500 bg-green-500 text-white bottom-[-4px] right-1 text-[13px] font-semibold rounded-t-md mb-1 border border-b-0">
                                        Terminal History
                                    </button>}
                            </label>

                            {/* Selected Value */}
                            <div
                                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                                className="border px-3 py-2 rounded-lg w-full bg-white flex items-center justify-between cursor-pointer min-h-[42px]"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {formData?.terminalId === "Empty" ? (
                                        <span className=" text-black text-sm">
                                            Empty
                                        </span>
                                    ) : formData?.terminalId ? (
                                        <span className="truncate text-sm">
                                            {
                                                terminals?.find(
                                                    (item) =>
                                                        item.customTerminalId === formData.terminalId
                                                )?.protocol
                                            }
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-sm">
                                            Select Terminal
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {formData?.terminalId && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                setFormData({
                                                    ...formData,
                                                    terminalId: null,
                                                    protocol: null,
                                                });
                                            }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}

                                    <ChevronDown size={18} className="text-gray-500" />
                                </div>
                            </div>

                            {/* Dropdown */}
                            {isTerminalOpen && (
                                <div className="absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-lg overflow-hidden">
                                    {/* Search */}
                                    <div className="p-2 border-b flex w-full justify-between  gap-1">
                                        <div className="flex items-center w-full border rounded-lg px-2">
                                            <Search size={16} className="text-gray-400" />

                                            <input
                                                type="text"
                                                placeholder="Search terminal..."
                                                value={terminalSearch}
                                                onChange={(e) =>
                                                    setTerminalSearch(e.target.value)
                                                }
                                                className="w-full px-2 py-2 outline-none text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    terminalId: "",
                                                    protocol: "",
                                                });

                                                setIsTerminalOpen(false);
                                                setTerminalSearch("");
                                            }}
                                            //  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                                            className="px-3 py-2 text-sm  bg-gradient-to-r from-blue-600 to-purple-600 text-white  rounded-lg  hover:from-blue-700 hover:to-purple-700 transition-colors whitespace-nowrap"
                                        >
                                            Set Empty
                                        </button>
                                    </div>

                                    {/* List */}
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredTerminals?.length > 0 ? (
                                            filteredTerminals?.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            terminalId: item.customTerminalId,
                                                            protocol:
                                                                item.protocol,
                                                        });
                                                        setTerminalHistoryId(item.customTerminalId)
                                                        setIsTerminalOpen(false);
                                                        setTerminalSearch("");
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                >
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {item.customTerminalId}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        {item.protocol}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-sm text-gray-500 text-center">
                                                No Terminal Found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Active Insurance
                            </label>
                            <input
                                type="number"
                                placeholder="Active Insurance"
                                value={formData.insuranceActive}
                                onChange={(e) => setFormData({ ...formData, insuranceActive: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subsidy Voucher Anonym
                            </label>
                            <input
                                type="text"
                                placeholder="Subsidy Voucher Anonym"
                                value={formData.subsidyVoucherAnonym}
                                onChange={(e) => setFormData({ ...formData, subsidyVoucherAnonym: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Electrical Audit
                            </label>
                            <input
                                type="date"
                                placeholder="Last Electrical Audit"
                                value={formData.lastElectricalAudit}
                                onChange={(e) => setFormData({ ...formData, lastElectricalAudit: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Next Electrical Audit
                            </label>
                            <input
                                type="date"
                                placeholder="Next Electrical Audit"
                                value={formData.nextElectricalAudit}
                                onChange={(e) => setFormData({ ...formData, nextElectricalAudit: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Key Type
                            </label>
                            <input
                                type="text"
                                placeholder="Key Type"
                                value={formData.machineKey}
                                onChange={(e) => setFormData({ ...formData, machineKey: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Elevator Roof
                            </label>
                            <input
                                type="text"
                                placeholder="Elevator Roof"
                                value={formData.elevatorRoof}
                                onChange={(e) => setFormData({ ...formData, elevatorRoof: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subsidy Variant
                            </label>
                            <input
                                type="number"
                                placeholder="Subsidy Variant"
                                value={formData.subsidyVariant}
                                onChange={(e) => setFormData({ ...formData, subsidyVariant: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Subsidy Value Limit
                            </label>
                            <input
                                type="text"
                                placeholder="Subsidy Value Limit"
                                value={formData.subsidyValueLimit}
                                onChange={(e) => setFormData({ ...formData, subsidyValueLimit: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Main Price Override
                            </label>
                            <input
                                type="text"
                                placeholder="Main Price Override"
                                value={formData.mainPriceOverride}
                                onChange={(e) => setFormData({ ...formData, mainPriceOverride: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meal Price Override
                            </label>
                            <input
                                type="text"
                                placeholder="Meal Price Override"
                                value={formData.mealPriceOverride}
                                onChange={(e) => setFormData({ ...formData, mealPriceOverride: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Salad Price Override
                            </label>
                            <input
                                type="text"
                                placeholder="Salad Price Override"
                                value={formData.saladPriceOverride}
                                onChange={(e) => setFormData({ ...formData, saladPriceOverride: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Snack Price Override
                            </label>
                            <input
                                type="text"
                                placeholder="Snack Price Override"
                                value={formData.snackPriceOverride || ""}
                                onChange={(e) => setFormData({ ...formData, snackPriceOverride: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Drink Price Override
                            </label>
                            <input
                                type="text"
                                placeholder="Drink Price Override"
                                value={formData.drinkPriceOverride || ""}
                                onChange={(e) => setFormData({ ...formData, drinkPriceOverride: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Revenue PD
                            </label>
                            <input
                                type="text"
                                placeholder="Min Revenue PD"
                                value={formData.minRevenuePD || ""}
                                onChange={(e) => setFormData({ ...formData, minRevenuePD: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fee PM
                            </label>
                            <input
                                type="text"
                                placeholder="Fee PM"
                                value={formData.feePM || ""}
                                onChange={(e) => setFormData({ ...formData, feePM: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Note
                            </label>
                            <textarea
                                placeholder="Note"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="border px-3 py-2 rounded-lg w-full"
                            />
                        </div>
                    </div>
                </div>



                {/* history modal */}
                {isTerminalModal && <TerminalHistoryModal closeModal={() => setIsTerminalModal(false)} terminalHistoryId={terminalHistoryId || existingLocation?.terminalId} />}


                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={closeModal}
                        className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSaveLocation}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? (existingLocation ? "Saving..." : "Adding...") : (existingLocation ? "Save Changes" : "Add Location")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddLocationConfigModal;