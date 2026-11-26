"use client";
import { X, Loader2, Eye, Check, Calendar, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthService } from "@/app/lib/auth";

const PlanogramDetailsModal = ({ closeModal, machine, onViewPlanogram }) => {
    // State
    const [loading, setLoading] = useState(false);
    const [planograms, setPlanograms] = useState([]);
    // Apply Planogram States
    const [applyError, setApplyError] = useState(null);
    const [applyModal, setApplyModal] = useState({
        open: false,
        message: "",
        type: "success", // "success" | "error"
    });
    const [updateDateModal, setUpdateDateModal] = useState({
        open: false,
        planogram: null,
        selectedDate: "",
    });
    const [deleteModal, setDeleteModal] = useState({
        open: false,
        planogram: null,
    });

    const fetchPlanograms = async () => {
        // If machine id is not available, do not call API
        if (!machine?.id) return;
        
        const deviceId = machine?.maxItemsPerDevice?.[0]?.deviceId;

        // API token stored in environment variable
        const authToken = AuthService.getAuthToken();

        try {
            // Start loading state before API call
            setLoading(true);

            // Fetch planned planograms from VendLive API
            const url = `https://vendlive.com/api/2.0/devices/${deviceId}/planned-planograms?page=1&pageSize=10`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`,
                'accept': 'application/json',
                },
            });

            // Convert response to JSON
            const data = await response.json();

            // Store results in state (fallback to empty array if undefined)
            setPlanograms(data?.results || []);
        } catch (err) {
            // Log error if API fails
            console.error("Planogram fetch error", err);
        } finally {
            // Stop loading state after request completes
            setLoading(false);
        }
    };

    const onApplyPlanogram = async (planogram) => {
        const deviceId = machine?.maxItemsPerDevice?.[0]?.deviceId;
        if (!deviceId || !planogram?.id) return;

        console.log("device->id", deviceId, "planogram->id", planogram?.id)

        const authToken = AuthService.getAuthToken();

        try {
            setLoading(true);

            const response = await fetch(
                `https://vendlive.com/api/2.0/devices/${deviceId}/planned-planograms/${planogram.id}/apply/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log("response: ", response)
            if (!response.ok) {
                // Store API error message in state
                setApplyError((prev) => ({
                    ...prev,
                    [planogram.id]: data?.error?.message || "Something went wrong",
                }));
                return;
            }

            // Success
            setApplyModal({
                open: true,
                message: "Planogram applied successfully",
                type: "success",
            });

            // Optional: refresh list after applying
            // fetchPlanograms();

        } catch (error) {
            setApplyModal({
                open: true,
                message: "Network error. Please try again.",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDate = async () => {
        const { planogram, selectedDate } = updateDateModal;
        const deviceId = machine?.maxItemsPerDevice?.[0]?.deviceId;
        if (!deviceId || !planogram?.id || !selectedDate) return;

        const authToken = AuthService.getAuthToken();

        try {
            setLoading(true);

            const response = await fetch(
                `https://vendlive.com/api/2.0/devices/${deviceId}/planned-planograms/${planogram.id}/`,
                {
                    method: "PUT", // change if API requires PUT
                    headers: {
                        "Authorization": `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        planogram: planogram?.planogram || [], // existing channels data
                        applyAt: selectedDate,                 // updated date
                        applied: false, // applied should be false when we edit date
                        isPublished: planogram?.isPublished,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.error?.message || "Failed to update date");
            }

            // Success
            fetchPlanograms();
            setUpdateDateModal({ open: false, planogram: null, selectedDate: "" });

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeletePlanogram = async () => {
        const planogram = deleteModal.planogram;
        const deviceId = machine?.maxItemsPerDevice?.[0]?.deviceId;
        if (!deviceId || !planogram?.id) return;

        const authToken = AuthService.getAuthToken();

        try {
            setLoading(true);

            const response = await fetch(
                `https://vendlive.com/api/2.0/devices/${deviceId}/planned-planograms/${planogram.id}/`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 204) {
                setDeleteModal({ open: false, planogram: null });

                setApplyModal({
                    open: true,
                    message: "Planogram deleted successfully",
                    type: "success",
                });

                fetchPlanograms();
                return;
            }

            const data = await response.json();
            throw new Error(data?.error?.message || "Failed to delete");

        } catch (error) {
            setDeleteModal({ open: false, planogram: null });

            setApplyModal({
                open: true,
                message: error.message,
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanograms();
    }, [machine]);

    // console.log("machine", machine)
    // console.log("updateDateModal", updateDateModal)

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex justify-center pt-2 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>
                {/* Header */}
                <div className="px-3 py-3 sm:p-6 border-b border-gray-200 flex justify-between gap-3 shrink-0">
                    <h3 className="text-base sm:text-xl font-bold truncate">
                        Planogram Details — {machine?.friendlyName || machine?.id}
                    </h3>

                    <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0">
                        <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0">
                {/* Machine Info Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg m-3 sm:m-4 p-3 sm:p-4 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Machine ID</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {machine?.id || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase">Friendly Name</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {machine?.friendlyName || "N/A"}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-gray-500 uppercase">Venue Name</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {machine?.venue?.name || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Table-Cont */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden m-4">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                                        Apply At
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                                        Applied
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                                        Published
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6">
                                            <Loader2 className="animate-spin mx-auto h-6 w-6 text-gray-500" />
                                            <p className="mt-2 text-gray-500">
                                                Loading planograms...
                                            </p>
                                        </td>
                                    </tr>
                                ) : planograms.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-6 text-gray-500">
                                            No planograms found
                                        </td>
                                    </tr>
                                ) : (
                                    planograms.slice(0, 10).map((planogram) => (
                                        <tr key={planogram.id} className="border-t border-gray-300">
                                            {/* Apply At */}
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {planogram.applyAt}
                                            </td>

                                            {/* Applied Time Only */}
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {new Date(planogram.applied).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>

                                            {/* Published */}
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {planogram.isPublished ? "Yes" : "No"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {/* View */}
                                                    <button
                                                        className="px-2 py-1 rounded-full bg-blue-100 text-sm text-blue-800 font-medium hover:bg-blue-200 flex items-center gap-1 transition"
                                                        onClick={() => onViewPlanogram(planogram)}
                                                    >
                                                        <Eye className="h-3 w-3" />
                                                        View
                                                    </button>

                                                    {/* Apply */}
                                                    <button
                                                        className="px-2 py-1 rounded-full bg-green-100 text-sm text-green-800 font-medium hover:bg-green-200 flex items-center gap-1 transition"
                                                        onClick={() => onApplyPlanogram(planogram)}
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        Apply
                                                    </button>

                                                    {/* Update Date */}
                                                    <button
                                                        className="px-2 py-1 rounded-full bg-yellow-100 text-sm text-yellow-800 font-medium hover:bg-yellow-200 flex items-center gap-1 transition"
                                                        onClick={() =>
                                                            setUpdateDateModal({
                                                                open: true,
                                                                planogram,
                                                                selectedDate: planogram?.applyAt
                                                                    ? planogram.applyAt.split("T")[0] // ensures YYYY-MM-DD
                                                                    : "",
                                                            })
                                                        }
                                                    >
                                                        <Calendar className="h-3 w-3" />
                                                        Update Date
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        className="px-2 py-1 rounded-full bg-red-100 text-sm text-red-800 font-medium hover:bg-red-200 flex items-center gap-1 transition"
                                                        onClick={() =>
                                                            setDeleteModal({
                                                                open: true,
                                                                planogram,
                                                            })
                                                        }
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </div>
            </div>

            {/* Modal */}
            {applyModal.open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
                    <div className="bg-white w-full sm:w-[350px] rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                        <div className="flex justify-center sm:hidden pb-2">
                            <div className="w-10 h-1 rounded-full bg-slate-300" />
                        </div>

                        <h2 className={`text-base sm:text-lg font-semibold mb-3 ${applyModal.type === "success"
                            ? "text-green-600"
                            : "text-red-600"
                            }`}>
                            {applyModal.type === "success" ? "Success" : "Error"}
                        </h2>

                        <p className="text-sm text-gray-700 mb-5 sm:mb-6">
                            {applyModal.message}
                        </p>

                        <div className="flex justify-end">
                            <button
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition"
                                onClick={() => setApplyModal({ ...applyModal, open: false })}
                            >
                                OK
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {updateDateModal.open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                        <div className="flex justify-center sm:hidden pb-2">
                            <div className="w-10 h-1 rounded-full bg-slate-300" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-800">
                            Update Planogram Date
                        </h2>

                        <input
                            type="date"
                            className="w-full border rounded-lg px-3 py-2.5 sm:py-2 mb-5 sm:mb-6 text-sm"
                            value={updateDateModal.selectedDate}
                            onChange={(e) =>
                                setUpdateDateModal((prev) => ({
                                    ...prev,
                                    selectedDate: e.target.value,
                                }))
                            }
                        />

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                            <button
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                                onClick={() =>
                                    setUpdateDateModal({ open: false, planogram: null, selectedDate: "" })
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                onClick={handleUpdateDate}
                                disabled={!updateDateModal.selectedDate}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.open && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
                    <div className="bg-white w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl shadow-xl p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
                        <div className="flex justify-center sm:hidden pb-2">
                            <div className="w-10 h-1 rounded-full bg-slate-300" />
                        </div>

                        <h2 className="text-base sm:text-lg font-semibold mb-3 text-red-600">
                            Confirm Delete
                        </h2>

                        <p className="text-sm text-gray-700 mb-5 sm:mb-6">
                            Are you sure you want to delete this planogram?
                            This action cannot be undone.
                        </p>

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                            <button
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                                onClick={() =>
                                    setDeleteModal({ open: false, planogram: null })
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                onClick={confirmDeletePlanogram}
                            >
                                Delete
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanogramDetailsModal;
