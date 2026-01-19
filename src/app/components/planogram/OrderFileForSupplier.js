import { api } from "@/app/lib/auth";
import { useEffect, useRef, useState } from "react";


export const OrderFileForSupplier = ({ supplierOrderFiles }) => {
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [allSuppliers, setAllSuppliers] = useState([]);
    const [error, setError] = useState()
    const [orderFilename, setOrderFilename] = useState("");
    const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
    const [supplierFetchProgress, setSupplierFetchProgress] = useState({
        current: 0,
        total: 0,
    });
    const [imageUrl, setImageUrl] = useState("");


    const isFetchingAllSuppliersRef = useRef(false);
    const supplierTimeoutRef = useRef(null);

    const getOrderFilenameBySupplierId = (supplierOrderFiles, supplierId) => {
        for (const item of supplierOrderFiles) {
            if (item[supplierId]) {
                return item[supplierId].orderFilename;
            }
        }
        return null;
    }


    const fetchAllSuppliersProgressively = async () => {

        if (isFetchingAllSuppliersRef.current) return;

        isFetchingAllSuppliersRef.current = true;
        setSupplierSearchLoading(true);

        try {
            let allFetchedSuppliers = [];
            let currentLastKey = null;
            let pageCount = 0;
            const maxPages = 50;

            setSupplierFetchProgress({ current: 0, total: maxPages });

            do {
                pageCount++;
                setSupplierFetchProgress({ current: pageCount, total: maxPages });

                const response = await api.getSuppliers({
                    limit: 20,
                    lastKey: currentLastKey,
                });

                if (!response.ok) break;

                const data = await response.json();
                const newSuppliers = data.suppliers || data.results || [];

                allFetchedSuppliers = [
                    ...allFetchedSuppliers,
                    ...newSuppliers,
                ];

                setAllSuppliers([...allFetchedSuppliers]);

                currentLastKey = data.lastKey || null;

                if (pageCount < maxPages && currentLastKey) {
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }
            } while (currentLastKey && pageCount < maxPages);

            console.log(
                `Successfully fetched ${allFetchedSuppliers.length} suppliers`
            );
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setSupplierSearchLoading(false);
            isFetchingAllSuppliersRef.current = false;
        }
    };

    
    useEffect(() => {

        if (supplierTimeoutRef.current) {
            clearTimeout(supplierTimeoutRef.current);
        }

        if (
            !isFetchingAllSuppliersRef.current &&
            allSuppliers.length === 0
        ) {
            supplierTimeoutRef.current = setTimeout(() => {
                fetchAllSuppliersProgressively();
            }, 500);
        }

        return () => {
            if (supplierTimeoutRef.current) {
                clearTimeout(supplierTimeoutRef.current);
            }
        };
    }, []);


    const downloadFile = () => {
        if (!imageUrl) return;

        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = orderFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setShowSuccess(true);
        setSelectedSupplier("")
        setTimeout(() => setShowSuccess(false), 1000);
    };

    const handleSupplierChange = async (e) => {
        const supplierId = e.target.value;
        setSelectedSupplier(supplierId);
        setError("");
        setImageUrl("");
        setOrderFilename("");

        const file = getOrderFilenameBySupplierId(
            supplierOrderFiles,
            supplierId
        );

        if (!file) {
            setError("No File Found For This Supplier");
            return;
        }

        setOrderFilename(file);

        try {
            const response = await api.getOrderSupplierFileName({
                filename: file,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();

            // 🔹 EXPECTED API RESPONSE
            // { imageUrl: "https://cdn.example.com/order-image.png" }

            setImageUrl(result.downloadUrl);
        } catch (err) {
            console.error("Image fetch failed:", err);
            setError("Failed to load order file");
        }
    };


    return (
        <div className="bg-white absolute border  border-gray-300 rounded-lg             top-[-10px] left-12  p-8  w-full max-w-md z-50 ">
            <h4 className="text-center text-gray-800 text-xl font-semibold mb-4">
                Order Files For Supplier
            </h4>

            <div className="mb-3">
                <select
                    value={selectedSupplier}
                    onChange={handleSupplierChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-gray-700 bg-white cursor-pointer transition-all duration-300 hover:border-blue-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-10 appearance-none"
                    style={{
                        backgroundImage: `url("datFa:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center'
                    }}
                >
                    <option value="">Suppliers Drop Down</option>
                    {allSuppliers.map(supplier => (
                        <option key={supplier?.supplierId} value={supplier?.supplierId}>
                            {supplier.name}
                        </option>
                    ))}
                </select>
            </div>

            <button
                onClick={downloadFile}
                disabled={!imageUrl}
                className={`w-full px-6 py-3 border-2 rounded-md font-medium transition-all duration-300
    ${imageUrl
                        ? "bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/20"
                        : "bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed"
                    }
  `}
            >
                Download File
            </button>

            {error && (
                <p className="text-red-600 text-sm mt-2 text-center">
                    {error}
                </p>
            )}

            {showSuccess && (
                <div className="mt-5 p-3 bg-green-100 border border-green-300 rounded-md text-green-900 text-center">
                    File download initiated successfully!
                </div>
            )}
        </div>
    )
}
