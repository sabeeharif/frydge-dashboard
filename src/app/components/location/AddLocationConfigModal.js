"use client";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";

const AddLocationConfigModal = ({ closeModal, fetchLocationConfig, existingLocation = null }) => {
    const [formData, setFormData] = useState({
        machineSn: existingLocation?.machineSn || "",
        machineId: existingLocation?.machineId || "",
        friendlyNumber: existingLocation?.friendlyNumber || "",
        terminalId: existingLocation?.terminalId || "",
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

    const handleSaveLocation = async () => {
        try {
            setLoading(true);

            const isEdit = !!existingLocation;
            const url = isEdit
                ? `https://reporting241024.frydge.com/location-config/api.php?id=${existingLocation.id}`
                : "https://reporting241024.frydge.com/location-config/api.php";

            const res = await fetch(url, {
                method: isEdit ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error(`${isEdit ? "Update" : "Add"} location failed`);

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
                                Terminal ID
                            </label>
                            <input
                                type="text"
                                placeholder="Terminal ID"
                                value={formData.terminalId}
                                onChange={(e) => setFormData({ ...formData, terminalId: e.target.value })}
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