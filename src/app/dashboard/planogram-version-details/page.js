"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthService, api } from "@/app/lib/auth"
import Loader from "@/app/components/Loader"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/app/contexts/ToastContext";
import ViewOrderStructure from "../../components/planogram/ViewOrdersStructure"
import OrderErrorPlanogramDetails from "../../components/planogram/OrderErrorPlanogramDetails"

const PlanogramDetails = () => {
    // Error State
    const [errorModal, setErrorModal] = useState(false)
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [machineErrors, setMachineErrors] = useState([]);
    const [loadingErrors, setLoadingErrors] = useState(false);
    // Local States
    const [lastSyncedAt, setLastSyncedAt] = useState()
    const [syncStatus, setSyncStatus] = useState()
    const [loading, setLoading] = useState()
    const [isRotating, setIsRotating] = useState()
    const [planogram, setPlanogram] = useState(null)
    const [isOpenOrder, setIsOpenOrder] = useState()
    const searchParams = useSearchParams()
    const { success: toastSuccess } = useToast()
    const router = useRouter()
    // Ref
    const hasShownCompletionToast = useRef(false);
    const pollingRef = useRef(null);
    const stopPollingRef = useRef(false);
    // Helper
    const params = searchParams.get("planogramVersionId")
    const pageSize = 10

    const fetchPlanogramVersions = async (useLastKey = null) => {
        setLoading(true)
        try {
            let apiUrl = `/api/planogram_versions?limit=${pageSize}`
            if (useLastKey) {
                apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
            }

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey: useLastKey,
                planogramVersionId: params
            })
            console.log("Client fetch response status:", response.status)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()
            console.log("Client received data:", data)

            // Handle different response structures
            const fetchedProducts = data?.planogramVersions[0] || data.results || []
            setSyncStatus(fetchedProducts?.sync_status)
            setLastSyncedAt(fetchedProducts?.lastSyncedAt)

            // console.log("fetchedProducts", fetchedProducts)

            const detailResponse = await api.planogramVersionDetails({
                versionDetailId: fetchedProducts?.versionDetailId, // assuming _id is the version ID
                limit: 10, // or any limit you want
            });

            if (!detailResponse.ok) {
                alert("Failed to fetch planogram details. Please try again.");
                return;
            }

            const detailData = await detailResponse.json();
            // console.log("detailData", detailData)

            // Sort → primePlanogram true first
            const sortedDetails = (detailData?.versionDetails || detailData || []).sort(
                (a, b) => Number(b.primePlanogram) - Number(a.primePlanogram)
            );

            setPlanogram({ ...fetchedProducts, versionDetails: sortedDetails })
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false)
        }
    };

    const fetchPlanogramVersionsAfterSync = async (useLastKey = null) => {
        try {
            let apiUrl = `/api/planogram_versions?limit=${pageSize}`
            if (useLastKey) {
                apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
            }

            const response = await api.getPlanogramVersions({
                limit: pageSize,
                lastKey: useLastKey,
                planogramVersionId: params
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || `HTTP ${response.status}`)
            }

            const data = await response.json()
            // Handle different response structures
            const fetchedProducts = data?.planogramVersions[0] || data.results || []
            // console.log("fetchedProducts", fetchedProducts)

            const detailResponse = await api.planogramVersionDetails({
                versionDetailId: fetchedProducts?.versionDetailId, // assuming _id is the version ID
                limit: 10, // or any limit you want
            });

            if (!detailResponse.ok) {
                alert("Failed to fetch planogram details. Please try again.");
                return;
            }

            const detailData = await detailResponse.json();
            // console.log("detailData", detailData)

            setPlanogram({ ...fetchedProducts, versionDetails: detailData?.versionDetails })
            return fetchedProducts;
        } catch (error) {
            console.error("Failed to load products", error);
        }
    };

    const navigate = (action, machineId) => {
        router.push(
            `/dashboard/planogram-structure?machineId=${machineId}&action=${action}&planogramVersionId=${params}`
        );
    }

    const handelSyncVendlive = async () => {
        try {
            setIsRotating(true);
            stopPollingRef.current = false;

            const res = await api.SyncwithVendlive(params);
            if (!res.ok) throw new Error("Sync failed");

            const result = await res.json();
            toastSuccess(result?.message);

            pollingRef.current = setInterval(async () => {
                // 🚨 STOP EXECUTION IMMEDIATELY
                if (stopPollingRef.current) return;

                try {
                    const data = await fetchPlanogramVersionsAfterSync();

                    // 🚨 CHECK AGAIN AFTER API CALL
                    if (stopPollingRef.current) return;

                    const syncStatus = data?.sync_status;
                    const syncedAt = data?.lastSyncedAt;

                    setSyncStatus(syncStatus);
                    setLastSyncedAt(syncedAt);

                    if (syncStatus === "COMPLETED" || syncStatus === "FAILD") {
                        stopPollingRef.current = true;

                        clearInterval(pollingRef.current);
                        pollingRef.current = null;

                        setIsRotating(false);

                        toastSuccess("Sync completed successfully ✅");
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000);

        } catch (error) {
            console.error("planogram sync error:", error);
            setIsRotating(false);
        }
    };

    const RefreshPage = () => {
        fetchPlanogramVersions()
    }

    const handelOrders = () => {
        setIsOpenOrder(true)
        router.push(
            `/dashboard/planogram-version-details?planogramVersionId=${planogram?.planogramVersionId}&orders`
        )
    }

    // Modal
    const openViewErrorModal = async (machine) => {
        // console.log("machine", machine)
        setSelectedMachine(machine);
        setErrorModal(true);
        setLoadingErrors(true);

        try {
            const response = await api.getOrderSnapshotErrors({
                limit: 10,
                planogramVersionId: machine?.planogramVersionId, // make sure available in scope
                machineId: machine?.machineId,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            setMachineErrors(data?.orderErrors || []); // adjust based on API response shape
        } catch (error) {
            console.error("Failed to fetch machine errors:", error);
            setMachineErrors([]);
        } finally {
            setLoadingErrors(false);
        }
    };

    useEffect(() => {
        // Get query params
        const planogramVersionId = searchParams.get("planogramVersionId");
        const orders = searchParams.get("orders");
        // Check if both exist
        if (planogramVersionId && orders !== null) {
            setIsOpenOrder(true);
        } else {
            setIsOpenOrder(false);
        }
    }, [searchParams]); // re-run if query params change


    useEffect(() => {
        fetchPlanogramVersions()
    }, [])

    const SYNC_STATUS_MAP = {
        IN_PROGRESS: {
            text: "Sync in progress...",
            color: "text-blue-500",
            rotating: true,
        },
        COMPLETED: {
            text: (lastSyncedAt) =>
                `Last synced at: ${new Date(lastSyncedAt).toLocaleString()}`,
            color: "text-green-600",
            rotating: false,
        },
        FAILED: {
            text: "Sync failed, please try again.",
            color: "text-red-600",
            rotating: false,
        },
    };

    // View Order Structure
    if (isOpenOrder) {
        return <ViewOrderStructure setIsOpenOrder={setIsOpenOrder} />
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-gray-100">
                <Loader />
            </div>
        )
    }

    return (
        <div className="p-8">
            {/* Back Button */}
            <button
                onClick={() => router.push("/dashboard/planogram-versions")}
                className="mb-6 flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Planogram Version
            </button>

            {/* Header */}
            <div className="mb-8">
                <h3 className="mb-2 text-2xl font-bold text-gray-800">
                    {planogram?.name}
                </h3>
                <p className="text-sm text-gray-500">
                    Planogram ID: {planogram?.planogramVersionId}
                </p>
            </div>

            {/* Overview Cards */}
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-2 text-sm text-gray-500">Planogram ID</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {planogram?.planogramVersionId}
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-2 text-sm text-gray-500">Total Machines</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {planogram?.machineCount}
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                    <div className="mb-2 text-sm text-gray-500">Prime Machine Id</div>
                    <span
                        className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-semibold ${planogram?.isPrime
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-500"
                            }`}
                    >
                        {planogram?.primeMachineId}
                    </span>
                </div>
            </div>

            {/* Machine Table */}
            <div className="mb-8">
                {/* Buttons-Cont */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className=" text-xl font-semibold text-gray-800">
                        Machines
                    </h3>
                    <div className="flex gap-2 items-center justify-center">
                        <button
                            onClick={RefreshPage}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                        <button
                            onClick={handelOrders}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                        >
                            View Orders
                        </button>
                        <button
                            onClick={() => handelSyncVendlive()}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRotating ? "animate-spin" : ""}`} />
                            Sync with Vendlive
                        </button>
                    </div>
                </div>

                {/* Sync Status */}
                <div className="text-end">
                    {syncStatus && (
                        <p className={`text-sm ${SYNC_STATUS_MAP[syncStatus]?.color}`}>
                            {typeof SYNC_STATUS_MAP[syncStatus]?.text === "function"
                                ? SYNC_STATUS_MAP[syncStatus].text(lastSyncedAt ? lastSyncedAt :
                                    "None")
                                : SYNC_STATUS_MAP[syncStatus]?.text}
                        </p>
                    )}
                </div>

                {/* Table-Cont */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Machine ID
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Machine Name
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Venue Name
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Prime Planogram
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Order Errors
                                </th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {planogram?.versionDetails?.map((machine, index) => (
                                <tr
                                    key={machine?.machineId}
                                    className={index !== 0 ? "border-t border-gray-200" : ""}
                                >
                                    {/* Machine ID */}
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-block rounded px-3 py-1 text-sm font-semibold ${machine?.error
                                                ? "bg-red-100 text-red-700 border border-red-400"
                                                : "text-gray-800"
                                                }`}
                                        >
                                            {machine?.machineId}
                                        </span>
                                    </td>

                                    {/* Machine Name */}
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium text-gray-800">
                                            {machine.friendlyName}
                                        </div>

                                        {machine?.error && (
                                            <div className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-600">
                                                {machine.error}
                                            </div>
                                        )}
                                    </td>

                                    {/* Venue Name */}
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-medium text-gray-800">
                                            {machine.venueName === "null" ? "_" : machine?.venueName}
                                        </div>
                                    </td>

                                    {/* Prime Planogram */}
                                    <td className="px-4 py-4">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${machine.isPrimePlanogram
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {machine.primePlanogram ? "Yes" : "No"}
                                        </span>
                                    </td>

                                    {/* Order Errors */}
                                    <td className="px-4 py-4">
                                        {(() => {
                                            const count = machine?.errorCount ?? 0;

                                            return (
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${count > 0
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {count}
                                                </span>
                                            );
                                        })()}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            {machine?.errorCount > 0 && <button
                                                onClick={() => openViewErrorModal(machine)}
                                                className="text-red-600 hover:underline"
                                            >
                                                View Error
                                            </button>}
                                            {machine.primePlanogram && <button
                                                onClick={() => navigate("finalize", machine.machineId)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Finalize
                                            </button>}

                                            {!machine.error && <button
                                                onClick={() => navigate("structure", machine.machineId)}
                                                className="text-green-600 hover:underline"
                                            >
                                                View Structure
                                            </button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {errorModal &&
                <OrderErrorPlanogramDetails closeModal={() => setErrorModal(false)} machine={selectedMachine} machineErrors={machineErrors} loadingErrors={loadingErrors} />
            }
        </div>
    );

}

export default function PlanogramVersionDetailsPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-screen w-full bg-gray-50">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
            }
        >
            <PlanogramDetails />
        </Suspense>
    )
}