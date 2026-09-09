import { useRouter } from "next/navigation";
import { useMemo } from "react";

const PlanogramCardView = ({ planogram, machine, onBack }) => {
    // 🔥 Create product lookup map (fast)
    const productMap = useMemo(() => {
        if (!planogram?.products) return {};
        return Object.fromEntries(
            planogram.products.map((p) => [p.id, p])
        );
    }, [planogram]);

    // 🔥 Group by shelf
    const shelves = useMemo(() => {
        if (!planogram?.planogram) return {};

        const grouped = {};

        planogram.planogram.forEach((item) => {
            if (!grouped[item.shelf]) {
                grouped[item.shelf] = [];
            }
            grouped[item.shelf].push(item);
        });

        // Sort channels inside each shelf
        Object.values(grouped).forEach((arr) =>
            arr.sort((a, b) => a.channel - b.channel)
        );

        return grouped;
    }, [planogram]);

    // console.log("planogram", planogram)

    return (
        <div className="min-h-screen bg-gray-50 pt-4">
            {/* Back Button */}
            <button
                onClick={onBack}
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
                Back to Machines
            </button>

            {/* Grid */}
            <div className="space-y-6">
                {Object.entries(shelves)
                    .sort((a, b) => Number(b[0]) - Number(a[0])) // sort shelves high → low
                    .map(([shelfNumber, items]) => (
                        <div key={shelfNumber}>
                            {/* Dynamic Row */}
                            <div
                                className="grid gap-3"
                                style={{
                                    gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                                }}
                            >
                                {items.map((item) => {
                                    const product = productMap[item.productId];

                                    return (
                                        <div
                                            key={item.id}
                                            className="relative border border-gray-200 bg-white min-h-72 hover:border-blue-500 hover:shadow-lg transition-all duration-200 p-4 flex flex-col gap-3"
                                        >
                                            {/* Top Badge */}
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm font-bold border border-blue-400 rounded px-2 py-0.5 whitespace-nowrap text-blue-600">
                                                    {item.shelf} - {item.channel}
                                                </div>
                                            </div>

                                            {/* Warning (example condition) */}
                                            {!product && (
                                                <div className="absolute top-2 right-2 group cursor-pointer">
                                                    <svg
                                                        className="h-5 w-5 text-yellow-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2}
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                                                    </svg>

                                                    <div className="absolute right-0 mt-2 w-44 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 z-50">
                                                        Product not found
                                                    </div>
                                                </div>
                                            )}

                                            {/* Product */}
                                            <div className="flex flex-col justify-center h-full items-center gap-2">
                                                <img
                                                    src={product?.image?.file || "/placeholder.png"}
                                                    className="h-24 w-auto object-contain rounded"
                                                    alt={product?.name || "product"}
                                                />

                                                <div className="text-xs font-semibold text-gray-700 text-center">
                                                    {product?.name || "Unknown Product"}
                                                </div>
                                            </div>

                                            {/* Price (optional nice info) */}
                                            {product && (
                                                <div className="text-center text-sm font-medium text-gray-600">
                                                    € {product.price}
                                                </div>
                                            )}

                                            {/* Capacity Info */}
                                            <div className="flex flex-col justify-center items-center">
                                                <div className="relative inline-block group mt-2 bg-gray-500 text-white px-2 py-0.5 rounded-lg">
                                                    <span className="text-xs font-semibold cursor-pointer">
                                                        Capacity
                                                    </span>

                                                    <div className="absolute left-0 top-full hidden group-hover:block z-50">
                                                        <div className="w-36 bg-white border border-gray-300 shadow-lg rounded p-2 text-xs text-gray-700">
                                                            <div className="flex justify-between">
                                                                <span>Max</span>
                                                                <span className="font-semibold">
                                                                    {item.maximumChannelCapacity}
                                                                </span>
                                                            </div>

                                                            <div className="flex justify-between">
                                                                <span>Low Alert</span>
                                                                <span className="font-semibold">
                                                                    {item.lowStockLevelAlert}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default PlanogramCardView;
