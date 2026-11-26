// LocationConfigTable.jsx
import React, { useState } from "react";

const LocationConfigTable = ({ locations = [], onEdit, onDelete }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const toggleRow = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const hasCustomPricing = (location) => {
        return (
            location.mainPriceOverride ||
            location.mealPriceOverride ||
            location.saladPriceOverride ||
            location.snackPriceOverride ||
            location.drinkPriceOverride
        );
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date)
            .toLocaleDateString("en-GB")
            .replace(/\//g, "-");
    };

    const isDatePassed = (date) => {
        if (!date) return false;

        const today = new Date();
        const auditDate = new Date(date);

        // Remove time part for accurate comparison
        today.setHours(0, 0, 0, 0);
        auditDate.setHours(0, 0, 0, 0);

        return auditDate < today;
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] lg:min-w-[900px]">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <tr>
                            <th className="px-2 py-2.5 sm:px-4 sm:py-3"></th>
                            <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Venue</th>
                            <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Friendly Name</th>
                            <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Type</th>
                            <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Terminal</th>
                            <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Insurance</th>
                            <th className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Pricing</th>
                            <th className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Fee</th>
                            <th className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-left text-[10px] sm:text-xs lg:text-sm font-semibold">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {locations.map((location) => (
                            <React.Fragment key={location.id}>
                                {/* Main Row */}
                                <tr className="border-b hover:bg-gray-50">
                                    <td className="px-2 py-2.5 sm:px-4 sm:py-3">
                                        <button
                                            onClick={() => toggleRow(location.id)}
                                            className="text-blue-600 text-sm font-semibold"
                                        >
                                            {expandedRow === location.id ? "−" : "+"}
                                        </button>
                                    </td>

                                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">{location.venueName || "N/A"}</td>
                                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm font-medium">{location.friendlyName}</td>
                                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">{location.machineType || "N/A"}</td>
                                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">{location.terminalId}</td>

                                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                        {location.insuranceActive ? "Active" : "Inactive"}
                                    </td>

                                    <td className="hidden lg:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                        {hasCustomPricing(location) ? "Custom" : "Default"}
                                    </td>

                                    <td className="hidden md:table-cell px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 text-[11px] sm:text-xs lg:text-sm">
                                        {location.feePM ? `€${location.feePM}` : "N/A"}
                                    </td>

                                    <td className="px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 lg:py-3 align-middle">
                                        <div className="flex justify-start lg:justify-center items-center gap-2 sm:gap-3 text-[11px] sm:text-sm h-full">
                                            <button
                                                onClick={() => onEdit(location)}
                                                className="text-blue-600 hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => onDelete(location)}
                                                className="text-red-600 hover:underline cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded Row */}
                                {expandedRow === location.id && (
                                    <tr className="bg-gray-100">
                                        <td colSpan={9} className="px-3 py-3 sm:px-6 sm:py-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">

                                                {/* BASIC */}
                                                <div>
                                                    <p><b>Machine ID:</b> {location.machineId}</p>
                                                    <p><b>Friendly Name:</b> {location.friendlyName}</p>
                                                    <p><b>Terminal Type:</b> {location.paymentTerminalType}</p>
                                                    <p><b>Machine Key:</b> {location.machineKey || "N/A"}</p>
                                                    <p><b>Elevator Roof:</b> {location.elevatorRoof || "N/A"}</p>
                                                </div>

                                                {/* AUDIT */}
                                                <div>
                                                    <p>
                                                        <b>Last Audit:</b> {formatDate(location.lastElectricalAudit)}
                                                    </p>
                                                    <p>
                                                        <b>Next Audit:</b>{" "}
                                                        <span
                                                            className={
                                                                isDatePassed(location.nextElectricalAudit)
                                                                    ? "text-red-600 font-semibold"
                                                                    : ""
                                                            }
                                                        >
                                                            {formatDate(location.nextElectricalAudit)}
                                                        </span>
                                                    </p>
                                                </div>

                                                {/* FINANCIAL */}
                                                <div>
                                                    <p><b>Min Revenue:</b> {location.minRevenuePD || "N/A"}</p>
                                                    <p><b>Fee PM:</b> {location.feePM || "N/A"}</p>
                                                    <p><b>Subsidy Variant:</b> {location.subsidyVariant}</p>
                                                    <p><b>Subsidy Limit:</b> {location.subsidyValueLimit}</p>
                                                </div>

                                                {/* PRICING */}
                                                <div className="sm:col-span-2 lg:col-span-3">
                                                    <p className="font-semibold mt-2">Price Overrides:</p>
                                                    <p>Main: {location.mainPriceOverride || "-"}</p>
                                                    <p>Meal: {location.mealPriceOverride || "-"}</p>
                                                    <p>Salad: {location.saladPriceOverride || "-"}</p>
                                                    <p>Snack: {location.snackPriceOverride || "-"}</p>
                                                    <p>Drink: {location.drinkPriceOverride || "-"}</p>
                                                </div>

                                                {/* NOTE */}
                                                <div className="sm:col-span-2 lg:col-span-3">
                                                    <p className="font-semibold mt-2">Note:</p>
                                                    <p>{location.note || "No notes available"}</p>
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LocationConfigTable;
