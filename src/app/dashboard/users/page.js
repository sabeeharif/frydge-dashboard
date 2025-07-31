"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import VenueCard from "@/app/components/VenueCard";

export default function UserTable() {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reportingData, setReportingData] = useState(null);
  const [venueData, setVenueData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [search, setSearch] = useState("");
  const [userss, setFilteredUsers] = useState([]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  const modalRef = useRef(null);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isModalOpen]);

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

  useEffect(() => {
    const pageFromUrl = Number.parseInt(searchParams.get("page")) || 1;
    setCurrentPage(pageFromUrl);
    fetchUsers(pageFromUrl);
  }, [searchParams]);

  useEffect(() => {
      if (!search) {
        setFilteredUsers(users)
      } else {
        const lower = search.toLowerCase()
        setFilteredUsers(
          users.filter(u =>
            (u.email || "").toLowerCase().includes(lower) ||
            (u.firstName || "").toLowerCase().includes(lower) ||
            (u.lastName || "").toLowerCase().includes(lower)
          )
        )
      }
    }, [search, users])

  const fetchUsers = async (page) => {
    try {
      setLoading(true);
      setError("");
      console.log("Fetching users for page:", page);
      const response = await fetch(
        `/api/users?page=${page}&pageSize=${pageSize}`,
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
      setUsers(data.results || []);
      setFilteredUsers(data.results || [])
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to load users: ${err.message}`);
      setUsers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() ?? "").includes(search.toLowerCase())
    );
  });

  const updateUrlParams = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleRowClick = async (user) => {
    setSelectedMachine(user);
    setIsModalOpen(true);
    setFromDate("");
    setToDate("");
    setReportingData(null);
    setVenueData(null);
    setReportError("");

    // Fetch venue data immediately when modal opens
    try {
      const venueResponse = await fetch(
        `/api/user-venue?machineId=${user.id}`
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
      setReportError("No user selected");
      return;
    }

    setLoadingReport(true);
    setReportError("");

    try {
      // Format dates for the API (add time components)
      const startDateTime = `${fromDate}T00:00:00`;
      const endDateTime = `${toDate}T23:59:59`;

      console.log("Fetching sales data for user:", selectedMachine.id);

      const response = await fetch(
        `/api/user-sales?machineId=${selectedMachine.id}&startDate=${startDateTime}&endDate=${endDateTime}`
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
      <div className="p-8 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-6 w-64"></div>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-16 bg-gray-100"></div>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-50 border-t border-gray-200"
              ></div>
            ))}
          </div>
        </div>
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
                Error Loading Users
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => fetchUsers(currentPage)}
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
          <p className="text-gray-800">Users</p>
        </h1>
        {/* <p className="text-gray-600">
          Showing {users.length} of {totalCount} users
        </p> */}
      </div>
      <input
        type="text"
        placeholder="Search by email or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 px-3 py-2 border rounded w-full"
      />

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Account Owner
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                  Operator
                </th>
                {/* <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
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
                </th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr
                    key={user.id}
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
                          {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.lastName || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.isAccountOwner === true ? "Yes" : "No"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.isOperator === true ? "Yes" : "No"}
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

      {/* Modal */}
      {isModalOpen && selectedMachine && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-3xl flex items-center justify-center z-50 px-4"
          ref={modalRef}
        >
          {/* <button
            onClick={closeModal}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors fixed top-12 right-4 z-50"
          >
            <X className="h-5 w-5 text-red-600" />
          </button> */}
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex overflow-hidden">
            {/* Left Panel - User Details (30%) */}
            <div className="w-[30%] bg-gray-50 p-6 border-r border-gray-200 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "black" }}>
                  User Details
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
                    // onClick={handleDateRangeSubmit}
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
