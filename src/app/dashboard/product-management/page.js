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
import productApi from "@/app/utils/axios/productApi";
import { AuthService, api } from "@/app/lib/auth"

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [lastKey, setLastKey] = useState(null)
  const [hasNextPage, setHasNextPage] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    isActive: true,
    supplierId: "",
  });
  const [limit, setLimit] = useState(10); // dynamic limit
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

  const AWS_BASE_URL = 'https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge';
  const AUTH_TOKEN = 'ZnJ5ZGdlQDEyMzQhQCM=';
  const pageSize = 10

  // Mock
  const allSuppliers = [
    { id: "1", name: "Supplier A" },
    { id: "2", name: "Supplier B" },
    { id: "3", name: "Supplier C" },
  ];

  // Pagination state
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);

  const startIndex = (page - 1) * itemsPerPage;
  const paginatedProducts = products.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // const hasNextPage = startIndex + itemsPerPage < products.length;

  const handleNextPage = () => {
    if (hasNextPage && lastKey) {
      fetchUsers(lastKey)
    }
  }

  const handleRefresh = () => {
    setPage(1);
  };

  const handleAssignSupplier = (productId, supplierId) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, supplierId } : p))
    );
  };

  const handleManage = (product) => {
    setSelectedProduct(product);
    setIsManageModalOpen(true);
  };

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Function to Perform Create
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

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
      supplierId: product.supplierId || "",
    });
    setShowEditProductModal(true);
  };

  // Function to Perform Update
  const handleUpdateProduct = () => {
    setUpdatingProduct(true);

    setProducts((prev) =>
      prev.map((p) => (p.id === editingProductId ? { ...p, ...formData } : p))
    );

    setUpdatingProduct(false);
    setShowEditProductModal(false);
  };

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

  const fetchProducts = async (useLastKey = null) => {
    try {
      // const customHeader = {
      //   "Content-Type": "application/json",
      //   Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
      // };

      // const res = await productApi.getAll(limit, customHeader);
      // console.log("res", res)

      console.log("Fetching products...")
      
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
      const newLastKey = data.lastKey || null


      // setProducts(products_data.data.products || []); // depends on your API response
      setProducts(fetchedProducts)
      setLastKey(newLastKey)
      setHasNextPage(!!newLastKey)
    } catch (error) {
      console.error("Failed to load products", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [limit]); // refetch when limit changes

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
            // onClick={() => fetchUsers()}
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
        suppliers={allSuppliers}
        onManage={handleManage}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      {/* Pagination Controls */}
      <PaginationControls
        paginatedItems={paginatedProducts}
        hasNextPage={hasNextPage}
        onRefresh={handleRefresh}
        onNextPage={handleNextPage}
      />

      {/* Modal */}
      {isManageModalOpen && (
        <ManageProductsModal
          product={selectedProduct}
          suppliers={allSuppliers}
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
          allSuppliers={allSuppliers}
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
