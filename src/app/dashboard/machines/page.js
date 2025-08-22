"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  MapPin,
  Building2,
  X,
  Calendar,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Loader2,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Package,
  QrCode,
  Power,
  RefreshCcw,
  Settings,
  Search,
} from "lucide-react";
import VenueCard from "@/app/components/VenueCard";
import QRCode from "qrcode";
import Loader from "@/app/components/Loader";
import { useToast } from "@/app/contexts/ToastContext";

export default function MachineTable() {
  const [machines, setMachines] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportingData, setReportingData] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);
  const modalRef = useRef(null);

  // Separate states for encrypted IDs and QR codes
  const [encryptedIds, setEncryptedIds] = useState({});
  const [loadingEncryptedIds, setLoadingEncryptedIds] = useState({});
  const [qrUrls, setQrUrls] = useState({});
  const [loadingQrCodes, setLoadingQrCodes] = useState({});
  const [isSync, setIsSync] = useState({});

  // QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState("");
  const [selectedMachineForQr, setSelectedMachineForQr] = useState(null);
  const qrModalRef = useRef(null);

  // Enable/Disable Modal state
  const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
  const [selectedMachineForToggle, setSelectedMachineForToggle] =
    useState(null);
  const [enabledState, setEnabledState] = useState(false);
  const [removeOrdersState, setRemoveOrdersState] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);
  const enableModalRef = useRef(null);

  const { success, error: toastError } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [allMachines, setAllMachines] = useState([]);
  const [isLoadingAllMachines, setIsLoadingAllMachines] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("");
  const [hasStartedProgressiveFetch, setHasStartedProgressiveFetch] =
    useState(false);

  const startProgressiveFetch = useCallback(async () => {
    if (isLoadingAllMachines || hasStartedProgressiveFetch) return;

    setHasStartedProgressiveFetch(true);
    setIsLoadingAllMachines(true);
    setLoadingProgress("Starting progressive fetch...");

    try {
      const allFetchedMachines = [];
      const totalPages = Math.ceil(totalCount / 20); // Use 20 per page for faster fetching

      for (let page = 1; page <= totalPages; page++) {
        setLoadingProgress(`Loading page ${page} of ${totalPages}...`);

        const response = await fetch(`/api/machines?page=${page}&pageSize=20`);
        if (!response.ok) break;

        const data = await response.json();
        allFetchedMachines.push(...(data.results || []));

        // Add delay to prevent overwhelming the API
        if (page < totalPages) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      setAllMachines(allFetchedMachines);
      setLoadingProgress(`Loaded ${allFetchedMachines.length} machines`);

      setTimeout(() => {
        setLoadingProgress("All machines ready for search");
      }, 1000);
    } catch (error) {
      console.error("Error in progressive fetch:", error);
      setLoadingProgress("Error loading machines");
    } finally {
      setIsLoadingAllMachines(false);
    }
  }, [totalCount, isLoadingAllMachines, hasStartedProgressiveFetch]);

  useEffect(() => {
    if (
      totalCount > 0 &&
      !hasStartedProgressiveFetch &&
      !isLoadingAllMachines
    ) {
      const timer = setTimeout(() => {
        startProgressiveFetch();
      }, 500); // 500ms debounce

      return () => clearTimeout(timer);
    }
  }, [
    totalCount,
    startProgressiveFetch,
    hasStartedProgressiveFetch,
    isLoadingAllMachines,
  ]);

  const getDisplayedMachines = () => {
    if (!searchTerm) return machines;

    // Search through all machines if available
    if (allMachines.length === totalCount && totalCount > 0) {
      return allMachines.filter(
        (machine) =>
          machine.id
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          machine.friendlyName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          machine.venue?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          machine.location?.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          machine.maxItemsPerDevice?.[0]?.deviceId
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          machine.maxItemsPerDevice?.[0]?.deviceName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Fallback to current page search
    return machines.filter(
      (machine) =>
        machine.id
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        machine.friendlyName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        machine.venue?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.location?.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        machine.maxItemsPerDevice?.[0]?.deviceId
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        machine.maxItemsPerDevice?.[0]?.deviceName
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  };

  const displayedMachines = getDisplayedMachines();

  // Get encrypted ID only
  const getEncryptedMachineId = async (machineId) => {
    if (!machineId) return;
    setLoadingEncryptedIds((prev) => ({ ...prev, [machineId]: true }));

    try {
      const res = await fetch(
        `/api/get-encrypted-machine-id?machineId=${machineId}`
      );
      const data = await res.json();
      if (data.encryptedMachineId) {
        console.log("Encrypted ID:", data.encryptedMachineId);
        setEncryptedIds((prev) => ({
          ...prev,
          [machineId]: data.encryptedMachineId,
        }));
      } else {
        console.error("No encryptedMachineId in response:", data);
      }
    } catch (error) {
      console.error("Error fetching encryptedMachineId:", error);
    } finally {
      setLoadingEncryptedIds((prev) => ({ ...prev, [machineId]: false }));
    }
  };

  // Get QR code separately
  const getQrCode = async (machineId) => {
    if (!machineId) return;
    setLoadingQrCodes((prev) => ({ ...prev, [machineId]: true }));

    try {
      const res = await fetch(
        `/api/get-encrypted-machine-id?machineId=${machineId}`
      );
      const data = await res.json();
      if (data.qrUrl) {
        console.log("QR URL:", data.qrUrl);
        setQrUrls((prev) => ({
          ...prev,
          [machineId]: data.qrUrl,
        }));
      } else {
        console.error("No qrUrl in response:", data);
      }
    } catch (error) {
      console.error("Error fetching QR URL:", error);
    } finally {
      setLoadingQrCodes((prev) => ({ ...prev, [machineId]: false }));
    }
  };

  // View QR code in modal
  const handleViewQr = async (machine) => {
    const qrUrl = qrUrls[machine.id];
    if (!qrUrl) return;

    try {
      // Generate QR code from the URL using qrcode library
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setSelectedQrCode(qrCodeDataUrl);
      setSelectedMachineForQr(machine);
      setIsQrModalOpen(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const closeQrModal = () => {
    setIsQrModalOpen(false);
    setSelectedQrCode("");
    setSelectedMachineForQr(null);
  };

  // Handle machine enable/disable modal
  const handleToggleMachine = (machine) => {
    setSelectedMachineForToggle(machine);
    setEnabledState(machine.enabled || false);
    setRemoveOrdersState(false); // Default to false
    setIsEnableModalOpen(true);
  };

  const closeEnableModal = () => {
    setIsEnableModalOpen(false);
    setSelectedMachineForToggle(null);
    setEnabledState(false);
    setRemoveOrdersState(false);
  };

  const handleSubmitToggle = async () => {
    if (!selectedMachineForToggle) return;

    setLoadingToggle(true);
    try {
      const res = await fetch("/api/enable-machine", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          machineId: selectedMachineForToggle.id,
          enabled: enabledState,
          removeOrders: removeOrdersState,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        success(
          `Machine ${enabledState ? "enabled" : "disabled"} successfully`
        );
        closeEnableModal();
        // Refresh the machines data
        fetchMachines(currentPage);
      } else {
        error(result.error || "Failed to update machine state");
      }
    } catch (error) {
      console.error("Toggle Error:", error);
      error("Something went wrong while updating the machine.");
    } finally {
      setLoadingToggle(false);
    }
  };

  // Handle machine sync
  const handleSyncMachine = async (machineId) => {
    try {
      setIsSync((prev) => ({ ...prev, [machineId]: true }));

      const res = await fetch("/api/sync-machine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ machineId }),
      });

      const result = await res.json();
      if (res.ok) {
        setIsSync((prev) => ({ ...prev, [machineId]: false }));
        success("Machine channels synced successfully.");
        // Optionally refresh the machine state
      } else {
        error(result.error || "Failed to sync machine.");
      }
    } catch (error) {
      console.error("Sync Error:", error);
      error("Something went wrong while syncing.");
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (isQrModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isQrModalOpen]);

  useEffect(() => {
    if (isEnableModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isEnableModalOpen]);

  // Close modal on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    }
    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  // Close QR modal on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (qrModalRef.current && !qrModalRef.current.contains(event.target)) {
        closeQrModal();
      }
    }
    if (isQrModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isQrModalOpen]);

  // Close enable modal on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        enableModalRef.current &&
        !enableModalRef.current.contains(event.target)
      ) {
        closeEnableModal();
      }
    }
    if (isEnableModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEnableModalOpen]);

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get("page")) || 1;
    setCurrentPage(pageFromUrl);
    fetchMachines(pageFromUrl);
  }, [searchParams]);

  const fetchMachines = async (page) => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching machines for page:", page);
      const response = await fetch(
        `/api/machines?page=${page}&pageSize=${pageSize}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Client fetch response status:", response.status);
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      console.log("Client received data:", {
        count: data.count,
        resultsLength: data.results?.length,
      });
      setMachines(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching machines:", err);
      setError(`Failed to load machines: ${err.message}`);
      setMachines([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleRowClick = async (machine) => {
    setSelectedMachine(machine);
    setIsModalOpen(true);
    setFromDate("");
    setToDate("");
    setReportingData(null);
    setVenueData(null);
    setReportError("");
    // Fetch venue data immediately when modal opens
    try {
      const venueResponse = await fetch(
        `/api/machine-venue?machineId=${machine.id}`
      );
      if (venueResponse.ok) {
        const venue = await venueResponse.json();
        setVenueData(venue);
      }
    } catch (error) {
      console.error("Error fetching venue data:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMachine(null);
    setReportingData(null);
    setVenueData(null);
    setReportError("");
  };

  const handleDateRangeSubmit = async () => {
    if (!fromDate || !toDate) {
      setReportError("Please select both from and to dates");
      return;
    }
    if (!selectedMachine) {
      setReportError("No machine selected");
      return;
    }
    setLoadingReport(true);
    setReportError("");
    try {
      // Format dates for the API (add time components)
      const startDateTime = `${fromDate}T00:00:00`;
      const endDateTime = `${toDate}T23:59:59`;
      console.log("Fetching sales data for machine:", selectedMachine.id);
      const response = await fetch(
        `/api/machine-sales?machineId=${selectedMachine.id}&startDate=${startDateTime}&endDate=${endDateTime}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch sales data");
      }
      const salesData = await response.json();
      setReportingData(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      setReportError(`Failed to fetch sales data: ${error.message}`);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      updateUrlParams(newPage);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      updateUrlParams(newPage);
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    updateUrlParams(page);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Error Loading Machines
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchMachines(currentPage)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Monitor className="h-10 w-10 text-blue-600" />
          <p className="text-gray-800">Machines</p>
        </h1>
      </div>

      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white  rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder="Search machines by ID, name, venue, location, or device..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900 "
          />
        </div>
      </div>
       {searchTerm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {displayedMachines.length} machine{displayedMachines.length !== 1 ? "s" : ""} matching "{searchTerm}"
            {allMachines.length > 0
              ? ` (searching through ${allMachines.length} total machines)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Encrypted Machine ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Friendly Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Venue
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Device ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Device Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-2">Action</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedMachines.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">
                      {searchTerm.trim()
                        ? "No machines found matching your search"
                        : "No machines found"}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedMachines.map((machine, index) => (
                  <tr
                    key={machine.id}
                    // onClick={() => handleRowClick(machine)} do not enable row click and uncomment this line also do not remove the onClick handler
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors duration-200 cursor-pointer`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {index + 1 + (currentPage - 1) * pageSize}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {machine.id}
                        </span>
                      </div>
                    </td>

                    {/* Encrypted ID Column */}
                    <td className="px-6 py-4">
                      {encryptedIds[machine.id] ? (
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold hover:bg-green-200">
                          {encryptedIds[machine.id]}
                        </span>
                      ) : (
                        <button
                          className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium hover:bg-red-200"
                          type="button"
                          disabled={loadingEncryptedIds[machine.id]}
                          onClick={() => getEncryptedMachineId(machine.id)}
                        >
                          {loadingEncryptedIds[machine.id]
                            ? "Loading..."
                            : "GET"}
                        </button>
                      )}
                    </td>

                    {/* QR Code Column */}
                    <td className="px-6 py-4">
                      {qrUrls[machine.id] ? (
                        <button
                          className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium hover:bg-blue-200 flex items-center gap-1"
                          type="button"
                          onClick={() => handleViewQr(machine)}
                        >
                          View
                        </button>
                      ) : (
                        <button
                          className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium hover:bg-orange-200"
                          type="button"
                          disabled={loadingQrCodes[machine.id]}
                          onClick={() => getQrCode(machine.id)}
                        >
                          {loadingQrCodes[machine.id] ? "Loading..." : "GET"}
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {machine.friendlyName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          machine.venue
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {machine.venue?.name || "Not Set"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          machine.location
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {machine.location?.description || "Not Set"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {machine.maxItemsPerDevice?.[0]?.deviceId || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {machine.maxItemsPerDevice?.[0]?.deviceName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {/* Enable/Disable Button */}
                        <button
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200`}
                          onClick={() => handleToggleMachine(machine)}
                        >
                          <>
                            <Power className="h-3 w-3" />
                            Enable/Disable
                          </>
                        </button>
                        {/* Sync Button */}
                        <button
                          className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium hover:bg-yellow-200 flex items-center gap-1"
                          onClick={() => handleSyncMachine(machine.id)}
                          disabled={isSync[machine.id]}
                        >
                          <RefreshCcw className="h-3 w-3" />
                          {isSync[machine.id] ? "Syncing..." : "Sync"}
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between bg-white rounded-lg shadow-lg px-6 py-4">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount}{" "}
              results
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>
            <div className="flex space-x-1">
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Enable/Disable Modal */}
      {isEnableModalOpen && selectedMachineForToggle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            ref={enableModalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative"
          >
            <button
              onClick={closeEnableModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Machine Settings
                </h2>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Machine:{" "}
                  {selectedMachineForToggle.friendlyName ||
                    selectedMachineForToggle.id}
                </p>
                <p className="text-xs text-gray-500">
                  ID: {selectedMachineForToggle.id}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Enabled Checkbox */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <label
                      htmlFor="enabled"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Enable Machine
                    </label>
                    <p className="text-xs text-gray-500 ml-2">
                      {enabledState
                        ? "Machine will be active"
                        : "Machine will be inactive"}
                    </p>
                  </div>
                  <input
                    id="enabled"
                    type="checkbox"
                    checked={enabledState}
                    onChange={(e) => setEnabledState(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                {/* Remove Orders Checkbox */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <label
                      htmlFor="removeOrders"
                      className="text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Remove Orders
                    </label>
                    <p className="text-xs text-gray-500 ml-2">
                      {removeOrdersState
                        ? "Existing orders will be removed"
                        : "Keep existing orders"}
                    </p>
                  </div>
                  <input
                    id="removeOrders"
                    type="checkbox"
                    checked={removeOrdersState}
                    onChange={(e) => setRemoveOrdersState(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeEnableModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitToggle}
                  disabled={loadingToggle}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loadingToggle && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {loadingToggle ? "Updating..." : "Update Machine"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {isQrModalOpen && selectedQrCode && selectedMachineForQr && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div
            ref={qrModalRef}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative"
          >
            <button
              onClick={closeQrModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <QrCode className="h-8 w-8 text-blue-600 mr-2" />
                <p className="text-2xl font-bold text-gray-800">QR Code</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Machine:{" "}
                  {selectedMachineForQr.friendlyName || selectedMachineForQr.id}
                </p>
                {encryptedIds[selectedMachineForQr.id] && (
                  <p className="text-xs text-gray-500">
                    Encrypted ID: {encryptedIds[selectedMachineForQr.id]}
                  </p>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                <img
                  src={selectedQrCode || "/placeholder.svg"}
                  alt="QR Code"
                  className="w-full h-auto max-w-xs mx-auto"
                />
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <p>Scan this QR code with your mobile device</p>
                <p className="mt-1 break-all">
                  {qrUrls[selectedMachineForQr.id]}
                </p>
              </div>

              <button
                onClick={closeQrModal}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal (existing reporting modal) */}
      {isModalOpen && selectedMachine && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-3xl flex items-center justify-center z-40 px-4"
          ref={modalRef}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
            {/* Left Panel - Machine Details (30%) */}
            <div className="w-[30%] bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "black" }}>
                  Machine Details
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Basic Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">ID:</span>{" "}
                      {selectedMachine.id}
                    </div>
                    <div>
                      <span className="font-medium"> Name:</span>{" "}
                      {selectedMachine.friendlyName}
                    </div>
                    <div>
                      <span className="font-medium">Account:</span>{" "}
                      {selectedMachine.account?.name}
                    </div>
                  </div>
                </div>
                <VenueCard venueData={venueData} />
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Location Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Venue:</span>{" "}
                      {selectedMachine.venue?.name || "Not Set"}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span>{" "}
                      {selectedMachine.location?.description || "Not Set"}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Device Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Device ID:</span>{" "}
                      {selectedMachine.maxItemsPerDevice?.[0]?.deviceId ||
                        "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Device Name:</span>{" "}
                      {selectedMachine.maxItemsPerDevice?.[0]?.deviceName ||
                        "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Max Items:</span>{" "}
                      {selectedMachine.maxItemsPerDevice?.[0]?.maxItems ||
                        "Unlimited"}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-2">Settings</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Order Expiry:</span>{" "}
                      {selectedMachine.reservedOrderExpiryHs} hours
                    </div>
                    <div>
                      <span className="font-medium">Currency:</span>{" "}
                      {selectedMachine.currency?.symbol} (
                      {selectedMachine.currency?.isoCode})
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Right Panel - Date Selection & Reporting (70%) */}
            <div className="w-[70%] p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center justify-start gap-2 ">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <p className="text-black text-2xl">
                    Real-time Reporting Dashboard
                  </p>
                </div>
                <div className="flex gap-2 items-center justify-center">
                  <p>Live Reports</p>{" "}
                  <div className="bg-green-500 rounded-full h-3 w-3 animate-pulse"></div>{" "}
                </div>
              </div>
              {/* Date Range Selection */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date Range
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleDateRangeSubmit}
                    disabled={loadingReport}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-center text-white rounded-lg hover:bg-gradient-to-r hover:from-blue-900/50 hover:to-purple-900/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingReport && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Generate Live Report
                  </button>
                </div>
                {reportError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{reportError}</p>
                  </div>
                )}
              </div>
              {/* Loading State */}
              {loadingReport && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-lg text-gray-600">Loading sales data...</p>
                </div>
              )}
              {/* Reporting Cards */}
              {reportingData && !loadingReport && (
                <div className="space-y-6">
                  {/* Main Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Sales</p>
                          <p className="text-2xl font-bold">
                            €{reportingData.totalSales}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-blue-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Total Orders</p>
                          <p className="text-2xl font-bold">
                            {reportingData.totalOrders}
                          </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-green-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Avg Order Value</p>
                          <p className="text-2xl font-bold">
                            €{reportingData.averageOrderValue}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-200" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100">Success Rate</p>
                          <p className="text-2xl font-bold">
                            {reportingData.totalOrders > 0
                              ? Math.round(
                                  (reportingData.successfulOrders /
                                    reportingData.totalOrders) *
                                    100
                                )
                              : 0}
                            %
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-orange-200" />
                      </div>
                    </div>
                  </div>
                  {/* Additional Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Successful Orders</p>
                          <p className="text-xl font-bold text-green-600">
                            {reportingData.successfulOrders}
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Failed Orders</p>
                          <p className="text-xl font-bold text-red-600">
                            {reportingData.failedOrders}
                          </p>
                        </div>
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total Discount</p>
                          <p className="text-xl font-bold text-blue-600">
                            €{reportingData.totalDiscount}
                          </p>
                        </div>
                        <Package className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </div>
                  {/* Top Products */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">
                      Top Products
                    </h4>
                    {reportingData.topProducts.length > 0 ? (
                      <div className="space-y-3">
                        {reportingData.topProducts.map((product, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <span className="font-medium">
                                {product.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {product.count} sold
                              </div>
                              <div className="text-xs text-gray-500">
                                €{product.revenue.toFixed(2)} revenue
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        No product sales data available
                      </p>
                    )}
                  </div>
                  {/* Raw Data Summary */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">
                      Data Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total VAT:</span>
                        <div className="font-medium">
                          €{reportingData.totalVat}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Raw Records:</span>
                        <div className="font-medium">
                          {reportingData.rawData.length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Unique Products:</span>
                        <div className="font-medium">
                          {Object.keys(reportingData.productSales).length}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Date Range:</span>
                        <div className="font-medium">
                          {Object.keys(reportingData.ordersByDate).length} days
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!reportingData && !loadingReport && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">
                    Select a date range to view real-time reporting data
                  </p>
                  <p className="text-sm mt-2">
                    Data will be fetched directly from your sales API
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
