"use client";
import { X, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/auth";

const AddTerminalModal = ({ closeModal, fetchTerminals, existingTerminal = null }) => {
    const [formData, setFormData] = useState({
        terminalId: existingTerminal?.terminalId || null,
        customTerminalId: existingTerminal?.customTerminalId || null,
        protocol: existingTerminal?.protocol || "",
        manufacturer: existingTerminal?.manufacturer || "",
        paymentServiceProvider: existingTerminal?.paymentServiceProvider || "",
    });
    const [loading, setLoading] = useState(false);

    const handleSaveTerminal = async () => {
        try {
            setLoading(true);

            const isEdit = !!existingTerminal;

            const res = isEdit ? await api.updateTerminal(formData, existingTerminal?.terminalId) : await api.createTerminal(formData)

            if (!res.ok) throw new Error(`${isEdit ? "Update" : "Add"} location failed`);

            fetchTerminals?.();
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                {/* Header */}
                <div className="px-3 py-3 sm:p-6 border-b border-gray-200 flex items-center justify-between gap-3 shrink-0">
                    <h3 className="text-base sm:text-2xl font-bold text-gray-800">Add Terminal</h3>
                    <button
                        onClick={closeModal}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Terminal ID
                            </label>
                            <input
                                type="text"
                                placeholder="Terminal ID"
                                value={formData.customTerminalId}
                                onChange={(e) => setFormData({ ...formData, customTerminalId: e.target.value })}
                                className="border px-3 py-2.5 rounded-lg w-full text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Protocol
                            </label>
                            <input
                                type="text"
                                placeholder="Protocol"
                                value={formData.protocol}
                                onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
                                className="border px-3 py-2.5 rounded-lg w-full text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Manufacturer
                            </label>
                            <input
                                type="text"
                                placeholder="Manufacturer"
                                value={formData.manufacturer}
                                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                                className="border px-3 py-2.5 rounded-lg w-full text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                                Payment Service Provider
                            </label>
                            <input
                                type="text"
                                placeholder="Payment Service Provider"
                                value={formData.paymentServiceProvider}
                                onChange={(e) => setFormData({ ...formData, paymentServiceProvider: e.target.value })}
                                className="border px-3 py-2.5 rounded-lg w-full text-sm"
                            />
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="px-3 py-3 sm:p-6 border-t border-gray-200 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6">
                    <button
                        onClick={closeModal}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSaveTerminal}
                        disabled={loading}
                        className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-lg text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? (existingTerminal ? "Saving..." : "Adding...") : (existingTerminal ? "Save Changes" : "Add Terminal")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTerminalModal;