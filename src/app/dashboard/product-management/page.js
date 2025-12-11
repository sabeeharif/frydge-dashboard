"use client";

import React, { Suspense, useEffect, useState } from "react";
import { PackageSearch, RefreshCw, Plus } from "lucide-react";
import Loader from "@/app/components/Loader";
import ManageProductsModal from "@/app/components/products/ManageProductsModal";
import ProductTable from "@/app/components/products/ProductTable";
import PaginationControls from "@/app/components/products/PaginationControls";
import CreateProductModal from "@/app/components/products/CreateProductModal";
import EditProductModal from "@/app/components/products/EditProductModal";
import DeleteModal from "@/app/components/products/DeleteModal";
import { AuthService, api } from "@/app/lib/auth"

const ProductManagement = () => {
  // States
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    supplierId: "",
    productCategoryId: "",
    externalId: "",
    costPrice: "",
  });
  const [limit, setLimit] = useState(10); // dynamic limit
  const [suppliers, setSuppliers] = useState([]);
  const [supplierLastKey, setSupplierLastKey] = useState(null);
  const [hasMoreSuppliers, setHasMoreSuppliers] = useState(false);
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  // Modal State
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  // Products State
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const pageSize = 10

  // Pagination state
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const hasNextPage = startIndex + itemsPerPage < products.length;
  const hasPrevPage = page > 1;

  // Handle next page
  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  // Handle previous page
  const handlePrevPage = () => {
    if (hasPrevPage) {
      setPage(page - 1);
    }
  };

  const handleRefresh = () => {};

  // Update suppliers
  const handleAssignSupplier = async (productId, supplierId) => {
    try {
      // 1️⃣ Immediately update UI (optimistic update)
      setProducts((prev) =>
        prev.map((p) => (p.productId === productId ? { ...p, supplierId } : p))
      );

      // 2️⃣ Send update to backend
      const response = await api.updateProduct({
        productId: productId, supplierId: supplierId, productCategoryId: "",
        costPrice: ""
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier");
      }

      console.log("Supplier assigned successfully");

    } catch (error) {
      console.error("Error assigning supplier:", error);

      // 3️⃣ Optional: Undo UI change on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === productId ? { ...p, supplierId: null } : p
        )
      );
    }
  };

  // Modal
  const handleManage = (product) => {
    setSelectedProduct(product);
    setIsManageModalOpen(true);
  };

  // Input Form
  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Create Product
  const handleCreateProduct = () => {
    setCreatingProduct(true);

    const newProduct = {
      id: products.length + 1,
      ...formData,
    };

    setProducts((prev) => [...prev, newProduct]);

    setCreatingProduct(false);
    setShowCreateProductModal(false);

    // Reset form
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      isActive: true,
      supplierId: "",
    });
  };

  // Modal
  const closeCreateProductModal = () => {
    setShowCreateProductModal(false);

    // Optional: reset form after closing
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      isActive: true,
      supplierId: "",
    });
  };

  // Modal
  const openEditModal = (product) => {
    setEditingProductId(product.productId);

    setFormData({
      name: product.name || "",
      supplierId: product.supplierId || "",
      productCategoryId: product.productCategoryId || "",
      externalId: product.externalId || "",
      costPrice: product.costPrice || "",
    });

    setShowEditProductModal(true);
  };

  // Update Product
  const handleUpdateProduct = async () => {
    setUpdatingProduct(true);

    // Backup previous state in case API fails
    const previousProducts = [...products];

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.productId === editingProductId ? { ...p, ...formData } : p))
    );

    try {
      // Call the API
      const response = await api.updateProduct({ productId: editingProductId, ...formData });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      const updated = await response.json();
      console.log("Product updated successfully:", updated);

      // Close modal on success
      setShowEditProductModal(false);

    } catch (error) {
      console.error("Update failed:", error);

      // Rollback on API error
      setProducts(previousProducts);

      alert("Failed to update product. Please try again.");
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Remove Product
  const handleDelete = (product) => {
    setSelectedProduct(product); // store the product to delete
    setShowDeleteProductModal(true); // open modal
  };

  // Function to Perform Deletion
  const confirmDeleteProduct = () => {
    setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
    setShowDeleteProductModal(false);
    setSelectedProduct(null);
  };

  // Fetch
  const fetchProducts = async (useLastKey = null) => {
    try {
      let apiUrl = `/api/products?limit=${pageSize}`
      if (useLastKey) {
        apiUrl += `&lastKey=${encodeURIComponent(useLastKey)}`
      }

      const response = await api.getProducts({
        limit: pageSize,
        lastKey: useLastKey
      })
      console.log("Client fetch response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Client received data:", data)

      // Handle different response structures
      const fetchedProducts = data.products || data.results || []
      setProducts(fetchedProducts)
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  // Fetch
  const fetchSuppliers = async (useLastKey = null) => {
    try {
      const response = await api.getSuppliers({
        limit: supplierPageSize,   // dynamic limit
        lastKey: useLastKey        // pagination key
      });

      console.log("Supplier fetch response:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("Supplier data received:", data);

      const fetchedSuppliers = data.suppliers || data.results || [];
      const newLastKey = data.lastKey || null;

      setSuppliers(fetchedSuppliers);
      setSupplierLastKey(newLastKey);
      setHasMoreSuppliers(!!newLastKey);

    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [limit]); // refetch when limit changes

  useEffect(() => {
    fetchSuppliers();
  }, [supplierPageSize]);



  return (
    <div className="p-8 space-y-8">
      {/* Head */}
      <div className="">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <PackageSearch className="h-10 w-10 text-blue-600" />
          <span className="text-gray-800">Products</span>
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Showing {products?.length} products</span>
        </div>
      </div>

      {/* Head - 2 */}
      <div className="">
        <div className="flex justify-end gap-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateProductModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Product
          </button>
        </div>
      </div>

      {/* Table */}
      <ProductTable
        products={paginatedProducts}
        suppliers={suppliers}
        onManage={handleManage}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <PaginationControls
        paginatedItems={paginatedProducts}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onRefresh={handlePrevPage}
        onNextPage={handleNextPage}
      />

      {/* Modal */}
      {isManageModalOpen && (
        <ManageProductsModal
          product={selectedProduct}
          suppliers={suppliers}
          onAssign={handleAssignSupplier}
          onClose={() => setIsManageModalOpen(false)}
        />
      )}

      {showCreateProductModal && (
        <CreateProductModal
          closeModal={closeCreateProductModal}
          handleCreateProduct={handleCreateProduct}
          creatingProduct={creatingProduct}
          formData={formData}
          handleInputChange={handleInputChange}
          allSuppliers={allSuppliers}
        />
      )}

      {showEditProductModal && (
        <EditProductModal
          closeModal={() => setShowEditProductModal(false)}
          updatingProduct={updatingProduct}
          handleUpdateProduct={handleUpdateProduct}
          formData={formData}
          handleInputChange={handleInputChange}
          allSuppliers={suppliers}
        />
      )}

      {showDeleteProductModal && (
        <DeleteModal
          open={showDeleteProductModal}
          onClose={() => setShowDeleteProductModal(false)}
          onDelete={confirmDeleteProduct}
        />
      )}
    </div>
  );
};

export default function ProductManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen w-full bg-gray-100">
          <Loader />
        </div>
      }
    >
      <ProductManagement />
    </Suspense>
  );
}
