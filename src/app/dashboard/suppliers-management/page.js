"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Users,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  X,
  Crown,
  Trash2,
  RefreshCw,
} from "lucide-react"
import Loader from "@/app/components/Loader"
import { api } from "@/app/lib/auth"

function SuppliersPageContent() {
  const [suppliers, setSuppliers] = useState()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  // CRUD state
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [updatingSupplier, setUpdatingSupplier] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [allSuppliers, setAllSuppliers] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const searchTimeoutRef = useRef(null)
  const isFetchingAllRef = useRef(false)
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [createError, setCreateError] = useState("")
  const [editError, setEditError] = useState("")
  const pageSize = 10;
  // cursor pagination
  const [supplierLastKey, setSupplierLastKey] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  // cache + page index
  const supplierPageCacheRef = useRef({});
  const supplierCurrentPageRef = useRef(0);
  // Form states
  const [formData, setFormData] = useState({
    supplierId: "",
    companyName: "",
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    productsSupplied: [],
    isActive: false,
  },)
  // Edit form states (only editable fields)
  const [editFormData, setEditFormData] = useState({
    supplierId: "",
    companyName: "",
    contactName: "",
    contactEmail: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    productsSupplied: [],
    isActive: false,
  })

  const openCreateModal = () => {
    setFormData({
      supplierId: "",
      companyName: "",
      name: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      productsSupplied: [],
      isActive: false,
    },)
    setCreateError("")
    setShowCreateModal(true)
  }

  const filterSuppliers = suppliers?.filter(
    (s) =>
      s.companyName?.toLowerCase().includes(search?.toLowerCase()) ||
      s.contactName?.toLowerCase().includes(search?.toLowerCase()) ||
      s.supplierId?.toLowerCase().includes(search?.toLowerCase())
  )

  const handleCreateSupplier = async (supplierData) => {

    try {
      setCreatingSupplier(true);

      const response = await api.createSuppliers(supplierData);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create supplier");
      }

      const createdSupplier = await response.json();

      // 🔁 Reset pagination & refetch first page
      supplierCurrentPageRef.current = 0;
      supplierPageCacheRef.current = {};
      setSupplierLastKey(null);

      await fetchSuppliers(null);

    } catch (error) {
      console.error("Create supplier error:", error);
    } finally {
      setCreatingSupplier(false);
      setShowCreateModal(false)
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setFormData({
      firstName: "",
      lastName: "",
      dsbEmail: "",
      dsbPassword: "",
      dsbConfirmPassword: "",
      vlEmail: "",
      vlPassword: "",
      vlConfirmPassword: "",
      dsbUserRole: "driver",
      isOperator: false,
      isAccountOwner: false,
    })
    setCreateError("")
  }

  const openEditSupplierModal = (supplier) => {
    setSelectedSupplier(supplier);
    setEditFormData({ ...supplier })
    setShowEditModal(true)
  }

  const handleUpdateSupplier = async (supplierId, updatedData) => {
    try {
      setUpdatingSupplier(true);

      // Optimistic update
      const previousSuppliers = [...suppliers];
      setSuppliers((prev) =>
        prev.map((s) =>
          s.supplierId === supplierId ? { ...s, ...updatedData } : s
        )
      );

      const response = await api.updateSuppliers({
        supplierId,
        ...updatedData,
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      await response.json();

      setSelectedSupplier(null);

    } catch (error) {
      console.error("Update supplier error:", error);

      // rollback
      setSuppliers(previousSuppliers);
    } finally {
      setUpdatingSupplier(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false)
    setSelectedSupplier(null)
    setEditFormData({
      firstName: "",
      lastName: "",
      dsbEmail: "",
      dsbUserRole: "driver",
      isOperator: false,
      isAccountOwner: false,
    })
    setEditError("")
  }

  const openDeleteSupplierModal = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true)
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      setDeletingSupplier(true);

      const response = await api.deleteSupplier({
        supplierId: selectedSupplier.supplierId,
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      // Remove from UI
      setSuppliers((prev) =>
        prev.filter((s) => s.supplierId !== selectedSupplier.supplierId)
      );

      // Clear cache & reload page
      supplierPageCacheRef.current = {};
      supplierCurrentPageRef.current = 0;
      await fetchSuppliers(null);

      setSelectedSupplier(null);

    } catch (error) {
      console.error("Delete supplier error:", error);
    } finally {
      setDeletingSupplier(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setSelectedSupplier(null)
  }

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleEditAddressChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleNextPage = () => {
    if (!hasNextPage) return;

    const nextPage = supplierCurrentPageRef.current + 1;

    // serve from cache
    if (supplierPageCacheRef.current[nextPage]) {
      supplierCurrentPageRef.current = nextPage;

      const cached = supplierPageCacheRef.current[nextPage];
      setSuppliers(cached.items);
      setSupplierLastKey(cached.lastKey);

      setHasPrevPage(true);
      setHasNextPage(cached.items.length === pageSize);
      return;
    }

    // API call
    supplierCurrentPageRef.current = nextPage;
    fetchSuppliers(supplierLastKey);
  };

  const handlePrevPage = () => {
    if (supplierCurrentPageRef.current === 0) return;

    const prevPage = supplierCurrentPageRef.current - 1;
    const cached = supplierPageCacheRef.current[prevPage];
    if (!cached) return;

    supplierCurrentPageRef.current = prevPage;

    setSuppliers(cached.items);
    setSupplierLastKey(cached.lastKey);

    setHasPrevPage(prevPage > 0);
    setHasNextPage(true);
  };

  const fetchSuppliers = async (lastKey = null) => {
    try {
      setLoading(true);

      const response = await api.getSuppliers({
        limit: pageSize,
        lastKey,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const fetchedSuppliers = data.suppliers || [];
      const newLastKey = data.lastKey || null;

      // cache current page
      supplierPageCacheRef.current[supplierCurrentPageRef.current] = {
        items: fetchedSuppliers,
        lastKey: newLastKey,
      };

      setSuppliers(fetchedSuppliers);
      setSupplierLastKey(newLastKey);

      // pagination flags
      setHasNextPage(fetchedSuppliers.length === pageSize);
      setHasPrevPage(supplierCurrentPageRef.current > 0);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supplierCurrentPageRef.current = 0;
    supplierPageCacheRef.current = {};
    fetchSuppliers(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 space-y-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error Loading Suppliers</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                // onClick={() => fetchUsers()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <Users className="h-10 w-10 text-blue-600" />
          <span className="text-gray-800">Suppliers</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {suppliers?.length} suppliers</span>
          {searchLoading && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Loading search data... ({fetchProgress.current}/{fetchProgress.total})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-end gap-3">
          <button
            // onClick={() => fetchUsers()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Supplier
          </button>
        </div>
      </div>

      <div className="mb-4 relative w-full p-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center bg-white rounded-full px-3">
          <Search className="w-5 h-5 text-gray-500 mr-2 absolute right-3" />
          <input
            type="text"
            placeholder={
              allSuppliers?.length > 0 ? `Search through all ${allSuppliers?.length} suppliers...` : "Search by name, email, or ID..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 bg-transparent outline-none text-gray-900"
          />
        </div>
      </div>

      {search && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            Found {filterSuppliers.length} user{filterSuppliers?.length !== 1 ? "s" : ""} matching "{search}"
            {allSuppliers?.length > 0
              ? ` (searching through ${allSuppliers?.length} total suppliers)`
              : " (searching current page only)"}
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Supplier ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Contact Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Contct Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">isActive</th>
                <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filterSuppliers?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">{search ? `No suppliers found matching "${search}"` : "No suppliers found"}</p>
                  </td>
                </tr>
              ) : (
                filterSuppliers?.map((supplier, index) => (
                  <tr
                    key={supplier?.supplierId}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors duration-200`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm mr-3">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{supplier.supplierId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.companyName || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{supplier.contactEmail || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${supplier.dsbUserRole === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}
                      >
                        {supplier.phone || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${supplier.isAccountOwner ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {supplier.isActive ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Yes
                          </>
                        ) : (
                          "No"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex text-xs items-center gap-3">

                        {/* Product Management */}
                        {/* <button
                          onClick={() => openProductsModal(supplier)}
                          className="text-green-600 hover:underline"
                        >
                          Product Management
                        </button> */}

                        {/* Edit */}
                        <button
                          onClick={() => openEditSupplierModal(supplier)}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => openDeleteSupplierModal(supplier)}
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

      {/* Pagination Controls */}
      {(
        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <span className="text-sm text-gray-600">
            Showing {suppliers?.length} suppliers
          </span>

          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className={`px-3 flex py-2 rounded ${hasPrevPage
                ? "bg-gray-100 hover:bg-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </button>

            <button
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className={`px-3 py-2 flex rounded ${hasNextPage
                ? "bg-gray-100 hover:bg-gray-200"
                : "bg-gray-50 text-gray-400 cursor-not-allowed"
                }`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}



      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Create New Supplier</h3>
                <button onClick={closeCreateModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Supplier Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Supplier Information
                </h3>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Enter  name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="Enter email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => handleInputChange("isActive", e.target.value === "true")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mt-4">
                  Address
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                    <input
                      type="text"
                      value={formData.address?.street || ""}
                      onChange={(e) => handleAddressChange("street", e.target.value)}
                      placeholder="Enter street"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.address?.city || ""}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                      placeholder="Enter city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.address?.state || ""}
                      onChange={(e) => handleAddressChange("state", e.target.value)}
                      placeholder="Enter state"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP</label>
                    <input
                      type="text"
                      value={formData.address?.zip || ""}
                      onChange={(e) => handleAddressChange("zip", e.target.value)}
                      placeholder="Enter ZIP code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.address?.country || ""}
                      onChange={(e) => handleAddressChange("country", e.target.value)}
                      placeholder="Enter country"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeCreateModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateSupplier(formData)}
                disabled={creatingSupplier}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {creatingSupplier && <Loader2 className="h-4 w-4 animate-spin" />}
                {creatingSupplier ? "Creating..." : "Create Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Edit User Modal */}
      {showEditModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">Edit Supplier</h3>
                <button onClick={closeEditModal} className="p-2 text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Supplier Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Supplier Information
                </h3>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={editFormData?.companyName}
                    onChange={(e) => handleEditInputChange("companyName", e.target.value)}
                    placeholder="Enter company name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={editFormData?.name}
                      onChange={(e) => handleEditInputChange("name", e.target.value)}
                      placeholder="Enter name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                    <input
                      type="email"
                      value={editFormData?.email}
                      onChange={(e) => handleEditInputChange("email", e.target.value)}
                      placeholder="Enter  email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="text"
                      value={editFormData?.phone}
                      onChange={(e) => handleEditInputChange("phone", e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Active</label>
                    <select
                      value={editFormData?.isActive}
                      onChange={(e) => handleEditInputChange("isActive", e.target.value === "true")}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mt-4">
                  Address
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                    <input
                      type="text"
                      value={editFormData?.address?.street || ""}
                      onChange={(e) => handleEditAddressChange("street", e.target.value)}
                      placeholder="Enter street"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={editFormData?.address?.city || ""}
                      onChange={(e) => handleEditAddressChange("city", e.target.value)}
                      placeholder="Enter city"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={editFormData?.address?.state || ""}
                      onChange={(e) => handleEditAddressChange("state", e.target.value)}
                      placeholder="Enter state"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP</label>
                    <input
                      type="text"
                      value={editFormData?.address?.zip || ""}
                      onChange={(e) => handleEditAddressChange("zip", e.target.value)}
                      placeholder="Enter ZIP code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      value={editFormData?.address?.country || ""}
                      onChange={(e) => handleEditAddressChange("country", e.target.value)}
                      placeholder="Enter country"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSupplier(selectedSupplier.supplierId, editFormData)}
                disabled={updatingSupplier}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updatingSupplier && <Loader2 className="h-4 w-4 animate-spin" />}
                {updatingSupplier ? "Updating..." : "Update Supplier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Supplier</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete Supplier "{selectedSupplier.contactName}"? This action
                cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSupplier}
                  disabled={deletingUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {deletingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deletingUser ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {
        isProductModalOpen && selectedSupplier &&
        <ProductsPage
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
        />

      }
    </div>
  )
}

export default function SuppliersManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <Loader />
      </div>
    }>
      <SuppliersPageContent />
    </Suspense>
  )
}

function ProductsTable({ products, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full ">

          <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Product Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">SKU</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Price</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Quantity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t">
                <td className="px-4 py-3 font-medium">{product.name}</td>
                <td className="px-4 py-3">{product.sku}</td>
                <td className="px-4 py-3 text-right">${product.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{product.quantity}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">

                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => onEdit(product)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v12a2 2 0 
                    002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 
                    2 0 112.828 2.828L11.828 15H9v-2.828l9.586-9.586z"
                        />
                      </svg>
                      Edit
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => onDelete(product.id)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 
                    2 0 0116.138 21H7.862a2 2 0 
                    01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 
                    2 0 00-2-2h-4a2 2 0 00-2 2v2m5 0H6"
                        />
                      </svg>
                      Delete
                    </button>

                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>


  )
}

function ProductModal({ isOpen, onClose, onSave, editingProduct }) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
  })

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        sku: editingProduct.sku,
        price: editingProduct.price.toString(),
        quantity: editingProduct.quantity.toString(),
      })
    } else {
      setFormData({
        name: "",
        sku: "",
        price: "",
        quantity: "",
      })
    }
  }, [editingProduct, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: formData.name,
      sku: formData.sku,
      price: Number.parseFloat(formData.price),
      quantity: Number.parseInt(formData.quantity),
    })
  }

  return (

    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">

        {/* HEADER */}
        <div className="mb-4 flex justify-center flex-col items-center">
          <h3 className="text-2xl font-semibold text-gray-800">
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <p className="text-sm text-gray-500">
            {editingProduct
              ? "Update the product details below"
              : "Enter the product details to add a new product"}
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PRODUCT NAME */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Product Name
            </label>
            <input
              id="name"
              name="name"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter product name"
              required
            />
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
              value={formData.sku}
              onChange={handleChange}
              placeholder="Enter SKU"
              required
            />
          </div>

          {/* PRICE + QUANTITY */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
            >
              {editingProduct ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>


  )
}

function ProductsPage({ onClose }) {
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [products, setProducts] = useState(mockProducts)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const currentProducts = selectedSupplierId ? products[selectedSupplierId] || [] : []

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDeleteProduct = (productId) => {
    setProducts((prev) => ({
      ...prev,
      [selectedSupplierId]: prev[selectedSupplierId].filter((p) => p.id !== productId),
    }))
  }

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      // Update existing product
      setProducts((prev) => ({
        ...prev,
        [selectedSupplierId]: prev[selectedSupplierId].map((p) =>
          p.id === editingProduct.id ? { ...productData, id: p.id } : p,
        ),
      }))
    } else {
      // Add new product
      const newProduct = {
        ...productData,
        id: `p${Date.now()}`,
      }
      setProducts((prev) => ({
        ...prev,
        [selectedSupplierId]: [...(prev[selectedSupplierId] || []), newProduct],
      }))
    }
    setIsModalOpen(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl min-h-[400px] max-h-[90vh] overflow-y-auto p-6">

        {/* Header */}
        <div className="mb-6 relative flex justify-center">
          <div className="flex justify-center items-center flex-col">
            <h3 className="text-2xl font-bold text-gray-800">Products Management</h3>
            <p className="text-gray-500">Select a supplier to view and manage their products</p>
          </div>
          <button onClick={onClose} className="p-2 absolute top-0 right-0 text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Supplier Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Supplier</label>

          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
          >
            <option value="">Choose a supplier...</option>

            {mockSuppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products Section */}
        {selectedSupplierId ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Products for {mockSuppliers.find((s) => s.id === selectedSupplierId)?.name}
              </h2>

              {/* Add Product Button */}
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                </svg>
                Add Product
              </button>
            </div>

            {/* Products Table */}
            {currentProducts.length > 0 ? (
              <ProductsTable
                products={currentProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No products found for this supplier. Click "Add Product" to create one.
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Please select a supplier to view their products
          </div>
        )}
      </div>
      {isModalOpen &&
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          editingProduct={editingProduct}
        />}
    </div>

  )
}
