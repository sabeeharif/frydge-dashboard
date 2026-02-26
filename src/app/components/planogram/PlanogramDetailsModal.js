"use client";
import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const PlanogramDetailsModal = ({
    closeModal,
    machine,
    onViewPlanogram
}) => {
    // State
    const [loading, setLoading] = useState(false);
    const [planograms, setPlanograms] = useState([]);

    const fetchPlanograms = async () => {
        // If machine id is not available, do not call API
        if (!machine?.id) return;

        // API token stored in environment variable
        const token = process.env.NEXT_PUBLIC_VENDLIVE_API_TOKEN;

        try {
            // Start loading state before API call
            setLoading(true);

            // Fetch planned planograms from VendLive API
            const response = await fetch(
                `https://vendlive.com/api/2.0/devices/1707/planned-planograms?page=1&pageSize=10`,
                {
                    headers: {
                        Authorization: token, // Auth token for API access
                        "Content-Type": "application/json",
                    },
                    cache: "no-store", // Prevent caching to always get fresh data
                }
            );

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

    useEffect(() => {
        fetchPlanograms();
    }, [machine]);

    // console.log("machine", machine)

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between">
                    <h3 className="text-xl font-bold">
                        Planogram Details — {machine?.friendlyName || machine?.id}
                    </h3>

                    <button onClick={closeModal}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Machine Info Header */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                            <p className="mt-2 text-gray-500">Loading planograms...</p>
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
                                                {new Date(planogram.applied).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>

                                            {/* Published */}
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {planogram.isPublished ? "Yes" : "No"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    onClick={() => onViewPlanogram(planogram)}
                                                >
                                                    View Planogram
                                                </button>
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
    );
};

export default PlanogramDetailsModal;

