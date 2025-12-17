"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthService, api } from "@/app/lib/auth"
import Loader from "@/app/components/Loader"


export default function PlanogramDetails() {
    const [loading, setLoading] = useState()
    const searchParams = useSearchParams()
    const params = searchParams.get("planogramVersionId")
    const router = useRouter()
    const [planogram, setPlanogram] = useState(null)
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
            setPlanogram(fetchedProducts)
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {

        fetchPlanogramVersions()
    }, [])


    // if (!planogram) {
    //     return (
    //         <div style={{ padding: "2rem", textAlign: "center" }}>
    //             <p style={{ fontSize: "1.125rem", color: "#6b7280" }}>Planogram not found</p>
    //         </div>
    //     )
    // }
    const navigate = (machineId) => {
        router.push(
            `/dashboard/planogram-structure?machineId=${machineId}`
        );
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
                        {planogram?.versionDetails?.length}
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
                <h3 className="mb-4 text-xl font-semibold text-gray-800">
                    Machines
                </h3>

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
                                    Prime Planogram
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

                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            {!machine.error && <button
                                                onClick={() => navigate(machine.machineId)}
                                                className="text-green-600 hover:underline"
                                            >
                                                View Structure
                                            </button>}
                                            {/* <button
                      onClick={() => handleEdit(machine)}
                      className="rounded-md bg-yellow-100 p-2 text-yellow-800 hover:bg-yellow-200"
                      title="Edit"
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
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button> */}

                                            {/* <button
                      onClick={() => handleDelete(machine)}
                      className="rounded-md bg-red-100 p-2 text-red-800 hover:bg-red-200"
                      title="Delete"
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button> */}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

}

