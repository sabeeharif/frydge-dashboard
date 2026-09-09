import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/auth";

const DownloadButton = ({ inventoryId }) => {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (e) => {
        e.preventDefault();
        try {
            setDownloading(true);

            // API Call
            const res = await api.downloadInventoryFile(
                inventoryId
            );
            const data = await res.json();
            console.log("DOWNLOAD RESPONSE:", res);

            // Example response:
            // {
            //   downloadUrl: "https://abc.s3.amazonaws.com/file.xlsx"
            // }

            const downloadUrl =
                data?.downloadUrl || data?.downloadUrl;

            if (!downloadUrl) {
                alert("Download URL not found");
                return;
            }

            // Create temporary link
            const link = document.createElement("a");
            link.href = downloadUrl;
            // link.target = "_blank";

            // Optional
            link.setAttribute("download", "");

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download file");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center cursor-pointer gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
            {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}

            {downloading ? "Downloading..." : "Download"}
        </button>
    );
};

export default DownloadButton;