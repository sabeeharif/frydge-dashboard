// LocationConfigTable.jsx
import React from "react";

const LocationConfigTable = ({ locations = [], onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Venue Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Machine SN</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Machine ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Friendly No</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Terminal ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Subsidy Variant</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Subsidy Limit</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold uppercase">Actions</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {locations?.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                    <p className="text-lg">No Location Config Found</p>
                                </td>
                            </tr>
                        ) : (
                            locations.map((location, index) => (
                                <tr
                                    key={location.id}
                                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } hover:bg-blue-50 transition-colors duration-200`}
                                >
                                    {/* Venue */}
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        {location.venueName || "N/A"}
                                    </td>

                                    {/* Machine SN */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.machineSn || "N/A"}
                                    </td>

                                    {/* Machine ID */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.machineId || "N/A"}
                                    </td>

                                    {/* Friendly Number */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.friendlyNumber || "N/A"}
                                    </td>

                                    {/* Terminal ID */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.terminalId || "N/A"}
                                    </td>

                                    {/* Subsidy Variant */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.subsidyVariant}
                                    </td>

                                    {/* Subsidy Limit */}
                                    <td className="px-6 py-4 text-gray-700">
                                        {location.subsidyValueLimit || "0.00"}
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4">
                                        <div className="flex gap-4 text-sm">
                                            <button
                                                onClick={() => onEdit(location)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => onDelete(location)}
                                                className="text-red-600 hover:underline"
                                            >
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
    );
};

export default LocationConfigTable;